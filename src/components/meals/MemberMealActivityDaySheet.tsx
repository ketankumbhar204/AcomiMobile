import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type {
  MemberMealActivityDayDetail,
  MemberMealActivitySlotDetail,
  MemberMealActivitySlotStatus,
  MemberMealActivitySubscription,
  MealPollPaymentChoice,
  MealPollPaymentStatus,
  MealType,
  UUID,
} from '../../api/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import { formatMenuDateCompact, formatResponseDateParts } from '../../utils/mealDates';
import { MEAL_TYPES, mealTypeLabelKey } from '../../utils/mealLabels';
import { dayDetailHasActivity, formatPlateCount } from '../../utils/memberMealActivityDayDetail';
import { MealPollPaymentReviewModal } from './MealPollPaymentReviewModal';

const BACKDROP_DELAY_MS = 450;
const SHEET_MIN_RATIO = 0.88;
const SHEET_MAX_RATIO = 0.96;

const MEAL_EMOJI: Record<MealType, string> = {
  BREAKFAST: '🍳',
  LUNCH: '🍱',
  DINNER: '🌙',
};

const STATUS_CHIP: Record<
  MemberMealActivitySlotStatus,
  { bg: string; text: string; dot: string }
> = {
  ACCEPTED: { bg: '#ECFDF5', text: colors.success, dot: '🟢' },
  PENDING: { bg: '#FEFCE8', text: '#CA8A04', dot: '🟡' },
  SKIPPED: { bg: '#FEF2F2', text: '#DC2626', dot: '🔴' },
  NO_MENU: { bg: '#F3F4F6', text: colors.muted, dot: '⚪' },
  INACTIVE: { bg: '#F9FAFB', text: colors.muted, dot: '⚪' },
};

type MemberMealActivityDaySheetProps = {
  visible: boolean;
  date: string | null;
  spaceId: UUID;
  memberId: UUID;
  memberName: string;
  canManage: boolean;
  onClose: () => void;
  onPaymentReviewed?: () => void;
};

function dayStatusLabel(status: MemberMealActivitySlotStatus, t: (key: string) => string): string {
  switch (status) {
    case 'ACCEPTED':
      return t('meals.activity.daySheet.statusAccepted');
    case 'PENDING':
      return t('meals.activity.daySheet.statusPending');
    case 'SKIPPED':
      return t('meals.activity.daySheet.statusSkipped');
    case 'NO_MENU':
      return t('meals.activity.daySheet.statusNoMenu');
    default:
      return t('meals.activity.daySheet.statusInactive');
  }
}

function paymentChoiceLabel(choice: MealPollPaymentChoice, t: (key: string) => string): string {
  return choice === 'MARK_AS_PAID' ? t('meals.poll.markAsPaid') : t('meals.poll.payLater');
}

