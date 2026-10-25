import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronDown, Clock, Mail, MapPin, MessageCircle, Phone, Search, UserRound, X } from 'lucide-react-native';
import { enquiryApi } from '../api/enquiryApi';
import type { EnquiryInboxListing, ReceivedEnquiry, ReceivedEnquirySummary, SpaceEnquiryStatus } from '../api/types';
import { Button, EmptyState } from '../components/ui';
import { ReferenceCode } from '../components/ui/ReferenceCode';
import type { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { dedupeById, enquiryInitials, listingMatchesQuery } from '../utils/receivedEnquiryList';
import { displayPhone, mailtoHref, telHref } from '../utils/serviceContactLinks';

const PAGE_SIZE = 20;
const STATUSES: Array<SpaceEnquiryStatus | ''> = ['', 'PENDING', 'SHARED', 'REJECTED', 'EXPIRED', 'CANCELLED'];

type Nav = NativeStackNavigationProp<MainStackParamList>;

const EMPTY_SUMMARY: ReceivedEnquirySummary = { total: 0, pending: 0, shared: 0, closed: 0 };

export function ReceivedEnquiriesScreen({ listings }: { listings: EnquiryInboxListing[] }) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const userId = useAuthStore(state => state.userId);
  const [rows, setRows] = useState<ReceivedEnquiry[]>([]);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(true);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<ReceivedEnquirySummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SpaceEnquiryStatus | ''>('');
  const [spaceId, setSpaceId] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<ReceivedEnquiry | null>(null);
  const [listingOpen, setListingOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [listingQuery, setListingQuery] = useState('');
  const requestRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async (nextPage: number, mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setError(null);
    }
    const request = ++requestRef.current;
    try {
      const result = await enquiryApi.listReceived({
        spaceId: spaceId || undefined,
        status: status || undefined,
        q: debouncedSearch || undefined,
        page: nextPage,
        size: PAGE_SIZE,
      });
      if (request !== requestRef.current) return;
      const content = result.content ?? [];
      setRows(current => dedupeById(mode === 'append' ? [...current, ...content] : content));
      setPage(result.page ?? nextPage);
      setLastPage(result.last !== false);
      setTotal(result.totalElements ?? content.length);
    } catch {
      if (request !== requestRef.current) return;
      if (mode === 'replace') {
        setRows([]);
        setError(t('spaces.enquiries.receivedError', {
          defaultValue: 'Enquiries could not be loaded. You can only see listings you own or manage.',
        }));
      }
    }
  }, [debouncedSearch, spaceId, status, t]);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await enquiryApi.receivedSummary(spaceId || undefined));
    } catch {
      setSummary(EMPTY_SUMMARY);
    }
  }, [spaceId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      void Promise.all([load(0, 'replace'), loadSummary()]).finally(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [load, loadSummary]),
  );

  useEffect(() => {
    setRows([]);
    setSelected(null);
  }, [userId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('AccountNotifications')}
          style={styles.headerBell}
          accessibilityRole="button"
          accessibilityLabel={t('spaces.notifications.title', { defaultValue: 'Notifications' })}>
          <Bell size={18} color={colors.textPrimary} />
        </Pressable>
      ),
    });
    return () => navigation.setOptions({ headerRight: () => null });
  }, [navigation, t]);

  const selectedListing = listings.find(listing => listing.spaceId === spaceId) ?? null;
  const filteredListings = useMemo(
    () => listings.filter(listing => listingMatchesQuery(listing.name, listingQuery)),
    [listingQuery, listings],
  );
  const filtersActive = Boolean(spaceId || status || debouncedSearch);
  const contextLine = useCallback((item: ReceivedEnquiry) => {
    if (item.spaceType === 'MESS') return item.foodIncludedLabel?.trim() || '';
    return item.sharingNotes?.trim() || '';
  }, []);

  async function refresh() {
    setRefreshing(true);
    await Promise.all([load(0, 'replace'), loadSummary()]);
    setRefreshing(false);
  }

  async function loadMore() {
    if (loading || loadingMore || lastPage || error) return;
    setLoadingMore(true);
    await load(page + 1, 'append');
    setLoadingMore(false);
  }

  function resetFilters() {
    setSpaceId('');
    setStatus('');
    setSearch('');
    setDebouncedSearch('');
  }

  return (
    <View style={styles.root}>
      <Text style={styles.subtitle}>
        {t('spaces.enquiries.receivedSubtitle', {
          defaultValue: 'Manage enquiries for your properties and mess services',
        })}
      </Text>
      <View style={styles.summaryRow}>
        <SummaryCard
          label={t('spaces.enquiries.summaryTotal', { defaultValue: 'Total enquiries' })}
          value={summary.total}
          selected={status === ''}
          onPress={() => setStatus('')}
          icon={<Mail size={14} color={colors.tealDark} />}
        />
        <SummaryCard
          label={t('spaces.enquiries.status.PENDING', { defaultValue: 'Pending' })}
          value={summary.pending}
          selected={status === 'PENDING'}
          onPress={() => setStatus('PENDING')}
          icon={<View style={[styles.dot, { backgroundColor: colors.success }]} />}
        />
        <SummaryCard
          label={t('spaces.enquiries.status.SHARED', { defaultValue: 'Shared' })}
          value={summary.shared}
          selected={status === 'SHARED'}
          onPress={() => setStatus('SHARED')}
          icon={<MessageCircle size={14} color="#1D4ED8" />}
        />
        <SummaryCard
          label={t('spaces.enquiries.summaryClosed', { defaultValue: 'Closed' })}
          value={summary.closed}
          selected={false}
          onPress={() => setStatusOpen(true)}
          icon={<Clock size={14} color="#B45309" />}
        />
      </View>
      <View style={styles.searchBox}>
        <Search size={16} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('spaces.enquiries.searchPlaceholder', {
            defaultValue: 'Search by name, property, or email...',
          })}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          accessibilityLabel={t('spaces.enquiries.searchPlaceholder', { defaultValue: 'Search enquiries' })}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} accessibilityLabel={t('common.clear', { defaultValue: 'Clear' })}>
            <X size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.filterRow}>
        <Pressable
          style={styles.filterButton}
          onPress={() => {
            setListingQuery('');
            setListingOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={t('spaces.enquiries.filterListing', { defaultValue: 'Listing' })}>
          <Text style={styles.filterText} numberOfLines={1}>
            {selectedListing?.name || t('spaces.enquiries.filterAllListings', { defaultValue: 'All listings' })}
          </Text>
          <ChevronDown size={16} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          style={styles.filterButton}
          onPress={() => setStatusOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('spaces.enquiries.filterStatus', { defaultValue: 'Status' })}>
          <Text style={styles.filterText} numberOfLines={1}>
            {status
              ? t(`spaces.enquiries.status.${status}`, { defaultValue: status })
              : t('spaces.enquiries.filterAll', { defaultValue: 'All enquiries' })}
          </Text>
          <ChevronDown size={16} color={colors.textSecondary} />
        </Pressable>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.count}>
          {t('spaces.enquiries.resultCount', {
            count: total,
            defaultValue: '{{count}} enquiries',
          })}
        </Text>
        {filtersActive ? (
          <Pressable onPress={resetFilters} accessibilityRole="button">
            <Text style={styles.reset}>{t('spaces.enquiries.clearFilters', { defaultValue: 'Clear filters' })}</Text>
          </Pressable>
        ) : null}
      </View>

      {loading && rows.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : error && rows.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState title={t('common.error', { defaultValue: 'Something went wrong' })} description={error} />
          <Button label={t('common.retry', { defaultValue: 'Try again' })} onPress={() => void refresh()} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => item.enquiryId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primary} />}
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
          ListEmptyComponent={
            <EmptyState
              title={filtersActive
                ? t('spaces.enquiries.noMatchesTitle', { defaultValue: 'No matching enquiries' })
                : t('spaces.enquiries.receivedEmptyTitle', { defaultValue: 'No enquiries received' })}
              description={filtersActive
                ? t('spaces.enquiries.noMatches', { defaultValue: 'Try another listing, status, or search.' })
                : t('spaces.enquiries.receivedEmpty', {
                    defaultValue: 'When a member enquires about one of your listings, it will show up here.',
                  })}
            />
          }
          renderItem={({ item }) => (
            <EnquiryCard
              item={item}
              context={contextLine(item)}
              onPress={() => setSelected(item)}
            />
          )}
        />
      )}

      <OptionSheet
        visible={listingOpen}
        title={t('spaces.enquiries.filterListing', { defaultValue: 'Listing' })}
        onClose={() => setListingOpen(false)}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.muted} />
          <TextInput
            value={listingQuery}
            onChangeText={setListingQuery}
            placeholder={t('spaces.enquiries.findListing', { defaultValue: 'Find a listing' })}
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>
        <Pressable
          style={styles.option}
          onPress={() => {
            setSpaceId('');
            setListingOpen(false);
          }}>
          <Text style={styles.optionTitle}>{t('spaces.enquiries.filterAllListings', { defaultValue: 'All listings' })}</Text>
        </Pressable>
        {filteredListings.map(listing => (
          <Pressable
            key={listing.spaceId}
            style={styles.option}
            onPress={() => {
              setSpaceId(listing.spaceId);
              setListingOpen(false);
            }}>
            <Text style={styles.optionTitle} numberOfLines={2}>{listing.name}</Text>
            <Text style={styles.optionMeta} numberOfLines={1}>
              {[typeLabel(t, listing.spaceType), listing.locationLabel].filter(Boolean).join(' · ')}
            </Text>
          </Pressable>
        ))}
      </OptionSheet>

      <OptionSheet
        visible={statusOpen}
        title={t('spaces.enquiries.filterStatus', { defaultValue: 'Status' })}
        onClose={() => setStatusOpen(false)}>
        {STATUSES.map(item => (
          <Pressable
            key={item || 'all'}
            style={styles.option}
            onPress={() => {
              setStatus(item);
              setStatusOpen(false);
            }}>
            <Text style={styles.optionTitle}>
              {item
                ? t(`spaces.enquiries.status.${item}`, { defaultValue: item })
                : t('spaces.enquiries.filterAll', { defaultValue: 'All enquiries' })}
            </Text>
          </Pressable>
        ))}
      </OptionSheet>

      <Modal
        visible={selected != null}
        transparent
        animationType="slide"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setSelected(null)}>
        <View style={styles.detailBackdrop}>
          <Pressable
            style={styles.detailBackdropTap}
            onPress={() => setSelected(null)}
            accessibilityRole="button"
            accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
          />
          {selected ? <EnquiryDetail enquiry={selected} onClose={() => setSelected(null)} /> : null}
        </View>
      </Modal>
    </View>
  );
}

