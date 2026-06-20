import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type {
  MealHeadcountDetailResponse,
  MealHeadcountMember,
  MealHeadcountOption,
  MealHeadcountSlot,
  MealPollPaymentStatus,
  MealType,
  UUID,
} from '../../api/types';
import { mealsApi } from '../../api/mealsApi';
import { useMealHeadcountDetail } from '../../hooks/useMealHeadcountDetail';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboNameWithPrice } from '../../utils/comboPrice';
import { formatMenuDate } from '../../utils/mealDates';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import {
  MenuPlanningBottomSheet,
  SheetPrimaryButton,
  SheetSecondaryButton,
} from './MenuPlanningBottomSheet';
import { MealPollPaymentReviewModal } from './MealPollPaymentReviewModal';

type MealHeadcountBottomSheetProps = {
  visible: boolean;
  spaceId: UUID;
  menuDate: string;
  openSlots: MealHeadcountSlot[];
  initialMealType: MealType;
  onClose: () => void;
};

type MealSelectorProps = {
  slots: MealHeadcountSlot[];
  activeMealType: MealType;
  onSelect: (mealType: MealType) => void;
};

type ComboAtLocation = {
  optionId: UUID;
  label: string;
  detail?: string | null;
  price?: number | null;
  currencyCode?: string | null;
  sortOrder: number;
  totalPlates: number;
  members: MealHeadcountMember[];
};

type DeliveryLocationHierarchy = {
  locationKey: string;
  locationId: UUID | null;
  locationName: string;
  totalMeals: number;
  combos: ComboAtLocation[];
};

