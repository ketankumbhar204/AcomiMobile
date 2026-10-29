import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight, Clock, Phone, Search, UserRound, Utensils, Users } from 'lucide-react-native';
import type { MealType, UUID } from '../../api/types';
import { ListFilterChips } from '../../components/ui/ListFilterChips';
import { EmptyState, Screen, SkeletonCard } from '../../components/ui';
import { useMealHeadcountDetail } from '../../hooks/useMealHeadcountDetail';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import type { MainStackParamList } from '../../navigation/types';
import { colors, pastels, radius, shadows, spacing, typography } from '../../theme';
import { formatMemberContactNumber } from '../../utils/indianMobile';
import { formatMenuDate } from '../../utils/mealDates';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import {
  buildMealResponseLists,
  matchesMealResponseSearch,
  mealResponseCardStatus,
  type MealResponseFilter,
  type MealResponseMemberRow,
} from '../../utils/mealResponseMembers';

type MealResponseMembersScreenProps = {
  spaceId: UUID;
  menuDate: string;
  mealType: MealType;
};

const AVATAR_TONES = [pastels.green, pastels.purple, pastels.orange, pastels.blue] as const;

const STATUS_TONE: Record<
  MealResponseFilter,
  { fg: string; bg: string; Icon: typeof Check }
