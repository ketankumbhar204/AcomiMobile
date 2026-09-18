import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  ChefHat,
  ChevronRight,
  LogOut,
  MapPin,
  MessageCircle,
  Users,
} from 'lucide-react-native';
import { adminApi } from '../../api/adminApi';
import { adminEnquiryApi } from '../../api/enquiryApi';
import type { AdminDashboardSummary, SpaceNotification } from '../../api/types';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import type { AdminStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminDashboard'>;

function isEnquiryNotification(item: SpaceNotification): boolean {
  const type = (item.notificationType ?? '').toUpperCase();
  return type.includes('ENQUIRY') || item.actionRoute === 'AdminEnquiryDetail';
}

function isPaymentNotification(item: SpaceNotification): boolean {
  const type = (item.notificationType ?? '').toUpperCase();
  return type.includes('INQUIRY_CREDIT') || type.includes('PAYMENT');
}

function ManageCard({
  icon: Icon,
  title,
  hint,
  count,
  onPress,
}: {
  icon: typeof Users;
  title: string;
  hint: string;
  count?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.manageCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}>
      <View style={styles.manageIcon}>
        <Icon color={colors.primary} size={20} />
      </View>
      <View style={styles.manageText}>
        <Text style={styles.manageTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.manageHint} numberOfLines={2}>
          {hint}
        </Text>
      </View>
      {count != null ? <Text style={styles.manageCount}>{count}</Text> : null}
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

export function AdminDashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const clearSession = useAuthStore(state => state.clearSession);
  const setAdminMode = useAdminStore(state => state.setAdminMode);
  const user = useAuthStore(state => state.user);

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [notifications, setNotifications] = useState<SpaceNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextSummary, inbox] = await Promise.all([
        adminApi.getDashboardSummary(),
        adminEnquiryApi.listNotifications().catch(() => ({ notifications: [], unreadCount: 0 })),
      ]);
      setSummary(nextSummary);
      setNotifications(inbox.notifications ?? []);
      setUnreadCount(inbox.unreadCount ?? 0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const enquiryAttention = useMemo(
    () =>
      notifications.filter(item => item.status === 'UNREAD' && isEnquiryNotification(item)).length,
    [notifications],
  );
  const paymentAttention = useMemo(
    () =>
      notifications.filter(item => item.status === 'UNREAD' && isPaymentNotification(item)).length,
    [notifications],
  );
  const previewNotifications = useMemo(() => notifications.slice(0, 3), [notifications]);

  async function handleLogout() {
    setAdminMode(false);
    await clearSession();
  }

  async function openNotification(item: SpaceNotification) {
    try {
      await adminEnquiryApi.markNotificationRead(item.notificationId);
    } catch {
      // Best-effort read state.
    }
    if (item.actionRoute === 'AdminEnquiryDetail' && item.entityId) {
      navigation.navigate('AdminEnquiryDetail', { id: item.entityId });
      return;
    }
    if (isPaymentNotification(item)) {
      // No dedicated admin payment-review screen — surface via notifications / enquiries hub.
      navigation.navigate('AdminEnquiryList');
      return;
    }
    navigation.navigate('AdminEnquiryList');
  }

  if (loading && !summary) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const hasAttention = enquiryAttention > 0 || paymentAttention > 0 || unreadCount > 0;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
        />
      }>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('admin.dashboard.title')}</Text>
          <Text style={styles.subtitle}>
            {t('admin.dashboard.brand', { defaultValue: 'ACOMI Admin' })}
          </Text>
          {user?.fullName ? (
            <Text style={styles.userLine} numberOfLines={1}>
              {user.fullName}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => void handleLogout()}
          style={styles.logout}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('admin.dashboard.signOut')}>
          <LogOut size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {hasAttention ? (
        <View style={styles.attentionCard}>
          <Text style={styles.sectionLabel}>
            {t('admin.dashboard.needsAttention', { defaultValue: 'Needs attention' })}
          </Text>
          <View style={styles.attentionRow}>
            <Text style={styles.attentionLabel}>
              {t('admin.dashboard.nav.enquiriesTitle')}
            </Text>
            <Text style={styles.attentionValue}>{enquiryAttention}</Text>
          </View>
          {paymentAttention > 0 ? (
            <View style={styles.attentionRow}>
              <Text style={styles.attentionLabel}>
                {t('admin.dashboard.paymentRequests', {
                  defaultValue: 'Payment requests',
                })}
              </Text>
              <Text style={styles.attentionValue}>{paymentAttention}</Text>
            </View>
          ) : null}
          <Pressable
            style={styles.attentionCta}
            onPress={() => navigation.navigate('AdminEnquiryList')}
            accessibilityRole="button">
            <MessageCircle size={16} color={colors.tealDark} />
            <Text style={styles.attentionCtaText}>
              {t('admin.dashboard.viewEnquiries', { defaultValue: 'View enquiries' })}
            </Text>
            <ChevronRight size={16} color={colors.tealDark} />
          </Pressable>
        </View>
      ) : null}

      {previewNotifications.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{t('admin.notifications.title')}</Text>
            {unreadCount > 0 ? (
              <Text style={styles.sectionMeta}>
                {t('admin.dashboard.unreadCount', {
                  count: unreadCount,
                  defaultValue: '{{count}} unread',
                })}
              </Text>
            ) : null}
          </View>
          {previewNotifications.map(item => (
            <Pressable
              key={item.notificationId}
              style={styles.noticeRow}
              onPress={() => void openNotification(item)}
              accessibilityRole="button">
              <View
                style={[
                  styles.noticeDot,
                  item.status === 'UNREAD' ? styles.noticeDotUnread : null,
                ]}
              />
              <View style={styles.noticeBody}>
                <Text
                  style={[styles.noticeTitle, item.status === 'UNREAD' && styles.unread]}
                  numberOfLines={1}>
                  {item.title}
                </Text>
                {item.message ? (
                  <Text style={styles.noticeMessage} numberOfLines={1}>
                    {item.message}
                  </Text>
                ) : null}
              </View>
              <ChevronRight size={16} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          {t('admin.dashboard.overview', { defaultValue: 'Overview' })}
        </Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{summary?.registeredUsersCount ?? 0}</Text>
            <Text style={styles.overviewLabel}>
              {t('admin.dashboard.stats.registeredUsers')}
            </Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{summary?.propertyRegistrationCount ?? 0}</Text>
            <Text style={styles.overviewLabel}>
              {t('admin.dashboard.stats.propertyLeads')}
            </Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{summary?.messRegistrationCount ?? 0}</Text>
            <Text style={styles.overviewLabel}>{t('admin.dashboard.stats.messLeads')}</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{summary?.activePropertySpaces ?? 0}</Text>
            <Text style={styles.overviewLabel}>
              {t('admin.dashboard.stats.activeProperties')}
            </Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{summary?.activeMessSpaces ?? 0}</Text>
            <Text style={styles.overviewLabel}>
              {t('admin.dashboard.stats.activeMesses')}
            </Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>
              {(summary?.websitePropertyLeads ?? 0) + (summary?.websiteMessLeads ?? 0)}
            </Text>
            <Text style={styles.overviewLabel}>
              {t('admin.dashboard.stats.websiteLeads', { defaultValue: 'Website leads' })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          {t('admin.dashboard.manage', { defaultValue: 'Manage' })}
        </Text>
        <ManageCard
          icon={Users}
          title={t('admin.dashboard.nav.registeredUsersTitle')}
          hint={t('admin.dashboard.nav.registeredUsersHint')}
          count={summary?.registeredUsersCount}
          onPress={() => navigation.navigate('AdminRegisteredUsers')}
        />
        <ManageCard
          icon={Building2}
          title={t('admin.dashboard.nav.propertiesTitle')}
          hint={t('admin.dashboard.nav.propertiesHint')}
          count={summary?.propertyRegistrationCount}
          onPress={() => navigation.navigate('AdminPropertyList', { tab: 'leads' })}
        />
        <ManageCard
          icon={ChefHat}
          title={t('admin.dashboard.nav.messTitle')}
          hint={t('admin.dashboard.nav.messHint')}
          count={summary?.messRegistrationCount}
          onPress={() => navigation.navigate('AdminMessList', { tab: 'leads' })}
        />
        <ManageCard
          icon={MessageCircle}
          title={t('admin.dashboard.nav.enquiriesTitle')}
          hint={t('admin.dashboard.nav.enquiriesHint')}
          count={enquiryAttention || undefined}
          onPress={() => navigation.navigate('AdminEnquiryList')}
        />
        <ManageCard
          icon={MapPin}
          title={t('admin.dashboard.nav.savedAddressesTitle')}
          hint={t('admin.dashboard.nav.savedAddressesHint')}
          onPress={() => navigation.navigate('AdminSavedAddresses')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  userLine: { ...typography.caption, color: colors.muted, marginTop: 2 },
  logout: {
    padding: spacing.sm,
    marginRight: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionMeta: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
  attentionCard: {
    backgroundColor: colors.mintSubtle,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  attentionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attentionLabel: { ...typography.body, color: colors.textPrimary },
  attentionValue: { ...typography.h3, color: colors.tealDark },
  attentionCta: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  attentionCtaText: { ...typography.bodyStrong, color: colors.tealDark, fontSize: 14 },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noticeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  noticeDotUnread: { backgroundColor: colors.primary },
  noticeBody: { flex: 1, minWidth: 0 },
  noticeTitle: { ...typography.bodyStrong, color: colors.textPrimary, fontSize: 14 },
  noticeMessage: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  unread: { fontWeight: '800' },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  overviewCard: {
    width: '31%',
    flexGrow: 1,
    minWidth: 96,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overviewValue: { ...typography.h3, color: colors.primary, fontSize: 22 },
  overviewLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  manageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manageIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.mintSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageText: { flex: 1, minWidth: 0 },
  manageTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  manageHint: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  manageCount: {
    ...typography.bodyStrong,
    color: colors.tealDark,
    minWidth: 28,
    textAlign: 'right',
  },
});
