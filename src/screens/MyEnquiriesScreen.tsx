import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
  UserRound,
} from 'lucide-react-native';
import { enquiryApi } from '../api/enquiryApi';
import type { OwnerContactResponse, SpaceEnquiryResponse } from '../api/types';
import { Button, Card, EmptyState } from '../components/ui';
import { useUnreadEnquiryIds } from '../hooks/useAccountEnquiryUnreadCount';
import type { MainStackParamList } from '../navigation/types';
import {
  markEnquiryNotificationsRead,
  refreshAccountEnquiryUnread,
} from '../store/accountEnquiryUnreadStore';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { contactWasEmailed } from '../utils/enquiryContactDelivery';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = NativeStackScreenProps<MainStackParamList, 'MyEnquiries'>['route'];

function hintKey(item: SpaceEnquiryResponse): string | null {
  if (item.status === 'SHARED') {
    return contactWasEmailed(item)
      ? 'spaces.enquiries.sharedHint'
      : 'spaces.enquiries.ownerContactReady';
  }
  if (item.status === 'PENDING') return 'spaces.enquiries.pendingHint';
  if (item.status === 'REJECTED') return 'spaces.enquiries.rejectedHint';
  if (item.status === 'EXPIRED') return 'spaces.enquiries.expiredHint';
  return null;
}

function formatRequestedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return new Date(iso).toLocaleDateString();
  }
}

function statusTone(status: SpaceEnquiryResponse['status']): {
  bg: string;
  fg: string;
} {
  switch (status) {
    case 'SHARED':
      return { bg: colors.mintSubtle, fg: colors.tealDark };
    case 'PENDING':
      return { bg: colors.warningTint, fg: '#B45309' };
    case 'EXPIRED':
    case 'CANCELLED':
      return { bg: '#F1F5F9', fg: colors.textSecondary };
    case 'REJECTED':
      return { bg: colors.errorTint, fg: '#B91C1C' };
    default:
      return { bg: colors.surfaceSecondary, fg: colors.textSecondary };
  }
}

function canShowOwnerContact(item: SpaceEnquiryResponse): boolean {
  return (
    item.status === 'SHARED' &&
    !contactWasEmailed(item) &&
    Boolean(item.ownerContact?.available)
  );
}

