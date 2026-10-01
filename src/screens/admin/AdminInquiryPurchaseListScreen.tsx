import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  inquiryCreditsAdminApi,
  type AdminInquiryPurchaseRow,
  type AdminInquiryPurchaseSummary,
} from '../../api/inquiryCreditsAdminApi';
import type { InquiryCreditPurchaseStatus } from '../../api/inquiryCreditsApi';
import { ApiError } from '../../api/types';
import type { AdminStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';

function statusStyle(status: InquiryCreditPurchaseStatus): { bg: string; fg: string } {
  if (status === 'APPROVED') return { bg: '#DCFCE7', fg: '#15803D' };
  if (status === 'REJECTED') return { bg: '#FEE2E2', fg: '#B91C1C' };
  return { bg: '#FFEDD5', fg: '#C2410C' };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function shortId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function AdminInquiryPurchaseListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const showToast = useToastStore(state => state.showToast);
  const [rows, setRows] = useState<AdminInquiryPurchaseRow[]>([]);
  const [summary, setSummary] = useState<AdminInquiryPurchaseSummary | null>(null);
  const [filter, setFilter] = useState<InquiryCreditPurchaseStatus | ''>('PENDING');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await inquiryCreditsAdminApi.getPurchasesSummary());
    } catch {
      setSummary(null);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await inquiryCreditsAdminApi.listPurchases({
        status: filter,
        size: 50,
      });
      setRows(page.content ?? []);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t('common.errors.generic'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, showToast, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
      void loadSummary();
    }, [load, loadSummary]),
  );

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      row =>
        row.id.toLowerCase().includes(q) ||
        row.userId.toLowerCase().includes(q) ||
        (row.userFullName ?? '').toLowerCase().includes(q) ||
        (row.userMobileNumber ?? '').toLowerCase().includes(q) ||
        row.packageId.toLowerCase().includes(q) ||
        (row.utr ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  function confirmApprove(item: AdminInquiryPurchaseRow) {
    Alert.alert(
      t('admin.credits.approveTitle', {
        defaultValue: 'Approve purchase — {{name}}?',
        name: item.userFullName?.trim() || shortId(item.userId),
      }),
      t('admin.credits.approveBody', {
        defaultValue: 'This will add {{credits}} credits to the user account. UTR: {{utr}}',
        credits: item.credits,
        utr: item.utr || '—',
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.credits.approve', { defaultValue: 'Approve' }),
          onPress: () => void approve(item.id),
        },
      ],
    );
  }

  async function approve(id: string) {
    setBusyId(id);
    try {
      await inquiryCreditsAdminApi.approvePurchase(id);
      showToast(
        t('admin.credits.approved', {
          defaultValue: 'Purchase approved — credits added.',
        }),
      );
      await Promise.all([load(), loadSummary()]);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t('common.errors.generic'));
    } finally {
      setBusyId(null);
    }
  }

  function reject(item: AdminInquiryPurchaseRow) {
    Alert.alert(
      t('admin.credits.rejectTitle', {
        defaultValue: 'Reject purchase — {{name}}?',
        name: item.userFullName?.trim() || shortId(item.userId),
      }),
      t('admin.credits.rejectBody', {
        defaultValue:
          'The purchase request for ₹{{amount}} will be rejected. Credits will not be added.',
        amount: item.amount,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.credits.reject', { defaultValue: 'Reject' }),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyId(item.id);
              try {
                await inquiryCreditsAdminApi.rejectPurchase(item.id);
                showToast(t('admin.credits.rejected', { defaultValue: 'Purchase rejected.' }));
                await Promise.all([load(), loadSummary()]);
              } catch (err) {
                showToast(err instanceof ApiError ? err.message : t('common.errors.generic'));
              } finally {
                setBusyId(null);
              }
            })();
          },
        },
      ],
    );
  }

  const filters: Array<{ id: InquiryCreditPurchaseStatus | ''; label: string }> = [
    { id: 'PENDING', label: t('admin.credits.pending', { defaultValue: 'Pending' }) },
    { id: 'APPROVED', label: t('admin.credits.approvedFilter', { defaultValue: 'Approved' }) },
    { id: 'REJECTED', label: t('admin.credits.rejectedFilter', { defaultValue: 'Rejected' }) },
    { id: '', label: t('admin.credits.all', { defaultValue: 'All' }) },
  ];

  const stats = [
    {
      key: 'pending',
      label: t('admin.credits.pending', { defaultValue: 'Pending' }),
      value: summary?.pendingCount ?? 0,
      fg: '#C2410C',
      bg: '#FFEDD5',
    },
    {
      key: 'approved',
      label: t('admin.credits.approvedFilter', { defaultValue: 'Approved' }),
      value: summary?.approvedCount ?? 0,
      fg: '#15803D',
      bg: '#DCFCE7',
    },
    {
      key: 'rejected',
      label: t('admin.credits.rejectedFilter', { defaultValue: 'Rejected' }),
      value: summary?.rejectedCount ?? 0,
      fg: '#B91C1C',
      bg: '#FEE2E2',
    },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          {t('admin.credits.paymentsSubtitle', {
            defaultValue: 'Review and approve or reject seeker payment requests.',
          })}
        </Text>
        <Pressable
          onPress={() => navigation.navigate('AdminInquiryCreditsConfig')}
          accessibilityRole="button">
          <Text style={styles.linkText}>
            {t('admin.nav.creditsConfig', { defaultValue: 'Credits config' })}
          </Text>
        </Pressable>
        <View style={styles.stats}>
          {stats.map(stat => (
            <View key={stat.key} style={[styles.statCard, { backgroundColor: stat.bg }]}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: stat.fg }]}>{stat.value}</Text>
            </View>
          ))}
        </View>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder={t('admin.credits.searchPlaceholder', {
            defaultValue: 'Filter by name, mobile, UTR…',
          })}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.filters}>
          {filters.map(item => (
            <Pressable
              key={item.id || 'all'}
              onPress={() => setFilter(item.id)}
              style={[styles.chip, filter === item.id && styles.chipOn]}>
              <Text style={[styles.chipText, filter === item.id && styles.chipTextOn]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={visibleRows}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {t('admin.credits.empty', { defaultValue: 'No purchase requests found.' })}
            </Text>
          }
          renderItem={({ item }) => {
            const chip = statusStyle(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.userFullName?.trim() || shortId(item.userId)}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.userMobileNumber || shortId(item.userId)}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
                    <Text style={[styles.statusText, { color: chip.fg }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  {item.credits} credits · ₹{item.amount}
                  {item.utr ? ` · UTR ${item.utr}` : ''}
                </Text>
                <Text style={styles.meta}>{formatDate(item.requestedAt)}</Text>
                {item.status === 'PENDING' ? (
                  <View style={styles.actions}>
                    <Pressable
                      disabled={busyId === item.id}
                      onPress={() => confirmApprove(item)}
                      style={[styles.action, styles.approve]}>
                      <Text style={[styles.actionText, { color: '#15803D' }]}>
                        {t('admin.credits.approve', { defaultValue: 'Approve' })}
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={busyId === item.id}
                      onPress={() => reject(item)}
                      style={[styles.action, styles.reject]}>
                      <Text style={[styles.actionText, { color: '#B91C1C' }]}>
                        {t('admin.credits.reject', { defaultValue: 'Reject' })}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.meta}>
                    {item.verifiedAt ? formatDate(item.verifiedAt) : '—'}
                    {item.status === 'REJECTED' && item.rejectionReason
                      ? ` · ${item.rejectionReason}`
                      : ''}
                  </Text>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, gap: spacing.sm },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  linkText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    borderRadius: radius.card,
    padding: spacing.sm,
    minWidth: 0,
  },
  statLabel: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  statValue: { ...typography.h3, fontWeight: '800', marginTop: 2 },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.mintSubtle, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  chipTextOn: { color: colors.tealDark },
  loader: { marginTop: spacing.xl },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  empty: { ...typography.body, color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  statusChip: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: { ...typography.caption, fontWeight: '800' },
  meta: { ...typography.caption, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: {
    flex: 1,
    borderRadius: radius.button,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approve: { backgroundColor: '#DCFCE7' },
  reject: { backgroundColor: '#FEE2E2' },
  actionText: { ...typography.caption, fontWeight: '800' },
});