function MealHeadcountMealSelector({ slots, activeMealType, onSelect }: MealSelectorProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.mealSelectorRow}>
      {slots.map(slot => {
        const selected = slot.mealType === activeMealType;
        return (
          <Pressable
            key={slot.pollId}
            style={[styles.mealSelectorCard, selected && styles.mealSelectorCardActive]}
            onPress={() => onSelect(slot.mealType)}
            accessibilityRole="button"
            accessibilityState={{ selected }}>
            <Text style={[styles.mealSelectorLabel, selected && styles.mealSelectorLabelActive]}>
              {t(mealTypeLabelKey(slot.mealType))}
            </Text>
            <Text style={[styles.mealSelectorValue, selected && styles.mealSelectorValueActive]}>
              {slot.mealsToPrepare}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type CollapsibleSectionProps = {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
};

function CollapsibleSection({ title, count, defaultExpanded = false, children }: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (count === 0) {
    return null;
  }

  return (
    <View style={styles.secondarySection}>
      <Pressable style={styles.secondaryHeader} onPress={() => setExpanded(prev => !prev)}>
        <Text style={styles.secondaryTitle}>{title}</Text>
        <View style={styles.secondaryMeta}>
          <Text style={styles.secondaryCount}>{count}</Text>
          <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
        </View>
      </Pressable>
      {expanded ? children : null}
    </View>
  );
}

function MemberList({ names }: { names: string[] }) {
  if (names.length === 0) {
    return null;
  }

  return (
    <View style={styles.memberList}>
      {names.map(name => (
        <Text key={name} style={styles.memberName}>
          {name}
        </Text>
      ))}
    </View>
  );
}

function PaymentStatusBadge({ status }: { status: MealPollPaymentStatus }) {
  const { t } = useTranslation();

  const label =
    status === 'PAID'
      ? t('meals.poll.paymentStatusPaid')
      : status === 'PENDING_APPROVAL'
        ? t('meals.poll.paymentStatusPendingApproval')
        : status === 'REJECTED'
          ? t('meals.poll.paymentStatusRejected')
          : t('meals.poll.paymentStatusPending');

  const paid = status === 'PAID';
  const awaiting = status === 'PENDING_APPROVAL';
  const rejected = status === 'REJECTED';

  return (
    <View
      style={[
        styles.paymentBadge,
        paid && styles.paymentBadgePaid,
        awaiting && styles.paymentBadgeAwaiting,
        rejected && styles.paymentBadgeRejected,
        !paid && !awaiting && !rejected && styles.paymentBadgePending,
      ]}>
      <Text
        style={[
          styles.paymentBadgeText,
          paid && styles.paymentBadgeTextPaid,
          awaiting && styles.paymentBadgeTextAwaiting,
          rejected && styles.paymentBadgeTextRejected,
          !paid && !awaiting && !rejected && styles.paymentBadgeTextPending,
        ]}>
        {t('meals.poll.paymentStatusLabel')}: {label}
      </Text>
    </View>
  );
}

function buildLocationComboHierarchy(
  options: MealHeadcountOption[],
  deliveryBreakdown: MealHeadcountDetailResponse['deliveryBreakdown'],
  noLocationLabel: string,
): DeliveryLocationHierarchy[] {
  const locationMap = new Map<
    string,
    {
      locationKey: string;
      locationId: UUID | null;
      locationName: string;
      totalMeals: number;
      combos: Map<UUID, ComboAtLocation>;
    }
  >();

  for (const option of options) {
    if (option.optionType !== 'MENU_ENTRY') {
      continue;
    }

    for (const member of option.members) {
      const locationId = member.deliveryLocationId ?? null;
      const locationKey = locationId ?? '__none__';
      const locationName = member.deliveryLocationName ?? noLocationLabel;
      const quantity = member.quantity ?? 1;

      let location = locationMap.get(locationKey);
      if (!location) {
        location = {
          locationKey,
          locationId,
          locationName,
          totalMeals: 0,
          combos: new Map(),
        };
        locationMap.set(locationKey, location);
      }

      location.totalMeals += quantity;

      let combo = location.combos.get(option.optionId);
      if (!combo) {
        combo = {
          optionId: option.optionId,
          label: option.label,
          detail: option.detail,
          price: option.price,
          currencyCode: option.currencyCode,
          sortOrder: option.sortOrder,
          totalPlates: 0,
          members: [],
        };
        location.combos.set(option.optionId, combo);
      }

      combo.totalPlates += quantity;
      combo.members.push({ ...member, quantity });
    }
  }

  const orderedLocationIds =
    deliveryBreakdown?.map(row => row.locationId).filter((id): id is UUID => Boolean(id)) ?? [];

  return [...locationMap.values()]
    .map(location => ({
      locationKey: location.locationKey,
      locationId: location.locationId,
      locationName: location.locationName,
      totalMeals: location.totalMeals,
      combos: [...location.combos.values()]
        .map(combo => ({
          ...combo,
          members: [...combo.members].sort((left, right) =>
            left.memberName.localeCompare(right.memberName),
          ),
        }))
        .sort((left, right) => left.sortOrder - right.sortOrder),
    }))
    .sort((left, right) => {
      const leftIndex = left.locationId
        ? orderedLocationIds.indexOf(left.locationId)
        : Number.MAX_SAFE_INTEGER;
      const rightIndex = right.locationId
        ? orderedLocationIds.indexOf(right.locationId)
        : Number.MAX_SAFE_INTEGER;
      if (leftIndex !== rightIndex) {
        return leftIndex - rightIndex;
      }
      return left.locationName.localeCompare(right.locationName);
    });
}

function CustomerRow({
  member,
  onReviewMember,
}: {
  member: MealHeadcountMember;
  onReviewMember?: (member: MealHeadcountMember) => void;
}) {
  const { t } = useTranslation();
  const canReview = member.paymentStatus === 'PENDING_APPROVAL' && member.paymentProofImageUrl;
  const RowWrapper = canReview ? Pressable : View;
  const plateCount = member.quantity ?? 1;

  return (
    <RowWrapper
      style={styles.customerRow}
      {...(canReview
        ? { onPress: () => onReviewMember?.(member), accessibilityRole: 'button' as const }
        : {})}>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{member.memberName}</Text>
        {member.paymentStatus ? <PaymentStatusBadge status={member.paymentStatus} /> : null}
      </View>
      <Text style={styles.customerPlates}>
        {t('dashboard.headcount.memberPlates', { count: plateCount })}
      </Text>
    </RowWrapper>
  );
}

function ComboAtLocationBlock({
  combo,
  onReviewMember,
}: {
  combo: ComboAtLocation;
  onReviewMember?: (member: MealHeadcountMember) => void;
}) {
  const { t } = useTranslation();

  if (combo.members.length === 0) {
    return null;
  }

  return (
    <View style={styles.comboBlock}>
      <View style={styles.comboHeader}>
        <Text style={styles.comboLabel}>
          {formatComboNameWithPrice(combo.label, combo.price, combo.currencyCode)}
        </Text>
        <Text style={styles.comboPlates}>
          {t('dashboard.headcount.locationPlates', { count: combo.totalPlates })}
        </Text>
      </View>
      {combo.detail ? (
        <Text style={styles.comboDetail} numberOfLines={2}>
          {combo.detail}
        </Text>
      ) : null}
      <View style={styles.customerList}>
        {combo.members.map(member => (
          <CustomerRow key={member.memberId} member={member} onReviewMember={onReviewMember} />
        ))}
      </View>
    </View>
  );
}

function DeliveryLocationHierarchyAccordion({
  group,
  defaultExpanded = true,
  onReviewMember,
}: {
  group: DeliveryLocationHierarchy;
  defaultExpanded?: boolean;
  onReviewMember?: (member: MealHeadcountMember) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.locationSection}>
      <Pressable
        style={styles.locationHeader}
        onPress={() => setExpanded(prev => !prev)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}>
        <View style={styles.locationHeaderMain}>
          <Text style={styles.locationTitle} numberOfLines={1}>
            📍 {group.locationName}{' '}
            <Text style={styles.locationMealsInline}>
              {t('dashboard.headcount.locationMeals', { count: group.totalMeals })}
            </Text>
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.locationBody}>
          {group.combos.map((combo, index) => (
            <React.Fragment key={combo.optionId}>
              {index > 0 ? <View style={styles.comboDivider} /> : null}
              <ComboAtLocationBlock combo={combo} onReviewMember={onReviewMember} />
            </React.Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MealHeadcountDetailBody({
  detail,
  onReviewMember,
}: {
  detail: NonNullable<ReturnType<typeof useMealHeadcountDetail>['detail']>;
  onReviewMember?: (member: MealHeadcountMember) => void;
}) {
  const { t } = useTranslation();

  const locationHierarchy = useMemo(
    () =>
      buildLocationComboHierarchy(
        detail.options,
        detail.deliveryBreakdown,
        t('dashboard.headcount.noDeliveryLocation'),
      ),
    [detail.deliveryBreakdown, detail.options, t],
  );

  const notAvailableOption = useMemo(
    () => detail.options.find(option => option.optionType === 'NOT_AVAILABLE') ?? null,
    [detail.options],
  );

  const isPollClosed = detail.pollStatus === 'CLOSED';

  return (
    <View>
      {isPollClosed ? <Text style={styles.closedBadge}>{t('meals.poll.pollClosed')}</Text> : null}

      {locationHierarchy.length > 0 ? (
        <View style={styles.locationHierarchyList}>
          {locationHierarchy.map(group => (
            <DeliveryLocationHierarchyAccordion
              key={group.locationKey}
              group={group}
              defaultExpanded
              onReviewMember={onReviewMember}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>{t('dashboard.headcount.noDeliveryData')}</Text>
      )}

      <CollapsibleSection
        title={t('dashboard.headcount.notAvailable')}
        count={notAvailableOption?.count ?? 0}>
        <MemberList names={(notAvailableOption?.members ?? []).map(member => member.memberName)} />
      </CollapsibleSection>

      <CollapsibleSection
        title={t('dashboard.headcount.noResponse')}
        count={detail.noResponseMembers.length}>
        <MemberList names={detail.noResponseMembers.map(member => member.memberName)} />
      </CollapsibleSection>
    </View>
  );
}

export function MealHeadcountBottomSheet({
  visible,
  spaceId,
  menuDate,
  openSlots,
  initialMealType,
  onClose,
}: MealHeadcountBottomSheetProps) {
  const { t, i18n } = useTranslation();
  const [activeMealType, setActiveMealType] = useState(initialMealType);
  const [reviewMember, setReviewMember] = useState<MealHeadcountMember | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const { loading, detail, error, reload } = useMealHeadcountDetail(
    spaceId,
    menuDate,
    activeMealType,
    visible,
  );

  const totalMealsAllSlots = useMemo(
    () => openSlots.reduce((sum, slot) => sum + slot.mealsToPrepare, 0),
    [openSlots],
  );

  useEffect(() => {
    if (visible) {
      setActiveMealType(initialMealType);
    }
  }, [initialMealType, visible]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSelectMeal = useCallback((mealType: MealType) => {
    setActiveMealType(mealType);
  }, []);

  const handleRemind = useCallback(() => {
    navigateMainStack('MenuSharePreview', { spaceId, menuDate, mealType: activeMealType });
  }, [activeMealType, menuDate, spaceId]);

  const handleShare = useCallback(() => {
    navigateMainStack('MenuSharePreview', { spaceId, menuDate });
  }, [menuDate, spaceId]);

  const showToast = useToastStore(state => state.showToast);

  const handleReviewMember = useCallback((member: MealHeadcountMember) => {
    setReviewMember(member);
  }, []);

  const closeReview = useCallback(() => {
    if (!reviewing) {
      setReviewMember(null);
    }
  }, [reviewing]);

  const handleApprovePayment = useCallback(
    async (memberId: UUID) => {
      setReviewing(true);
      try {
        await mealsApi.approveMealPollPayment(spaceId, menuDate, memberId);
        showToast(t('meals.poll.paymentApproved'));
        setReviewMember(null);
        void reload();
      } catch {
        showToast(t('meals.errors.saveFailed'));
      } finally {
        setReviewing(false);
      }
    },
    [menuDate, reload, showToast, spaceId, t],
  );

  const handleRejectPayment = useCallback(
    async (memberId: UUID) => {
      setReviewing(true);
      try {
        await mealsApi.rejectMealPollPayment(spaceId, menuDate, memberId);
        showToast(t('meals.poll.paymentRejected'));
        setReviewMember(null);
        void reload();
      } catch {
        showToast(t('meals.errors.saveFailed'));
      } finally {
        setReviewing(false);
      }
    },
    [menuDate, reload, showToast, spaceId, t],
  );

  const isPollClosed = detail?.pollStatus === 'CLOSED';

  const footer = isPollClosed ? null : (
    <>
      <SheetPrimaryButton label={t('dashboard.headcount.remindMembers')} onPress={handleRemind} />
      <SheetSecondaryButton label={t('dashboard.headcount.shareMenu')} onPress={handleShare} />
    </>
  );

  return (
    <>
      <MenuPlanningBottomSheet
        visible={visible}
        title={t('dashboard.headcount.title')}
        onClose={handleClose}
        footer={footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryDate}>{formatMenuDate(menuDate, i18n.language)}</Text>
          <Text style={styles.summaryTotalMeals}>
            {t('dashboard.headcount.totalMeals')}:{' '}
            <Text style={styles.summaryTotalMealsValue}>{totalMealsAllSlots}</Text>
          </Text>
        </View>

        <MealHeadcountMealSelector
          slots={openSlots}
          activeMealType={activeMealType}
          onSelect={handleSelectMeal}
        />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <Text style={styles.emptyText}>{t('dashboard.headcount.loadError')}</Text>
        ) : !detail ? (
          <Text style={styles.emptyText}>{t('dashboard.headcount.noData')}</Text>
        ) : (
          <MealHeadcountDetailBody detail={detail} onReviewMember={handleReviewMember} />
        )}
      </MenuPlanningBottomSheet>

      <MealPollPaymentReviewModal
        visible={reviewMember != null}
        memberName={reviewMember?.memberName ?? ''}
        memberId={reviewMember?.memberId ?? ('' as UUID)}
        proofImageUrl={reviewMember?.paymentProofImageUrl}
        reviewing={reviewing}
        onClose={closeReview}
        onApprove={memberId => void handleApprovePayment(memberId)}
        onReject={memberId => void handleRejectPayment(memberId)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  summaryDate: {
    ...typography.body,
    color: colors.muted,
    flex: 1,
  },
  summaryTotalMeals: {
    ...typography.body,
    color: colors.muted,
  },
  summaryTotalMealsValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  mealSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  mealSelectorCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
    gap: 2,
    minHeight: 48,
    justifyContent: 'center',
  },
  mealSelectorCardActive: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary,
    borderWidth: 2,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  mealSelectorLabel: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
  },
  mealSelectorLabelActive: {
    color: colors.primaryDark,
    fontSize: 12,
  },
  mealSelectorValue: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    fontSize: 18,
    lineHeight: 22,
  },
  mealSelectorValueActive: {
    ...typography.h3,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  closedBadge: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  locationHierarchyList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  locationSection: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  locationHeaderMain: {
    flex: 1,
  },
  locationTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
  locationMealsInline: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  locationBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  comboBlock: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  comboHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  comboLabel: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.textPrimary,
  },
  comboPlates: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  comboDetail: {
    ...typography.caption,
    color: colors.muted,
    marginTop: -spacing.xxs,
  },
  comboDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  customerList: {
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  customerInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  customerName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  customerPlates: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    minWidth: 72,
  },
  secondarySection: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  secondaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  secondaryTitle: {
    ...typography.body,
    color: colors.muted,
  },
  secondaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  secondaryCount: {
    ...typography.bodyStrong,
    color: colors.muted,
  },
  chevron: {
    ...typography.bodyStrong,
    color: colors.muted,
    fontSize: 16,
  },
  memberList: {
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  memberName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  paymentBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  paymentBadgePaid: {
    backgroundColor: '#DCFCE7',
  },
  paymentBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  paymentBadgeAwaiting: {
    backgroundColor: '#DBEAFE',
  },
  paymentBadgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  paymentBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  paymentBadgeTextPaid: {
    color: colors.success,
  },
  paymentBadgeTextPending: {
    color: '#D97706',
  },
  paymentBadgeTextAwaiting: {
    color: '#2563EB',
  },
  paymentBadgeTextRejected: {
    color: '#DC2626',
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