function EnquiryCard({
  item,
  context,
  onPress,
}: {
  item: ReceivedEnquiry;
  context: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const name = item.requesterName?.trim() || t('spaces.enquiries.member', { defaultValue: 'Member' });
  const initials = enquiryInitials(item.requesterName);
  const tone = statusTone(item.status);
  const type = typeLabel(t, item.spaceType);
  return (
    <Pressable onPress={onPress} style={styles.card} accessibilityRole="button">
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={[styles.status, { backgroundColor: tone.bg, color: tone.fg }]}>
              {t(`spaces.enquiries.status.${item.status}`, { defaultValue: item.status })}
            </Text>
          </View>
          {context ? <Text style={styles.message} numberOfLines={2}>{context}</Text> : null}
          <SenderSummary item={item} />
          <Text style={styles.time}>{formatAge(item.requestedAt, t)}</Text>
        </View>
      </View>
      <View style={styles.listingRow}>
        <View style={styles.listingCopy}>
          <Text style={styles.listingName} numberOfLines={1}>{item.spaceName}</Text>
          <ReferenceCode value={item.referenceCode} />
          {item.locationLabel ? (
            <View style={styles.locationLine}>
              <MapPin size={12} color={colors.muted} />
              <Text style={styles.listingMeta} numberOfLines={1}>{item.locationLabel}</Text>
            </View>
          ) : null}
          {item.listingAvailable === false ? (
            <Text style={styles.listingMeta}>
              {t('spaces.enquiries.listingUnavailable', { defaultValue: 'This listing is no longer available.' })}
            </Text>
          ) : null}
          {type ? <Text style={styles.typeChip}>{type}</Text> : null}
        </View>
        <Text style={styles.viewLink}>{t('spaces.enquiries.viewEnquiry', { defaultValue: 'View enquiry' })}</Text>
      </View>
    </Pressable>
  );
}

function EnquiryDetail({ enquiry, onClose }: { enquiry: ReceivedEnquiry; onClose: () => void }) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const name = enquiry.requesterName?.trim() || t('spaces.enquiries.member', { defaultValue: 'Member' });
  const type = typeLabel(t, enquiry.spaceType);
  const context = enquiry.spaceType === 'MESS' ? enquiry.foodIncludedLabel : enquiry.sharingNotes;
  return (
    <View style={[styles.detail, { paddingBottom: spacing.lg + insets.bottom }]}>
      <View style={styles.detailHandle} />
      <View style={styles.detailHeader}>
        <Text style={styles.detailName} numberOfLines={2}>{name}</Text>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={styles.detailClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close', { defaultValue: 'Close' })}>
          <X size={18} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
      </View>
      <ScrollView
        style={{ maxHeight: height * 0.72 }}
        contentContainerStyle={styles.detailScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <SenderDetails enquiry={enquiry} />
        <Text style={styles.listingName}>{enquiry.spaceName}</Text>
        <ReferenceCode value={enquiry.referenceCode} />
        {type ? <Text style={styles.optionMeta}>{type}</Text> : null}
        {enquiry.locationLabel ? <Text style={styles.optionMeta}>{enquiry.locationLabel}</Text> : null}
        <Text style={styles.optionMeta}>{formatAge(enquiry.requestedAt, t)}</Text>
        <Text style={styles.optionMeta}>
          {t(`spaces.enquiries.status.${enquiry.status}`, { defaultValue: enquiry.status })}
        </Text>
        {context?.trim() ? <Text style={styles.message}>{context.trim()}</Text> : null}
        {enquiry.listingAvailable === false ? (
          <Text style={styles.listingMeta}>
            {t('spaces.enquiries.listingUnavailable', { defaultValue: 'This listing is no longer available.' })}
          </Text>
        ) : null}
        <Button
          label={t('spaces.enquiries.openListing', { defaultValue: 'Open listing' })}
          variant="secondary"
          onPress={() => {
            onClose();
            navigation.navigate('FindAPlaceDetail', { spaceId: enquiry.spaceId });
          }}
        />
        <Button label={t('common.done', { defaultValue: 'Done' })} variant="ghost" onPress={onClose} />
      </ScrollView>
    </View>
  );
}

function SenderSummary({ item }: { item: ReceivedEnquiry }) {
  const phone = displayPhone(item.requesterMobile);
  const email = item.requesterEmail?.trim();
  const line = [phone, email].filter(Boolean).join(' · ');
  if (!line) return null;
  return (
    <Text style={styles.message} numberOfLines={1}>
      {line}
    </Text>
  );
}

function SenderDetails({ enquiry }: { enquiry: ReceivedEnquiry }) {
  const { t } = useTranslation();
  const unavailable = t('spaces.enquiries.senderUnavailable', { defaultValue: 'Not available' });
  const name = enquiry.requesterName?.trim();
  const mobile = displayPhone(enquiry.requesterMobile);
  const email = enquiry.requesterEmail?.trim() || '';
  const tel = telHref(enquiry.requesterMobile);
  const mail = mailtoHref(email);
  const sms = tel ? tel.replace(/^tel:/, 'sms:') : null;

  return (
    <View style={styles.senderBox}>
      <Text style={styles.senderTitle}>
        {t('spaces.enquiries.senderDetails', { defaultValue: 'Sender details' })}
      </Text>
      <SenderRow
        icon={<UserRound size={16} color={colors.tealDark} />}
        label={t('spaces.enquiries.ownerName', { defaultValue: 'Name' })}
        value={name || unavailable}
      />
      <SenderRow
        icon={<Phone size={16} color={colors.tealDark} />}
        label={t('spaces.enquiries.mobile', { defaultValue: 'Mobile' })}
        value={mobile || unavailable}
      />
      <SenderRow
        icon={<Mail size={16} color={colors.tealDark} />}
        label={t('spaces.enquiries.ownerEmail', { defaultValue: 'Email' })}
        value={email || unavailable}
      />
      {enquiry.requesterType ? (
        <SenderRow
          icon={<UserRound size={16} color={colors.tealDark} />}
          label={t('spaces.enquiries.senderAccount', { defaultValue: 'Account' })}
          value={t(`spaces.enquiries.requesterType.${enquiry.requesterType}`, {
            defaultValue: enquiry.requesterType === 'OWNER' ? 'Lists a property' : 'Member',
          })}
        />
      ) : null}
      {tel || mail ? (
        <View style={styles.senderActions}>
          {tel ? (
            <Button
              label={t('spaces.enquiries.callOwner', { defaultValue: 'Call' })}
              onPress={() => void Linking.openURL(tel)}
              style={styles.miniBtn}
            />
          ) : null}
          {sms ? (
            <Button
              label={t('spaces.enquiries.messageOwner', { defaultValue: 'Message' })}
              variant="secondary"
              onPress={() => void Linking.openURL(sms)}
              style={styles.miniBtn}
            />
          ) : null}
          {mail ? (
            <Button
              label={t('spaces.enquiries.emailOwner', { defaultValue: 'Email' })}
              variant="secondary"
              onPress={() => void Linking.openURL(mail)}
              style={styles.miniBtn}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function SenderRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.senderRow}>
      <View style={styles.senderIcon}>{icon}</View>
      <View style={styles.senderCopy}>
        <Text style={styles.senderLabel}>{label}</Text>
        <Text style={styles.senderValue} selectable>
          {value}
        </Text>
      </View>
    </View>
  );
}

function SummaryCard({
  label,
  value,
  selected,
  onPress,
  icon,
}: {
  label: string;
  value: number;
  selected: boolean;
  onPress: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.summaryCard, selected && styles.summaryCardOn]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <View style={styles.summaryIcon}>{icon}</View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}

function OptionSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalFill}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function typeLabel(t: (key: string, options?: { defaultValue: string }) => string, type?: string | null): string | null {
  switch (type) {
    case 'PG':
      return t('spaces.types.pg.label', { defaultValue: 'PG' });
    case 'HOSTEL':
      return t('spaces.types.hostel.label', { defaultValue: 'Hostel' });
    case 'CO_LIVING':
      return t('spaces.types.coLiving.label', { defaultValue: 'Co-living' });
    case 'RENTAL':
      return t('spaces.types.rental.label', { defaultValue: 'Rental' });
    case 'MESS':
      return t('spaces.types.mess.label', { defaultValue: 'Mess' });
    default:
      return null;
  }
}

function statusTone(status: string): { bg: string; fg: string } {
  switch (status) {
    case 'SHARED':
      return { bg: '#E7F6EE', fg: '#0F6B4C' };
    case 'PENDING':
      return { bg: '#FEF3C7', fg: '#B45309' };
    case 'REJECTED':
      return { bg: '#FEE2E2', fg: '#B91C1C' };
    default:
      return { bg: '#F1F5F9', fg: '#64748B' };
  }
}

function formatAge(
  iso: string,
  t: (key: string, options?: { count?: number; defaultValue: string }) => string,
): string {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return '';
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
  if (minutes < 1) return t('spaces.enquiries.justNow', { defaultValue: 'Just now' });
  if (minutes < 60) {
    return t('spaces.enquiries.minutesAgo', { count: minutes, defaultValue: '{{count}} min ago' });
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return t('spaces.enquiries.hoursAgo', { count: hours, defaultValue: '{{count}} hrs ago' });
  }
  const days = Math.round(hours / 24);
  if (days < 14) {
    return t('spaces.enquiries.daysAgo', { count: days, defaultValue: '{{count}} days ago' });
  }
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerBell: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    minHeight: 72,
  },
  summaryCardOn: { borderColor: colors.primary, backgroundColor: colors.mintSubtle },
  summaryIcon: { marginBottom: 2 },
  summaryValue: { ...typography.body, fontWeight: '800', color: colors.textPrimary },
  summaryLabel: { ...typography.caption, color: colors.textSecondary, fontSize: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, margin: 3 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, paddingVertical: 8 },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  filterButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  filterText: { ...typography.caption, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  count: { ...typography.caption, color: colors.textSecondary },
  reset: { ...typography.caption, color: colors.tealDark, fontWeight: '700' },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.lg, paddingBottom: spacing.section, flexGrow: 1, gap: spacing.sm },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTop: { flexDirection: 'row', gap: spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mintSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.caption, fontWeight: '800', color: colors.tealDark },
  cardBody: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.body, fontWeight: '800', color: colors.textPrimary, flex: 1 },
  status: {
    overflow: 'hidden',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '700',
  },
  message: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  senderBox: {
    marginTop: spacing.sm,
    borderRadius: radius.card,
    backgroundColor: colors.mintSubtle,
    padding: spacing.md,
    gap: spacing.sm,
  },
  senderTitle: { ...typography.caption, fontWeight: '800', color: colors.tealDark },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  senderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderCopy: { flex: 1, minWidth: 0 },
  senderLabel: { ...typography.caption, color: colors.muted, fontWeight: '600' },
  senderValue: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  senderActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  miniBtn: { minHeight: 36, paddingHorizontal: spacing.md, paddingVertical: 6 },
  time: { ...typography.caption, color: colors.muted, marginTop: 2 },
  listingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  listingCopy: { flex: 1, minWidth: 0, gap: 2 },
  listingName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listingMeta: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  typeChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: colors.surfaceSecondary,
    color: colors.tealDark,
    overflow: 'hidden',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '700',
  },
  viewLink: { ...typography.caption, color: colors.tealDark, fontWeight: '800' },
  emptyWrap: { padding: spacing.lg, gap: spacing.md },
  modalFill: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlayScrim },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    ...shadows.raised,
    maxHeight: '70%',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.section,
    borderTopRightRadius: radius.section,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sheetTitle: { ...typography.h3, color: colors.textPrimary },
  option: { paddingVertical: spacing.sm },
  optionTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  optionMeta: { ...typography.caption, color: colors.textSecondary },
  detailBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlayScrim,
  },
  detailBackdropTap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  detail: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    zIndex: 2,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  detailHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  detailName: { ...typography.h3, color: colors.textPrimary, flex: 1 },
  detailClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  detailScroll: { gap: spacing.sm },
});