> = {
  eligible: { fg: pastels.green.fg, bg: pastels.green.bg, Icon: UserRound },
  responded: { fg: pastels.blue.fg, bg: pastels.blue.bg, Icon: Check },
  not_responded: { fg: pastels.orange.fg, bg: pastels.orange.bg, Icon: Clock },
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function avatarTone(memberId: string) {
  let hash = 0;
  for (let i = 0; i < memberId.length; i += 1) {
    hash = (hash + memberId.charCodeAt(i)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash];
}

export function MealResponseMembersScreen({
  spaceId,
  menuDate,
  mealType,
}: MealResponseMembersScreenProps) {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [filter, setFilter] = useState<MealResponseFilter>('responded');
  const [query, setQuery] = useState('');
  const { loading, detail, error, reload } = useMealHeadcountDetail(
    spaceId,
    menuDate,
    mealType,
    true,
  );
  const lists = useMemo(() => buildMealResponseLists(detail), [detail]);
  const rows =
    filter === 'eligible'
      ? lists.eligible
      : filter === 'not_responded'
        ? lists.notResponded
        : lists.responded;
  const visibleRows = useMemo(
    () => rows.filter(row => matchesMealResponseSearch(row, query)),
    [query, rows],
  );
  const mealLabel = t(mealTypeLabelKey(mealType));
  const searchPlaceholder = t('meals.responses.searchPlaceholder', {
    defaultValue: 'Search by name or mobile',
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('meals.responses.title', { meal: mealLabel, defaultValue: '{{meal}} responses' }),
    });
  }, [mealLabel, navigation, t]);

  const emptyCopy =
    filter === 'responded'
      ? {
          title: t('meals.responses.emptyRespondedTitle', {
            defaultValue: 'No responses yet',
          }),
          description: t('meals.responses.emptyRespondedBody', {
            defaultValue: 'Members who reply to this meal will appear here.',
          }),
        }
      : filter === 'not_responded'
        ? {
            title: t('meals.responses.emptyNotRespondedTitle', {
              defaultValue: 'Everyone has responded',
            }),
            description: t('meals.responses.emptyNotRespondedBody', {
              defaultValue: 'There are no eligible members still waiting to reply.',
            }),
          }
        : {
            title: t('meals.responses.emptyEligibleTitle', {
              defaultValue: 'No eligible members',
            }),
            description: t('meals.responses.emptyEligibleBody', {
              defaultValue: 'No members are eligible for this meal.',
            }),
          };

  const showList = !loading || detail != null;

  return (
    <Screen
      scrollable
      refreshing={loading && detail != null}
      onRefresh={() => {
        reload();
      }}>
      <Text style={styles.subtitle}>
        {t('meals.responses.subtitle', {
          meal: mealLabel,
          date: formatMenuDate(menuDate, i18n.language),
          defaultValue: '{{meal}} · {{date}}',
        })}
      </Text>

      <ListFilterChips
        value={filter}
        onChange={setFilter}
        options={[
          {
            id: 'eligible',
            label: t('meals.responses.filterEligible', { defaultValue: 'Eligible' }),
            badge: lists.eligible.length,
            tone: 'primary',
          },
          {
            id: 'responded',
            label: t('meals.responses.filterResponded', { defaultValue: 'Responded' }),
            badge: lists.responded.length,
            tone: 'info',
          },
          {
            id: 'not_responded',
            label: t('meals.responses.filterNotResponded', { defaultValue: 'Not responded' }),
            badge: lists.notResponded.length,
            tone: 'warning',
          },
        ]}
      />

      {showList && !error ? (
        <View style={styles.searchWrap}>
          <Search size={16} color={colors.muted} strokeWidth={2.2} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel={searchPlaceholder}
          />
        </View>
      ) : null}

      {loading && detail == null ? (
        <View style={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <EmptyState
          Icon={Users}
          title={t('meals.responses.loadErrorTitle', { defaultValue: 'Could not load responses' })}
          description={t('meals.responses.loadErrorBody', {
            defaultValue: 'Pull to refresh, or try again.',
          })}
        />
      ) : visibleRows.length === 0 ? (
        <EmptyState
          Icon={Users}
          title={
            query.trim()
              ? t('meals.responses.searchEmptyTitle', { defaultValue: 'No matching members' })
              : emptyCopy.title
          }
          description={
            query.trim()
              ? t('meals.responses.searchEmptyBody', {
                  defaultValue: 'Try a different name or mobile number.',
                })
              : emptyCopy.description
          }
        />
      ) : (
        <View style={styles.list}>
          {visibleRows.map(row => (
            <ResponseCard
              key={row.memberId}
              row={row}
              filter={filter}
              statusLabel={t(
                rowStatusKey(mealResponseCardStatus(row, filter)),
                { defaultValue: rowStatusFallback(mealResponseCardStatus(row, filter)) },
              )}
              mealLabel={
                row.choice?.trim() ||
                t('meals.poll.notSelected', { defaultValue: 'Not selected' })
              }
              onPress={() =>
                navigateMainStack('MemberDetails', {
                  spaceId,
                  memberId: row.memberId,
                })
              }
            />
          ))}
        </View>
      )}

      <Pressable
        style={styles.editLink}
        onPress={() => navigateMainStack('DailyMenuEdit', { spaceId, menuDate, mealType })}
        accessibilityRole="button">
        <Text style={styles.editLinkText}>
          {t('meals.responses.editMenu', { defaultValue: 'Edit menu' })}
        </Text>
      </Pressable>
    </Screen>
  );
}

function rowStatusKey(status: MealResponseFilter): string {
  if (status === 'eligible') return 'meals.responses.filterEligible';
  if (status === 'not_responded') return 'meals.responses.filterNotResponded';
  return 'meals.responses.filterResponded';
}

function rowStatusFallback(status: MealResponseFilter): string {
  if (status === 'eligible') return 'Eligible';
  if (status === 'not_responded') return 'Not responded';
  return 'Responded';
}

function ResponseCard({
  row,
  filter,
  statusLabel,
  mealLabel,
  onPress,
}: {
  row: MealResponseMemberRow;
  filter: MealResponseFilter;
  statusLabel: string;
  mealLabel: string;
  onPress: () => void;
}) {
  const status = mealResponseCardStatus(row, filter);
  const tone = STATUS_TONE[status];
  const avatar = avatarTone(row.memberId);
  const phone = formatMemberContactNumber(row.mobileNumber);
  const StatusIcon = tone.Icon;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${row.memberName}, ${statusLabel}, ${mealLabel}`}>
      <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
        <Text style={[styles.avatarText, { color: avatar.fg }]}>{initials(row.memberName)}</Text>
      </View>
      <View style={styles.memberCol}>
        <Text style={styles.name} numberOfLines={1}>
          {row.memberName}
        </Text>
        {phone ? (
          <View style={styles.phoneRow}>
            <Phone size={12} color={colors.muted} strokeWidth={2.2} />
            <Text style={styles.phone} numberOfLines={1}>
              {phone}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.divider} />
      <View style={styles.metaCol}>
        <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
          <StatusIcon size={12} color={tone.fg} strokeWidth={2.4} />
          <Text style={[styles.statusText, { color: tone.fg }]} numberOfLines={1}>
            {statusLabel}
          </Text>
        </View>
        <View style={styles.mealRow}>
          <Utensils size={12} color={colors.muted} strokeWidth={2.2} />
          <Text style={styles.meal} numberOfLines={1}>
            {mealLabel}
          </Text>
        </View>
      </View>
      <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
    minWidth: 0,
  },
  list: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardPressed: {
    backgroundColor: colors.hover,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.caption,
    fontWeight: '700',
  },
  memberCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  phone: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  metaCol: {
    width: '38%',
    maxWidth: 148,
    minWidth: 0,
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    maxWidth: '100%',
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
    flexShrink: 1,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  meal: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  editLink: {
    alignSelf: 'flex-start',
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
  },
  editLinkText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
});