function ContactDetailsModal({
  visible,
  contact,
  spaceName,
  onClose,
}: {
  visible: boolean;
  contact: OwnerContactResponse;
  spaceName: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const mobiles = [
    contact.mobileNumber,
    contact.alternateMobileNumber,
    contact.additionalMobileNumber,
  ]
    .map(v => v?.trim())
    .filter((v): v is string => Boolean(v));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{t('spaces.enquiries.contactDetails')}</Text>
          <Text style={styles.modalSubtitle}>{spaceName}</Text>

          {contact.ownerName?.trim() ? (
            <View style={styles.contactActionRow}>
              <View style={styles.contactIconWrap}>
                <UserRound size={18} color={colors.tealDark} />
              </View>
              <View style={styles.contactActionBody}>
                <Text style={styles.contactActionLabel}>{t('spaces.enquiries.ownerName')}</Text>
                <Text style={styles.contactActionValue}>{contact.ownerName.trim()}</Text>
              </View>
            </View>
          ) : null}

          {mobiles.map((mobile, index) => (
            <View key={`${mobile}-${index}`} style={styles.contactActionRow}>
              <View style={styles.contactIconWrap}>
                <Phone size={18} color={colors.tealDark} />
              </View>
              <View style={styles.contactActionBody}>
                <Text style={styles.contactActionLabel}>
                  {index === 0
                    ? t('spaces.enquiries.mobile')
                    : t('spaces.enquiries.alternateMobile')}
                </Text>
                <Text style={styles.contactActionValue}>{mobile}</Text>
              </View>
              <Button
                label={t('spaces.enquiries.callOwner', { defaultValue: 'Call' })}
                variant="primary"
                onPress={() => {
                  void Linking.openURL(`tel:${mobile}`);
                }}
                style={styles.miniBtn}
              />
            </View>
          ))}

          {mobiles[0] ? (
            <View style={styles.contactActionRow}>
              <View style={styles.contactIconWrap}>
                <MessageCircle size={18} color={colors.tealDark} />
              </View>
              <View style={styles.contactActionBody}>
                <Text style={styles.contactActionLabel}>
                  {t('spaces.enquiries.messageOwner', { defaultValue: 'Message' })}
                </Text>
                <Text style={styles.contactActionHint}>
                  {t('spaces.enquiries.messageOwnerHint', {
                    defaultValue: 'Open your messaging app',
                  })}
                </Text>
              </View>
              <Button
                label={t('spaces.enquiries.messageOwner', { defaultValue: 'Message' })}
                variant="secondary"
                onPress={() => {
                  void Linking.openURL(`sms:${mobiles[0]}`);
                }}
                style={styles.miniBtn}
              />
            </View>
          ) : null}

          {contact.email?.trim() ? (
            <View style={styles.contactActionRow}>
              <View style={styles.contactIconWrap}>
                <Mail size={18} color={colors.tealDark} />
              </View>
              <View style={styles.contactActionBody}>
                <Text style={styles.contactActionLabel}>{t('spaces.enquiries.ownerEmail')}</Text>
                <Text style={styles.contactActionValue}>{contact.email.trim()}</Text>
              </View>
              <Button
                label={t('spaces.enquiries.emailOwner', { defaultValue: 'Email' })}
                variant="secondary"
                onPress={() => {
                  void Linking.openURL(`mailto:${contact.email!.trim()}`);
                }}
                style={styles.miniBtn}
              />
            </View>
          ) : null}

          <Button
            label={t('common.done', { defaultValue: 'Done' })}
            variant="ghost"
            onPress={onClose}
            style={styles.modalDone}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function MyEnquiriesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const highlightId = route.params?.enquiryId;
  const unreadIds = useUnreadEnquiryIds();
  const [rows, setRows] = useState<SpaceEnquiryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactTarget, setContactTarget] = useState<SpaceEnquiryResponse | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setLoading(true);
        try {
          const page = await enquiryApi.listMine({ size: 50 });
          if (!cancelled) setRows(page.content);
          void refreshAccountEnquiryUnread();
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      void load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const ordered = useMemo(() => {
    const sorted = [...rows].sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );
    if (!highlightId) {
      return sorted;
    }
    return sorted.sort(
      (a, b) => Number(b.enquiryId === highlightId) - Number(a.enquiryId === highlightId),
    );
  }, [highlightId, rows]);

  const openContact = useCallback((item: SpaceEnquiryResponse) => {
    if (!canShowOwnerContact(item) || !item.ownerContact) {
      return;
    }
    setContactTarget(item);
    void markEnquiryNotificationsRead(item.enquiryId);
  }, []);

  const goFindPlace = useCallback(() => {
    navigation.navigate('MemberTabs', { screen: 'FindAPlace' });
  }, [navigation]);

  return (
    <View style={styles.root}>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={ordered}
          keyExtractor={item => item.enquiryId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                Icon={MessageCircle}
                title={t('spaces.enquiries.emptyTitle', { defaultValue: 'No enquiries yet' })}
                description={t('spaces.enquiries.empty', {
                  defaultValue:
                    'Find a PG, hostel, rental or co-living space and send an enquiry to get started.',
                })}
              />
              <Button
                label={t('navigation.findAPlace')}
                onPress={goFindPlace}
                style={styles.emptyCta}
              />
            </View>
          }
          renderItem={({ item }) => {
            const hint = hintKey(item);
            const active = item.enquiryId === highlightId;
            const unread = unreadIds.has(item.enquiryId);
            const showContact = canShowOwnerContact(item);
            const tone = statusTone(item.status);
            const location = item.locationLabel?.trim() || null;

            return (
              <Pressable
                onPress={() => {
                  if (showContact) {
                    openContact(item);
                  } else if (unread) {
                    void markEnquiryNotificationsRead(item.enquiryId);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={item.spaceName}>
                <Card
                  style={StyleSheet.flatten([
                    styles.card,
                    active && styles.cardActive,
                    unread && styles.cardUnread,
                    item.status === 'EXPIRED' && styles.cardExpired,
                  ])}>
                  <View style={styles.cardTop}>
                    <View style={styles.iconWrap}>
                      <Building2 size={20} color={colors.primary} />
                    </View>
                    <View style={styles.cardMain}>
                      <View style={styles.titleRow}>
                        <Text style={styles.title} numberOfLines={1}>
                          {item.spaceName}
                        </Text>
                        {unread ? (
                          <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>
                              {t('spaces.enquiries.newBadge', { defaultValue: 'NEW' })}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {location ? (
                        <Text style={styles.location} numberOfLines={1}>
                          {location}
                        </Text>
                      ) : null}
                      <Text style={styles.meta}>
                        {t('spaces.enquiries.requestedDot', {
                          date: formatRequestedDate(item.requestedAt),
                          defaultValue: 'Requested · {{date}}',
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: tone.fg }]}>
                      {t(`spaces.enquiries.status.${item.status}` as const)}
                    </Text>
                  </View>

                  {hint ? <Text style={styles.hint}>{t(hint)}</Text> : null}

                  {showContact ? (
                    <Pressable
                      style={styles.viewContactRow}
                      onPress={() => openContact(item)}
                      accessibilityRole="button"
                      accessibilityLabel={t('spaces.enquiries.viewContactDetails', {
                        defaultValue: 'View contact details',
                      })}>
                      <Text style={styles.viewContactText}>
                        {t('spaces.enquiries.viewContactDetails', {
                          defaultValue: 'View contact details',
                        })}
                      </Text>
                      <ChevronRight size={18} color={colors.primary} />
                    </Pressable>
                  ) : null}
                </Card>
              </Pressable>
            );
          }}
        />
      )}

      {contactTarget?.ownerContact ? (
        <ContactDetailsModal
          visible
          contact={contactTarget.ownerContact}
          spaceName={contactTarget.spaceName}
          onClose={() => setContactTarget(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center', paddingTop: spacing.xl },
  emptyCta: { alignSelf: 'center', marginTop: spacing.md, minWidth: 200 },
  card: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  cardUnread: {
    backgroundColor: '#F3FBF7',
  },
  cardExpired: {
    opacity: 0.85,
  },
  cardTop: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.mintSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMain: { flex: 1, minWidth: 0, gap: 2 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { ...typography.bodyStrong, color: colors.textPrimary, flexShrink: 1 },
  location: { ...typography.caption, color: colors.textSecondary },
  meta: { ...typography.caption, color: colors.muted, marginTop: 2 },
  newBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  newBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  hint: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  viewContactRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.mintSubtle,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  viewContactText: {
    ...typography.bodyStrong,
    color: colors.tealDark,
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  modalTitle: { ...typography.h3, color: colors.textPrimary },
  modalSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: -spacing.sm },
  contactActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mintSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactActionBody: { flex: 1, minWidth: 0 },
  contactActionLabel: { ...typography.caption, color: colors.muted, fontWeight: '600' },
  contactActionValue: { ...typography.bodyStrong, color: colors.textPrimary },
  contactActionHint: { ...typography.caption, color: colors.textSecondary },
  miniBtn: { minWidth: 76, paddingHorizontal: spacing.sm },
  modalDone: { marginTop: spacing.sm },
});
