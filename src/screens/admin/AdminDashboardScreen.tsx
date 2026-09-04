import React, { useCallback, useState } from 'react';
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
import { Building2, ChefHat, LogOut, MapPin, Users } from 'lucide-react-native';
import { adminApi } from '../../api/adminApi';
import type { AdminDashboardSummary } from '../../api/types';
import { DashboardStatCard } from '../../components/dashboard/shared/DashboardStatCard';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import type { AdminListFilterParams, AdminStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminDashboard'>;

export function AdminDashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const clearSession = useAuthStore(state => state.clearSession);
  const setAdminMode = useAdminStore(state => state.setAdminMode);
  const user = useAuthStore(state => state.user);

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setSummary(await adminApi.getDashboardSummary());
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

  async function handleLogout() {
    setAdminMode(false);
    await clearSession();
  }

  function openProperties(filter: AdminListFilterParams) {
    navigation.navigate('AdminPropertyList', filter);
  }

  function openMess(filter: AdminListFilterParams) {
    navigation.navigate('AdminMessList', filter);
  }

  if (loading && !summary) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
      }>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('admin.dashboard.title')}</Text>
          <Text style={styles.subtitle}>{user?.fullName ?? t('admin.dashboard.welcome')}</Text>
        </View>
        <Pressable
          onPress={() => void handleLogout()}
          style={styles.logout}
          accessibilityLabel={t('admin.dashboard.signOut')}>
          <LogOut size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.sectionLabelWrap}>
        <Text style={styles.sectionLabel}>{t('admin.dashboard.sectionRegistration')}</Text>
      </View>
      <View style={styles.grid}>
        <DashboardStatCard
          gridItem
          label={t('admin.dashboard.stats.registeredUsers')}
          value={String(summary?.registeredUsersCount ?? 0)}
          onPress={() => navigation.navigate('AdminRegisteredUsers')}
        />
      </View>

      <View style={styles.sectionLabelWrap}>
        <Text style={styles.sectionLabel}>{t('admin.dashboard.sectionLeadsSpaces')}</Text>
      </View>
      <View style={styles.grid}>
        <DashboardStatCard
          gridItem
          label={t('admin.dashboard.stats.propertyLeads')}
          value={String(summary?.propertyRegistrationCount ?? 0)}
          onPress={() => openProperties({ tab: 'leads' })}
        />
        <DashboardStatCard
          gridItem
          label={t('admin.dashboard.stats.messLeads')}
          value={String(summary?.messRegistrationCount ?? 0)}
          onPress={() => openMess({ tab: 'leads' })}
        />
        <DashboardStatCard
          gridItem
          label={t('admin.dashboard.stats.websiteProperty')}
          value={String(summary?.websitePropertyLeads ?? 0)}
          onPress={() => openProperties({ tab: 'leads', source: 'PUBLIC_WEBSITE' })}
        />
        <DashboardStatCard
          gridItem
          label={t('admin.dashboard.stats.websiteMess')}
          value={String(summary?.websiteMessLeads ?? 0)}
          onPress={() => openMess({ tab: 'leads', source: 'PUBLIC_WEBSITE' })}
        />
        <DashboardStatCard
          gridItem
          label={t('admin.dashboard.stats.adminProperty')}
          value={String(summary?.adminPropertyLeads ?? 0)}
          onPress={() => openProperties({ tab: 'leads', source: 'ADMIN' })}
        />
        <DashboardStatCard
          gridItem
          label={t('admin.dashboard.stats.adminMess')}
          value={String(summary?.adminMessLeads ?? 0)}
          onPress={() => openMess({ tab: 'leads', source: 'ADMIN' })}
        />
        <DashboardStatCard
          gridItem
          label={t('admin.dashboard.stats.activeProperties')}
          value={String(summary?.activePropertySpaces ?? 0)}
          onPress={() => openProperties({ tab: 'active' })}
        />
        <DashboardStatCard
          gridItem
          label={t('admin.dashboard.stats.activeMesses')}
          value={String(summary?.activeMessSpaces ?? 0)}
          onPress={() => openMess({ tab: 'active' })}
        />
      </View>

      <Pressable style={styles.navCard} onPress={() => navigation.navigate('AdminRegisteredUsers')}>
        <Users color={colors.primary} size={22} />
        <View style={styles.navText}>
          <Text style={styles.navTitle}>{t('admin.dashboard.nav.registeredUsersTitle')}</Text>
          <Text style={styles.navHint}>{t('admin.dashboard.nav.registeredUsersHint')}</Text>
        </View>
      </Pressable>

      <Pressable style={styles.navCard} onPress={() => navigation.navigate('AdminSavedAddresses')}>
        <MapPin color={colors.primary} size={22} />
        <View style={styles.navText}>
          <Text style={styles.navTitle}>{t('admin.dashboard.nav.savedAddressesTitle')}</Text>
          <Text style={styles.navHint}>{t('admin.dashboard.nav.savedAddressesHint')}</Text>
        </View>
      </Pressable>

      <Pressable style={styles.navCard} onPress={() => navigation.navigate('AdminPropertyList', undefined)}>
        <Building2 color={colors.primary} size={22} />
        <View style={styles.navText}>
          <Text style={styles.navTitle}>{t('admin.dashboard.nav.propertiesTitle')}</Text>
          <Text style={styles.navHint}>{t('admin.dashboard.nav.propertiesHint')}</Text>
        </View>
      </Pressable>

      <Pressable style={styles.navCard} onPress={() => navigation.navigate('AdminMessList', undefined)}>
        <ChefHat color={colors.primary} size={22} />
        <View style={styles.navText}>
          <Text style={styles.navTitle}>{t('admin.dashboard.nav.messTitle')}</Text>
          <Text style={styles.navHint}>{t('admin.dashboard.nav.messHint')}</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  logout: {
    padding: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sectionLabelWrap: { marginTop: spacing.xs },
  sectionLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navText: { flex: 1 },
  navTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  navHint: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
