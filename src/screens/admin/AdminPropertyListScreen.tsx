import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { adminApi } from '../../api/adminApi';
import type {
  AdminActiveSpace,
  ListingMarketingStatus,
  PropertyRegistrationListItem,
  RegistrationSource,
  WhatsAppAvailability,
} from '../../api/types';
import {
  AdminLeadCard,
  AdminListingMarketingChips,
  AdminListingMarketingShareDialog,
  adminList,
} from '../../components/admin';
import { useConfirmDialog } from '../../components/ui';
import type { AdminStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { formatAdminDate, formatRegistrationSource } from '../../utils/adminLabels';
import { colors, radius, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminPropertyList'>;
type Route = NativeStackScreenProps<AdminStackParamList, 'AdminPropertyList'>['route'];

const PAGE_SIZE = 20;

function filterLabel(
  t: TFunction,
  tab: 'leads' | 'active',
  source?: RegistrationSource,
): string | null {
  if (tab === 'active') return t('admin.filters.activeSpaces');
  if (source === 'PUBLIC_WEBSITE') return t('admin.filters.websiteRegistrations');
  if (source === 'ADMIN') return t('admin.filters.addedByAdmin');
  return null;
}

function locationLine(item: PropertyRegistrationListItem, dash: string): string {
  const parts = [item.city, item.state].map(v => v?.trim()).filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : dash;
}

export function AdminPropertyListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { showConfirm } = useConfirmDialog();
  const showToast = useToastStore(state => state.showToast);
  const sourceFilter = route.params?.source;

  const [leads, setLeads] = useState<PropertyRegistrationListItem[]>([]);
  const [activeAll, setActiveAll] = useState<AdminActiveSpace[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [leadPage, setLeadPage] = useState(0);
  const [hasMoreLeads, setHasMoreLeads] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const [tab, setTab] = useState<'leads' | 'active'>(route.params?.tab ?? 'leads');
  const [marketingStatusFilter, setMarketingStatusFilter] = useState<ListingMarketingStatus | ''>(
    '',
  );
  const [whatsappAvailabilityFilter, setWhatsappAvailabilityFilter] = useState<
    WhatsAppAvailability | ''
  >('');
  const [spaceShareId, setSpaceShareId] = useState<string | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const reloadToken = useRef(0);

  useFocusEffect(
    useCallback(() => {
      setTab(route.params?.tab ?? 'leads');
    }, [route.params?.tab]),
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const activeTab = route.params?.tab ?? 'leads';
      const source = route.params?.source;
      const token = ++reloadToken.current;
      async function load() {
        setLoading(true);
        setLeadPage(0);
        setVisibleCount(PAGE_SIZE);
        try {
          if (activeTab === 'leads') {
            const page = await adminApi.listPropertyRegistrations({
              leadsOnly: source ? undefined : true,
              source,
              marketingStatus: marketingStatusFilter || undefined,
              whatsappAvailability: whatsappAvailabilityFilter || undefined,
              page: 0,
              size: PAGE_SIZE,
            });
            if (!cancelled && token === reloadToken.current) {
              setLeads(page.content);
              setHasMoreLeads(!page.last && page.content.length > 0);
            }
          } else {
            const spaces = await adminApi.listActiveSpaces();
            if (!cancelled && token === reloadToken.current) {
              setActiveAll(
                spaces
                  .filter(s => s.type !== 'MESS')
                  .filter(
                    s =>
                      !marketingStatusFilter ||
                      (s.marketingStatus ?? 'NOT_SHARED') === marketingStatusFilter,
                  )
                  .filter(
                    s =>
                      !whatsappAvailabilityFilter ||
                      (s.whatsappAvailability ?? 'UNKNOWN') === whatsappAvailabilityFilter,
                  ),
              );
            }
          }
        } finally {
          if (!cancelled && token === reloadToken.current) setLoading(false);
        }
      }
      void load();
      return () => {
        cancelled = true;
      };
    }, [
      route.params?.source,
      route.params?.tab,
      marketingStatusFilter,
      whatsappAvailabilityFilter,
      listRefreshKey,
    ]),
  );

  const spaceShareTarget = spaceShareId
    ? activeAll.find(space => space.id === spaceShareId) ?? null
    : null;

  const activeFilterLabel = filterLabel(t, tab, sourceFilter);
  const dash = t('admin.labels.emDash');
  const activeSpaces = activeAll.slice(0, visibleCount);

  async function loadMoreLeads() {
    if (loading || loadingMoreRef.current || !hasMoreLeads) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = leadPage + 1;
      const page = await adminApi.listPropertyRegistrations({
        leadsOnly: sourceFilter ? undefined : true,
        source: sourceFilter,
        marketingStatus: marketingStatusFilter || undefined,
        whatsappAvailability: whatsappAvailabilityFilter || undefined,
        page: nextPage,
        size: PAGE_SIZE,
      });
      setLeads(prev => [...prev, ...page.content]);
      setLeadPage(nextPage);
      setHasMoreLeads(!page.last && page.content.length > 0);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }

  function handleEndReached() {
    if (tab === 'leads') {
      void loadMoreLeads();
      return;
    }
    if (visibleCount < activeAll.length) {
      setVisibleCount(count => count + PAGE_SIZE);
    }
  }

  function handleDelete(item: PropertyRegistrationListItem) {
    showConfirm({
      title: t('admin.property.deleteTitle'),
      message: t('admin.property.deleteMessage', { name: item.propertyName }),
      confirmLabel: t('admin.common.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        try {
          await adminApi.deletePropertyRegistration(item.id);
          setLeads(prev => prev.filter(row => row.id !== item.id));
          showToast(t('admin.property.deleted'));
        } catch {
          showToast(t('admin.property.deleteFailed'));
        }
      },
    });
  }

  function renderMarketingFilters() {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
        {(
          [
            ['', t('admin.marketing.filters.allMarketing')],
            ['NOT_SHARED', t('admin.marketing.status.notShared')],
            ['SHARED', t('admin.marketing.status.shared')],
          ] as const
        ).map(([value, label]) => (
          <Pressable
            key={`m-${value || 'all'}`}
            style={[styles.filterChip, marketingStatusFilter === value && styles.filterChipActive]}
            onPress={() => setMarketingStatusFilter(value)}>
            <Text
              style={[
                styles.filterChipText,
                marketingStatusFilter === value && styles.filterChipTextActive,
              ]}>
              {label}
            </Text>
          </Pressable>
        ))}
        {(
          [
            ['', t('admin.marketing.filters.allWhatsapp')],
            ['UNKNOWN', t('admin.marketing.whatsapp.unknown')],
            ['AVAILABLE', t('admin.marketing.whatsapp.available')],
            ['UNAVAILABLE', t('admin.marketing.whatsapp.unavailable')],
          ] as const
        ).map(([value, label]) => (
          <Pressable
            key={`w-${value || 'all'}`}
            style={[
              styles.filterChip,
              whatsappAvailabilityFilter === value && styles.filterChipActive,
            ]}
            onPress={() => setWhatsappAvailabilityFilter(value)}>
            <Text
              style={[
                styles.filterChipText,
                whatsappAvailabilityFilter === value && styles.filterChipTextActive,
              ]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.root}>
      <View style={adminList.tabs}>
        {(['leads', 'active'] as const).map(key => (
          <Pressable
            key={key}
            style={[adminList.tab, tab === key && adminList.tabActive]}
            onPress={() => {
              setTab(key);
              navigation.setParams({ tab: key, source: key === 'active' ? undefined : sourceFilter });
            }}>
            <Text style={[adminList.tabText, tab === key && adminList.tabTextActive]}>
              {key === 'leads' ? t('admin.filters.leads') : t('admin.filters.active')}
            </Text>
          </Pressable>
        ))}
        <Pressable style={adminList.addBtn} onPress={() => navigation.navigate('AdminAddProperty')}>
          <Text style={adminList.addBtnText}>{t('admin.filters.add')}</Text>
        </Pressable>
      </View>
      {activeFilterLabel && tab === 'leads' ? (
        <Text style={adminList.filterBadge}>{activeFilterLabel}</Text>
      ) : null}
      {renderMarketingFilters()}
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : tab === 'leads' ? (
        <FlatList
          data={leads}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null
          }
          renderItem={({ item }) => (
            <AdminLeadCard
              title={item.propertyName}
              subtitle={`${item.propertyType} · ${item.ownerName}`}
              meta={`${item.mobileNumber} · ${locationLine(item, dash)} · ${formatAdminDate(item.createdAt)}`}
              sourceLabel={formatRegistrationSource(item.source)}
              testLead={item.testLead}
              showDelete
              footer={
                <AdminListingMarketingChips
                  marketingStatus={item.marketingStatus}
                  whatsappAvailability={item.whatsappAvailability}
                />
              }
              onPress={() => navigation.navigate('AdminPropertyDetail', { id: item.id })}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t('admin.list.empty')}</Text>}
        />
      ) : (
        <FlatList
          data={activeSpaces}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <AdminLeadCard
              title={item.name}
              subtitle={`${item.type} · ${item.ownerName}`}
              meta={`${item.ownerMobile} · ${item.address?.trim() || dash}`}
              testLead={item.testLead}
              showShare
              footer={
                <AdminListingMarketingChips
                  marketingStatus={item.marketingStatus}
                  whatsappAvailability={item.whatsappAvailability}
                />
              }
              onPress={() => navigation.navigate('AdminActiveSpaceDetail', { space: item })}
              onShare={() => setSpaceShareId(item.id)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t('admin.list.empty')}</Text>}
        />
      )}

      {spaceShareTarget ? (
        <AdminListingMarketingShareDialog
          open
          mode="share"
          onClose={() => setSpaceShareId(null)}
          onUpdated={() => {
            setSpaceShareId(null);
            setLoading(true);
            setListRefreshKey(key => key + 1);
          }}
          target={
            spaceShareTarget.registrationId
              ? { kind: 'property-registration', id: spaceShareTarget.registrationId }
              : { kind: 'space', id: spaceShareTarget.id }
          }
          listingKind="PROPERTY"
          spaceType={spaceShareTarget.type}
          name={spaceShareTarget.name}
          ownerName={spaceShareTarget.ownerName}
          location={spaceShareTarget.address}
          address={spaceShareTarget.address}
          phones={[spaceShareTarget.contactNumber, spaceShareTarget.ownerMobile]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  footer: { marginVertical: spacing.md },
  empty: {
    textAlign: 'center',
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
  filterRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  filterChipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: colors.tealDark },
});
