import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react-native';
import { enrollMemberInFullMeals } from '../api/mealsApi';
import { memberApi } from '../api/memberApi';
import {
  DashboardInfoBanner,
} from '../components/dashboard/shared/DashboardGuidedCards';
import {
  DashboardPersonCard,
  type DashboardPersonRoleTone,
  type DashboardStatusTone,
} from '../components/dashboard/shared/DashboardPersonCard';
import { AccommodationSearchBar } from '../components/accommodation/AccommodationSearchBar';
import { Button, HeaderBackButton, ListFilterChips, Screen } from '../components/ui';
import type { ListFilterChipOption } from '../components/ui/ListFilterChips';
import {
  useResidentImportSearch,
  type ResidentPickerItem,
} from '../hooks/useResidentImportSearch';
import type { MainStackParamList } from '../navigation/types';
import { useToastStore } from '../store/toastStore';
import { colors, spacing, typography } from '../theme';
import { invalidateDashboardQueries } from '../utils/dashboardQueryCache';
import { getMembershipErrorMessage } from '../utils/membershipErrors';

type Nav = NativeStackNavigationProp<MainStackParamList, 'ImportExistingPeople'>;
type Route = NativeStackScreenProps<MainStackParamList, 'ImportExistingPeople'>['route'];

type PeopleFilter = 'all' | 'customers' | 'residents' | 'former';

function classifyPerson(item: ResidentPickerItem): {
  filter: Exclude<PeopleFilter, 'all'>;
  roleTone: DashboardPersonRoleTone;
  roleKey: string;
  statusKey: string;
  statusTone: DashboardStatusTone;
} {
  const isResident = item.role === 'TENANT';
  const isCurrentStay =
    item.occupancyStatus === 'ALLOCATED' || item.occupancyStatus === 'RESERVED';
  const isVacatedMember = item.status === 'VACATED';

  if (isResident && isCurrentStay) {
    return {
      filter: 'residents',
      roleTone: 'resident',
      roleKey: 'membership.importPeople.roleResident',
      statusKey: 'membership.importPeople.statusCurrentResident',
      statusTone: 'current',
    };
  }
  if (isResident || isVacatedMember) {
    return {
      filter: 'former',
      roleTone: 'former',
      roleKey: isResident
        ? 'membership.importPeople.roleFormerResident'
        : 'membership.importPeople.roleFormerCustomer',
      statusKey: 'membership.importPeople.statusAvailable',
      statusTone: 'available',
    };
  }
  return {
    filter: 'customers',
    roleTone: 'customer',
    roleKey: 'membership.importPeople.roleCustomer',
    statusKey: 'membership.importPeople.statusAvailable',
    statusTone: 'available',
  };
}

export function ImportExistingPeopleScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId } = route.params;
  const showToast = useToastStore(state => state.showToast);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PeopleFilter>('all');
  const [addingId, setAddingId] = useState<string | null>(null);

  const importSearch = useResidentImportSearch(spaceId, query, { enabled: true });

  const filtered = useMemo(() => {
    if (filter === 'all') {
      return importSearch.members;
    }
    return importSearch.members.filter(m => classifyPerson(m).filter === filter);
  }, [filter, importSearch.members]);

  const counts = useMemo(() => {
    const base = { all: 0, customers: 0, residents: 0, former: 0 };
    for (const m of importSearch.members) {
      base.all += 1;
      base[classifyPerson(m).filter] += 1;
    }
    return base;
  }, [importSearch.members]);

  const chipOptions: ListFilterChipOption<PeopleFilter>[] = [
    {
      id: 'all',
      label: t('membership.importPeople.filterAll', { count: counts.all }),
    },
    {
      id: 'customers',
      label: t('membership.importPeople.filterCustomers', { count: counts.customers }),
      tone: 'info',
    },
    {
      id: 'residents',
      label: t('membership.importPeople.filterResidents', { count: counts.residents }),
    },
    {
      id: 'former',
      label: t('membership.importPeople.filterFormer', { count: counts.former }),
      tone: 'warning',
    },
  ];

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('membership.importPeople.title'),
      headerLeft: () => <HeaderBackButton />,
      headerBackVisible: false,
    });
  }, [navigation, t]);

  const handleAdd = useCallback(
    async (item: ResidentPickerItem) => {
      const key = item.sourceSpaceId
        ? `${item.sourceSpaceId}:${item.memberId}`
        : item.memberId;
      setAddingId(key);
      try {
        let memberId = item.memberId;
        if (item.needsImport) {
          const imported = await memberApi.importMember(spaceId, {
            sourceMemberId: item.memberId,
          });
          memberId = imported.memberId;
        }
        try {
          await enrollMemberInFullMeals(spaceId, memberId);
        } catch {
          // Meal enroll is best-effort; member record still created.
        }
        invalidateDashboardQueries();
        showToast(t('membership.add.importSuccessToast'));
        await importSearch.refetch();
      } catch (err) {
        showToast(getMembershipErrorMessage(err, 'membership.add.importFailed'));
      } finally {
        setAddingId(null);
      }
    },
    [importSearch, showToast, spaceId, t],
  );

  return (
    <Screen contentStyle={styles.screen}>
      <DashboardInfoBanner
        icon={Users}
        title={t('membership.importPeople.banner')}
        badge={t('membership.importPeople.foundBadge', {
          count: importSearch.members.length,
        })}
      />

      <ListFilterChips options={chipOptions} value={filter} onChange={setFilter} />

      <View style={styles.searchWrap}>
        <AccommodationSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('membership.importPeople.searchPlaceholder')}
        />
      </View>

      {importSearch.loading && importSearch.members.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : null}
      {importSearch.error ? (
        <Text style={styles.error}>{importSearch.error}</Text>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={item =>
          item.sourceSpaceId ? `${item.sourceSpaceId}:${item.memberId}` : item.memberId
        }
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const meta = classifyPerson(item);
          const key = item.sourceSpaceId
            ? `${item.sourceSpaceId}:${item.memberId}`
            : item.memberId;
          const busy = addingId === key;
          return (
            <DashboardPersonCard
              name={item.fullName}
              mobile={item.mobileNumber}
              sourceLabel={
                item.alreadyInTargetSpace
                  ? t('membership.add.reuseCard.alreadyHere')
                  : t('membership.add.reuseCard.fromSpace', {
                      space: item.sourceSpaceName ?? '',
                    })
              }
              roleLabel={t(meta.roleKey)}
              roleTone={meta.roleTone}
              statusLabel={t(meta.statusKey)}
              statusTone={meta.statusTone}
              actionLabel={
                busy ? t('common.pleaseWait') : t('membership.add.reuseCard.addAction')
              }
              onAdd={() => void handleAdd(item)}
              disabled={busy || item.alreadyInTargetSpace}
            />
          );
        }}
        ListEmptyComponent={
          !importSearch.loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {t('membership.importPeople.emptyTitle')}
              </Text>
              <Text style={styles.emptyBody}>
                {t('membership.importPeople.emptyBody')}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerHint}>{t('membership.importPeople.createHint')}</Text>
            <Button
              label={t('membership.importPeople.createCta')}
              variant="ghost"
              onPress={() =>
                navigation.navigate('AddMember', { spaceId, initialMode: 'new' })
              }
            />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 0,
  },
  searchWrap: {
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.section,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  error: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  emptyBody: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
  },
  footer: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  footerHint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
  },
});