function paymentStatusLabel(
  status: MealPollPaymentStatus,
  subscription: MemberMealActivitySubscription | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (subscription?.coveredBySubscription) {
    return t('meals.activity.daySheet.coveredBySubscription');
  }
  switch (status) {
    case 'PAID':
      return t('meals.poll.paymentStatusPaid');
    case 'PENDING_APPROVAL':
      return t('meals.poll.paymentStatusPendingApproval');
    case 'REJECTED':
      return t('meals.poll.paymentStatusRejected');
    default:
      return t('meals.poll.paymentStatusPending');
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function CompactRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.compactRow}>
      <Text style={styles.compactLabel}>{label}</Text>
      <Text style={[styles.compactValue, valueStyle]} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

function StatusChip({ status, label }: { status: MemberMealActivitySlotStatus; label: string }) {
  const chip = STATUS_CHIP[status];
  return (
    <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
      <Text style={styles.statusChipText}>
        {chip.dot} {label}
      </Text>
    </View>
  );
}

function MealCard({
  slot,
  t,
  currencyCode,
}: {
  slot: MemberMealActivitySlotDetail;
  t: (key: string, options?: Record<string, unknown>) => string;
  currencyCode?: string | null;
}) {
  const totalQuantity = slot.selections.reduce((sum, row) => sum + row.quantity, 0);
  const comboLabels = slot.selections.map(row => row.label).join(', ');
  const statusText = dayStatusLabel(slot.status, t);
  const amount = formatComboPrice(slot.slotTotal, slot.selections[0]?.currencyCode ?? currencyCode);
  const showChipOnly =
    slot.status !== 'ACCEPTED' ||
    (!comboLabels && totalQuantity === 0);

  return (
    <View style={styles.mealCard}>
      <Text style={styles.mealTitle}>
        {MEAL_EMOJI[slot.mealType]} {t(mealTypeLabelKey(slot.mealType))}
      </Text>

      {showChipOnly ? (
        <StatusChip status={slot.status} label={statusText} />
      ) : (
        <View style={styles.mealRows}>
          <CompactRow label={t('meals.activity.daySheet.status')} value={statusText} />
          {comboLabels ? (
            <CompactRow label={t('meals.activity.daySheet.combo')} value={comboLabels} />
          ) : null}
          {totalQuantity > 0 ? (
            <CompactRow
              label={t('meals.activity.daySheet.qty')}
              value={formatPlateCount(totalQuantity, t)}
            />
          ) : null}
          {amount ? (
            <CompactRow
              label={t('meals.activity.daySheet.amount')}
              value={amount}
              valueStyle={styles.amountValue}
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

function PaymentSummarySection({
  detail,
  subscription,
  canManage,
  onReview,
  t,
  locale,
}: {
  detail: MemberMealActivityDayDetail;
  subscription?: MemberMealActivitySubscription | null;
  canManage: boolean;
  onReview: () => void;
  t: ReturnType<typeof useTranslation>['t'];
  locale: string;
}) {
  const payment = detail.payment;
  const hasCharges = (detail.dailyCharges?.length ?? 0) > 0;
  const dayTotalFormatted = formatComboPrice(detail.dayTotal, detail.currencyCode);

  if (!payment && !subscription?.coveredBySubscription && !hasCharges && !dayTotalFormatted) {
    return null;
  }

  const showReview =
    canManage &&
    payment?.paymentStatus === 'PENDING_APPROVAL' &&
    Boolean(payment.proofImageUrl);

  return (
    <Section title={t('meals.activity.daySheet.paymentSummary')}>
      <View style={styles.compactRows}>
        {dayTotalFormatted ? (
          <CompactRow
            label={t('meals.activity.daySheet.amount')}
            value={dayTotalFormatted}
            valueStyle={styles.amountValue}
          />
        ) : null}

        {payment?.paymentStatus || subscription?.coveredBySubscription || hasCharges ? (
          <CompactRow
            label={t('meals.activity.daySheet.paymentStatus')}
            value={
              payment?.paymentStatus || subscription?.coveredBySubscription
                ? paymentStatusLabel(payment?.paymentStatus ?? 'PENDING', subscription, t)
                : t('meals.poll.paymentStatusPending')
            }
          />
        ) : null}

        {payment?.paymentChoice ? (
          <CompactRow
            label={t('meals.activity.daySheet.method')}
            value={paymentChoiceLabel(payment.paymentChoice, t)}
          />
        ) : null}

        {(detail.dailyCharges ?? []).map(charge => {
          const amount = formatComboPrice(charge.amount, charge.currencyCode ?? detail.currencyCode);
          if (!amount) {
            return null;
          }
          return (
            <CompactRow
              key={charge.mealType}
              label={t(mealTypeLabelKey(charge.mealType as MealType))}
              value={amount}
            />
          );
        })}
      </View>

      {payment?.proofSubmittedAt ? (
        <CompactRow
          label={t('meals.poll.paymentProofTitle')}
          value={
            formatResponseDateParts(payment.proofSubmittedAt, locale)?.time ??
            payment.proofSubmittedAt
          }
        />
      ) : null}

      {payment?.rejectionReason ? (
        <Text style={styles.rejectionText}>
          {t('meals.poll.rejectionReason', { reason: payment.rejectionReason })}
        </Text>
      ) : null}

      {payment?.proofImageUrl ? (
        <Image source={{ uri: payment.proofImageUrl }} style={styles.proofPreview} resizeMode="contain" />
      ) : null}

      {showReview ? (
        <Pressable style={styles.reviewBtn} onPress={onReview}>
          <Text style={styles.reviewBtnText}>{t('meals.activity.reviewPayment')}</Text>
        </Pressable>
      ) : null}
    </Section>
  );
}

function DeliverySection({
  slots,
  t,
}: {
  slots: MemberMealActivitySlotDetail[];
  t: (key: string) => string;
}) {
  const locations = useMemo(() => {
    const seen = new Set<string>();
    const rows: { name: string; description?: string | null }[] = [];
    for (const slot of slots) {
      if (!slot.deliveryLocationName || seen.has(slot.deliveryLocationName)) {
        continue;
      }
      seen.add(slot.deliveryLocationName);
      rows.push({
        name: slot.deliveryLocationName,
        description: slot.deliveryLocationDescription,
      });
    }
    return rows;
  }, [slots]);

  if (locations.length === 0) {
    return null;
  }

  return (
    <Section title={t('meals.activity.daySheet.deliverySection')}>
      <View style={styles.compactRows}>
        {locations.map(location => (
          <React.Fragment key={location.name}>
            <CompactRow label={t('meals.activity.daySheet.location')} value={location.name} />
            {location.description ? (
              <CompactRow label={t('meals.activity.daySheet.address')} value={location.description} />
            ) : null}
          </React.Fragment>
        ))}
      </View>
    </Section>
  );
}

function SubscriptionSection({
  subscription,
  t,
}: {
  subscription: MemberMealActivitySubscription;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const hasContent =
    subscription.planName ||
    subscription.creditsConsumed != null ||
    subscription.creditsRemaining != null;

  if (!hasContent) {
    return null;
  }

  return (
    <Section title={t('meals.activity.daySheet.subscriptionSection')}>
      <View style={styles.compactRows}>
        {subscription.planName ? (
          <CompactRow label={t('meals.activity.daySheet.planName')} value={subscription.planName} />
        ) : null}
        {subscription.creditsConsumed != null ? (
          <CompactRow
            label={t('meals.activity.daySheet.used')}
            value={t('meals.activity.daySheet.creditsCount', { count: subscription.creditsConsumed })}
          />
        ) : null}
        {subscription.creditsRemaining != null ? (
          <CompactRow
            label={t('meals.activity.daySheet.creditsRemaining')}
            value={t('meals.activity.daySheet.creditsCount', { count: subscription.creditsRemaining })}
          />
        ) : null}
      </View>
    </Section>
  );
}

function ResponseSection({
  responseSubmittedAt,
  locale,
  t,
}: {
  responseSubmittedAt: string;
  locale: string;
  t: (key: string) => string;
}) {
  const parts = formatResponseDateParts(responseSubmittedAt, locale);
  if (!parts) {
    return null;
  }

  return (
    <Section title={t('meals.activity.daySheet.responseSection')}>
      <View style={styles.compactRows}>
        <CompactRow
          label={t('meals.activity.daySheet.submittedAt')}
          value={`${parts.date} · ${parts.time}`}
        />
      </View>
    </Section>
  );
}

export function MemberMealActivityDaySheet({
  visible,
  date,
  spaceId,
  memberId,
  memberName,
  canManage,
  onClose,
  onPaymentReviewed,
}: MemberMealActivityDaySheetProps) {
  const { t, i18n } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<MemberMealActivityDayDetail | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const { height: windowHeight } = useWindowDimensions();
  const minSheetHeight = windowHeight * SHEET_MIN_RATIO;
  const maxSheetHeight = windowHeight * SHEET_MAX_RATIO;
  const sheetHeightAnim = useRef(new Animated.Value(minSheetHeight)).current;
  const dragStartHeight = useRef(minSheetHeight);

  const loadDetail = useCallback(async () => {
    if (!date) {
      return;
    }
    setLoading(true);
    setError(null);
    setDetail(null);
    try {
      const data = await mealsApi.getMemberMealActivityDay(spaceId, memberId, date);
      setDetail(data);
    } catch {
      setError(t('meals.activity.dayDetailLoadError'));
      showToast(t('meals.activity.dayDetailLoadError'));
    } finally {
      setLoading(false);
    }
  }, [date, memberId, showToast, spaceId, t]);

  useEffect(() => {
    if (visible && date) {
      void loadDetail();
    } else {
      setDetail(null);
      setError(null);
      setReviewOpen(false);
    }
  }, [visible, date, loadDetail]);

  useEffect(() => {
    if (visible) {
      sheetHeightAnim.setValue(minSheetHeight);
      dragStartHeight.current = minSheetHeight;
    }
  }, [visible, minSheetHeight, sheetHeightAnim]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
        onPanResponderGrant: () => {
          sheetHeightAnim.stopAnimation(value => {
            dragStartHeight.current = value;
          });
        },
        onPanResponderMove: (_, gesture) => {
          const next = Math.min(
            maxSheetHeight,
            Math.max(minSheetHeight, dragStartHeight.current - gesture.dy),
          );
          sheetHeightAnim.setValue(next);
        },
        onPanResponderRelease: (_, gesture) => {
          sheetHeightAnim.stopAnimation(value => {
            const midpoint = (minSheetHeight + maxSheetHeight) / 2;
            const expand = gesture.vy < -0.4 || value > midpoint;
            const target = expand ? maxSheetHeight : minSheetHeight;
            dragStartHeight.current = target;
            Animated.spring(sheetHeightAnim, {
              toValue: target,
              useNativeDriver: false,
              bounciness: 0,
            }).start();
          });
        },
      }),
    [maxSheetHeight, minSheetHeight, sheetHeightAnim],
  );

  const handleApprovePayment = useCallback(async () => {
    if (!date) {
      return;
    }
    setReviewing(true);
    try {
      await mealsApi.approveMealPollPayment(spaceId, date, memberId);
      showToast(t('meals.poll.paymentApproved'));
      setReviewOpen(false);
      await loadDetail();
      onPaymentReviewed?.();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setReviewing(false);
    }
  }, [date, loadDetail, memberId, onPaymentReviewed, showToast, spaceId, t]);

  const handleRejectPayment = useCallback(async () => {
    if (!date) {
      return;
    }
    setReviewing(true);
    try {
      await mealsApi.rejectMealPollPayment(spaceId, date, memberId);
      showToast(t('meals.poll.paymentRejected'));
      setReviewOpen(false);
      await loadDetail();
      onPaymentReviewed?.();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setReviewing(false);
    }
  }, [date, loadDetail, memberId, onPaymentReviewed, showToast, spaceId, t]);

  const orderedSlots = useMemo(
    () =>
      MEAL_TYPES.map(mealType => {
        const slot = detail?.slots.find(row => row.mealType === mealType);
        return (
          slot ?? {
            mealType,
            status: 'INACTIVE' as const,
            menuPublished: false,
            selections: [],
          }
        );
      }),
    [detail?.slots],
  );

  const visibleSlots = useMemo(
    () => orderedSlots.filter(slot => slot.status !== 'INACTIVE'),
    [orderedSlots],
  );

  const [backdropDismissible, setBackdropDismissible] = useState(false);
  const backdropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setBackdropDismissible(false);
      if (backdropTimerRef.current) {
        clearTimeout(backdropTimerRef.current);
        backdropTimerRef.current = null;
      }
      return;
    }

    backdropTimerRef.current = setTimeout(() => {
      setBackdropDismissible(true);
      backdropTimerRef.current = null;
    }, BACKDROP_DELAY_MS);

    return () => {
      if (backdropTimerRef.current) {
        clearTimeout(backdropTimerRef.current);
        backdropTimerRef.current = null;
      }
    };
  }, [visible]);

  const sheetTitle = date ? formatMenuDateCompact(date, i18n.language) : '';
  const sheetSubtitle = detail?.memberName ?? memberName;
  const slotsToShow = visibleSlots.length > 0 ? visibleSlots : orderedSlots;

  return (
    <>
      {visible && date ? (
        <Modal
          visible
          transparent
          animationType="slide"
          presentationStyle="overFullScreen"
          statusBarTranslucent
          onRequestClose={onClose}>
          <View style={styles.backdrop}>
            <Pressable
              style={styles.backdropTap}
              onPress={() => {
                if (backdropDismissible) {
                  onClose();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            />
            <Animated.View style={[styles.sheet, { height: sheetHeightAnim }]}>
              <View {...panResponder.panHandlers} style={styles.handleArea}>
                <View style={styles.handle} />
              </View>

              <View style={styles.sheetHeader}>
                <View style={styles.headerSide} />
                <View style={styles.titleWrap}>
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    {sheetTitle}
                  </Text>
                  {sheetSubtitle ? (
                    <Text style={styles.sheetSubtitle} numberOfLines={1}>
                      {sheetSubtitle}
                    </Text>
                  ) : null}
                </View>
                <Pressable onPress={onClose} hitSlop={12} style={styles.headerSide}>
                  <Text style={styles.closeBtn}>✕</Text>
                </Pressable>
              </View>

              <ScrollView
                style={styles.scrollBody}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                nestedScrollEnabled>
                {loading ? (
                  <ActivityIndicator color={colors.primary} style={styles.loader} />
                ) : error ? (
                  <Text style={styles.error}>{error}</Text>
                ) : detail && !dayDetailHasActivity(detail) ? (
                  <Text style={styles.emptyText}>{t('meals.activity.daySheet.emptyState')}</Text>
                ) : detail ? (
                  <View style={styles.content}>
                    <Section title={t('meals.activity.daySheet.mealSummary')}>
                      <View style={styles.mealCardList}>
                        {slotsToShow.map(slot => (
                          <MealCard
                            key={slot.mealType}
                            slot={slot}
                            t={t}
                            currencyCode={detail.currencyCode}
                          />
                        ))}
                      </View>
                    </Section>

                    <PaymentSummarySection
                      detail={detail}
                      subscription={detail.subscription}
                      canManage={canManage}
                      onReview={() => setReviewOpen(true)}
                      t={t}
                      locale={i18n.language}
                    />

                    <DeliverySection slots={orderedSlots} t={t} />

                    {detail.subscription ? (
                      <SubscriptionSection subscription={detail.subscription} t={t} />
                    ) : null}

                    {detail.responseSubmittedAt ? (
                      <ResponseSection
                        responseSubmittedAt={detail.responseSubmittedAt}
                        locale={i18n.language}
                        t={t}
                      />
                    ) : null}

                    {detail.notes ? (
                      <Section title={t('meals.activity.daySheet.notesSection')}>
                        <Text style={styles.notesText}>{detail.notes}</Text>
                      </Section>
                    ) : null}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>{t('meals.activity.dayDetailLoadError')}</Text>
                )}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      ) : null}

      <MealPollPaymentReviewModal
        visible={reviewOpen}
        memberName={memberName}
        memberId={memberId}
        proofImageUrl={detail?.payment?.proofImageUrl}
        reviewing={reviewing}
        onClose={() => {
          if (!reviewing) {
            setReviewOpen(false);
          }
        }}
        onApprove={() => void handleApprovePayment()}
        onReject={() => void handleRejectPayment()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  backdropTap: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    elevation: 24,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerSide: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  sheetTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
    textAlign: 'center',
  },
  sheetSubtitle: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
  },
  closeBtn: {
    ...typography.body,
    color: colors.muted,
    fontSize: 18,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  content: {
    gap: spacing.md,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  error: {
    ...typography.caption,
    color: '#DC2626',
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
  },
  sectionBody: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  compactRows: {
    gap: 4,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    minHeight: 22,
  },
  compactLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    width: 88,
    flexShrink: 0,
  },
  compactValue: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  amountValue: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
  mealCardList: {
    gap: spacing.xs,
  },
  mealCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  mealTitle: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 14,
  },
  mealRows: {
    gap: 3,
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusChipText: {
    ...typography.caption,
    fontWeight: '600',
  },
  notesText: {
    ...typography.caption,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  proofPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
  },
  rejectionText: {
    ...typography.caption,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: spacing.xxs,
  },
  reviewBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
  reviewBtnText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
});
