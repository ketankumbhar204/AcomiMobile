import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/adminApi';
import type { AdminRegisteredUser, AdminRegisteredUsersSummary } from '../../api/types';
import { AdminLeadCard, adminList } from '../../components/admin';
import { ListSearchBar } from '../../components/ui';
import type { AdminStackParamList } from '../../navigation/types';
import {
  formatAdminAssociatedSpaces,
  formatAdminDate,
  formatAdminOnboardingStatus,
  formatAdminUserMobile,
  formatAdminUserName,
  formatAdminUserRole,
} from '../../utils/adminLabels';
import { colors, radius, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminRegisteredUsers'>;
type StatKey = 'total' | 'verified' | 'new' | 'spaces';

function isoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function AdminRegisteredUsersScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [users, setUsers] = useState<AdminRegisteredUser[]>([]);
  const [summary, setSummary] = useState<AdminRegisteredUsersSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [activeStat, setActiveStat] = useState<StatKey | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [spaceAssociation, setSpaceAssociation] = useState<'' | 'WITH_SPACE'>('');
  const [registeredFrom, setRegisteredFrom] = useState('');
  const [registeredTo, setRegisteredTo] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await adminApi.getRegisteredUsersSummary());
    } catch {
      setSummary(null);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await adminApi.listRegisteredUsers({
        q: debouncedQ || undefined,
        verified: verified === null ? undefined : verified,
        spaceAssociation: spaceAssociation || undefined,
        from: registeredFrom || undefined,
        to: registeredTo || undefined,
        size: 100,
        page: 0,
      });
      setUsers(page.content);
    } catch {
      setUsers([]);
      setError(t('admin.users.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, registeredFrom, registeredTo, spaceAssociation, t, verified]);

  useFocusEffect(
    useCallback(() => {
      void loadSummary();
      void loadUsers();
    }, [loadSummary, loadUsers]),
  );

  function clearFilters() {
    setSearch('');
    setDebouncedQ('');
    setActiveStat(null);
    setVerified(null);
    setSpaceAssociation('');
    setRegisteredFrom('');
    setRegisteredTo('');
  }

  function applyStatFilter(key: StatKey) {
    setSearch('');
    setDebouncedQ('');
    if (activeStat === key) {
      clearFilters();
      return;
    }
    setActiveStat(key);
    if (key === 'total') {
      setVerified(null);
      setSpaceAssociation('');
      setRegisteredFrom('');
      setRegisteredTo('');
      return;
    }
    if (key === 'verified') {
      setVerified(true);
      setSpaceAssociation('');
      setRegisteredFrom('');
      setRegisteredTo('');
      return;
    }
    if (key === 'new') {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      setVerified(null);
      setSpaceAssociation('');
      setRegisteredFrom(isoDate(from));
      setRegisteredTo(isoDate(to));
      return;
    }
    setVerified(null);
    setSpaceAssociation('WITH_SPACE');
    setRegisteredFrom('');
    setRegisteredTo('');
  }

  const stats = useMemo(
    () => [
      {
        key: 'total' as const,
        label: t('admin.users.stats.total'),
        value: summary?.totalUsers ?? 0,
      },
      {
        key: 'verified' as const,
        label: t('admin.users.stats.verified'),
        value: summary?.verifiedUsers ?? 0,
      },
      {
        key: 'new' as const,
        label: t('admin.users.stats.new30'),
        value: summary?.newUsersLast30Days ?? 0,
      },
      {
        key: 'spaces' as const,
        label: t('admin.users.stats.withSpace'),
        value: summary?.withSpaceAssociation ?? 0,
      },
    ],
    [summary, t],
  );

  return (
    <View style={styles.root}>
      <Text style={styles.hint}>{t('admin.users.hint')}</Text>
      <View style={styles.statsRow}>
        {stats.map(stat => {
          const selected = activeStat === stat.key;
          return (
            <Pressable
              key={stat.key}
              onPress={() => applyStatFilter(stat.key)}
              style={[styles.statCard, selected && styles.statCardSelected]}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel} numberOfLines={2}>
                {stat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.search}>
        <ListSearchBar
          value={search}
          onChangeText={text => {
            setSearch(text);
            setActiveStat(null);
          }}
          placeholder={t('admin.users.searchPlaceholder')}
        />
      </View>
      {(activeStat || debouncedQ) && (
        <Pressable onPress={clearFilters} style={styles.clearBtn}>
          <Text style={styles.clearText}>{t('admin.users.filters.clear')}</Text>
        </Pressable>
      )}
      <View style={styles.actions}>
        <Pressable
          style={adminList.addBtn}
          onPress={() => navigation.navigate('AdminCreateTestUser')}>
          <Text style={adminList.addBtnText}>{t('admin.users.createTestUser')}</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AdminLeadCard
              title={formatAdminUserName(item.fullName)}
              subtitle={`${formatAdminUserMobile(item.mobileNumber)} · ${
                item.mobileVerified ? t('admin.labels.verified') : t('admin.labels.notVerified')
              }`}
              meta={`${formatAdminUserRole(item.selectedRole)} · ${formatAdminOnboardingStatus(
                item.onboardingStatus,
              )} · ${formatAdminDate(item.registeredAt)}`}
              sourceLabel={formatAdminAssociatedSpaces(item.spaces)}
              testLead={item.testUser ? true : undefined}
              onPress={() => navigation.navigate('AdminRegisteredUserDetail', { user: item })}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t('admin.users.empty')}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    minHeight: 72,
  },
  statCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  search: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  clearBtn: {
    alignSelf: 'flex-start',
    marginLeft: spacing.md,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  clearText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  actions: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    alignItems: 'flex-start',
  },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  empty: {
    textAlign: 'center',
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
});
