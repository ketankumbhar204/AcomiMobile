import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type {
  MealHeadcountDetailResponse,
  MealHeadcountMember,
  MealHeadcountOption,
  MealHeadcountSlot,
  MealPollPaymentStatus,
  MealPollStatus,
  MealType,
  UUID,
} from '../../api/types';
import { mealsApi } from '../../api/mealsApi';
import { useMealHeadcountDetail } from '../../hooks/useMealHeadcountDetail';
import { useMealPricingPolicy } from '../../hooks/useMealPricingPolicy';
import { useServingLocationName } from '../../hooks/useServingLocationName';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { useToastStore } from '../../store/toastStore';
import { Badge } from '../ui/Badge';
import { canSendPaymentReminder } from '../../utils/mealPollPayment';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboNameWithPrice } from '../../utils/comboPrice';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import {
  servingLocationMode,
  showsServingLocationSection,
  usesDeliveryLocations,
  usesPropertyServingLocation,
  type ServingLocationMode,
} from '../../utils/servingLocationPolicy';
import { MealPollPaymentReviewModal } from './MealPollPaymentReviewModal';
import { MealOperationSlotCard } from './MealOperationSlotCard';
import { SheetPrimaryButton, SheetSecondaryButton } from './MenuPlanningBottomSheet';
import type { DashboardMealSlotRow } from '../../utils/dashboardMealSlotDisplay';
import type { MealStatusKind } from '../../utils/mealStatusTheme';
import { MEAL_TYPES } from '../../utils/mealLabels';

export type MealHeadcountFooterState = {
  statusKind: MealStatusKind;
  pollStatus: MealPollStatus | null;
  hasHeadcountSlot: boolean;
};

type MealHeadcountPanelProps = {
  spaceId: UUID;
  menuDate: string;
  slots: MealHeadcountSlot[];
  /** Dashboard-style rows for Breakfast / Lunch / Dinner strip (status + captions). */
  slotRows?: DashboardMealSlotRow[];
  slotsLoading?: boolean;
  initialMealType?: MealType;
  enabled?: boolean;
  /** Show total meals summary above meal tabs. */
  showTotalSummary?: boolean;
  /** Render remind / share buttons below detail. */
  showActions?: boolean;
  onReload?: () => void;
  onActiveMealTypeChange?: (mealType: MealType) => void;
  /** Active meal footer context for the sticky drawer actions. */
  onFooterStateChange?: (state: MealHeadcountFooterState) => void;
  /** @deprecated Prefer onFooterStateChange. */
  onPollStatusChange?: (closed: boolean) => void;
  /** Close the host drawer before navigating to plan/share. */
  onBeforeNavigate?: () => void;
  /** Bump to force-refetch the active meal headcount detail (e.g. after Close Poll). */
  detailRefreshToken?: number;
  readOnly?: boolean;
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

function fallbackSlotRowsFromHeadcount(slots: MealHeadcountSlot[]): DashboardMealSlotRow[] {
  return MEAL_TYPES.map(mealType => {
    const slot = slots.find(row => row.mealType === mealType);
    if (!slot) {
      return {
        mealType,
        status: 'not_planned' as const,
        statusKind: 'empty' as const,
        statusLabelKey: 'meals.status.empty',
        captionKey: 'meals.planning.cardHintEmpty',
        captionTone: 'muted' as const,
      };
    }
    const closed = slot.pollStatus === 'CLOSED';
    return {
      mealType,
      status: 'published' as const,
      statusKind: 'shared' as const,
      statusLabelKey: 'meals.status.shared',
      captionKey: closed
        ? 'meals.planning.cardHintPollClosed'
        : 'meals.planning.cardHintShared',
      countPrimary: String(slot.mealsToPrepare),
      countUnitKey: 'dashboard.headcount.totalMeals',
      captionTone: closed ? ('muted' as const) : ('progress' as const),
    };
  });
}

function MealHeadcountMealSelector({
  slotRows,
  activeMealType,
  onSelect,
}: {
  slotRows: DashboardMealSlotRow[];
  activeMealType: MealType;
  onSelect: (mealType: MealType) => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.mealSelectorRow}>
      {slotRows.map(row => (
        <MealOperationSlotCard
          key={row.mealType}
          mealLabel={t(mealTypeLabelKey(row.mealType))}
          caption={t(row.captionKey, row.captionParams)}
          countPrimary={row.countPrimary}
          countUnit={row.countUnitKey ? t(row.countUnitKey) : undefined}
          captionTone={row.captionTone}
          statusKind={row.statusKind}
          selected={row.mealType === activeMealType}
          compact
          onPress={() => onSelect(row.mealType)}
        />
      ))}
    </View>
  );
}

function CollapsibleSection({
  title,
  count,
  defaultExpanded = false,
  children,
}: {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
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
  config: {
    mode: ServingLocationMode;
    noLocationLabel: string;
    propertyServingLocationName: string;
  },
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
      let locationKey: string;
      let locationName: string;

      if (usesPropertyServingLocation(config.mode)) {
        locationKey = '__property__';
        locationName = config.propertyServingLocationName;
      } else if (locationId) {
        locationKey = locationId;
        locationName = member.deliveryLocationName ?? config.noLocationLabel;
      } else {
        locationKey = '__none__';
        locationName = config.noLocationLabel;
      }
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

function buildFlatComboList(options: MealHeadcountOption[]): ComboAtLocation[] {
  const comboMap = new Map<UUID, ComboAtLocation>();

  for (const option of options) {
    if (option.optionType !== 'MENU_ENTRY') {
      continue;
    }

    let combo = comboMap.get(option.optionId);
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
      comboMap.set(option.optionId, combo);
    }

    for (const member of option.members) {
      const quantity = member.quantity ?? 1;
      combo.totalPlates += quantity;
      combo.members.push({ ...member, quantity });
    }
  }

  return [...comboMap.values()]
    .map(combo => ({
      ...combo,
      members: [...combo.members].sort((left, right) =>
        left.memberName.localeCompare(right.memberName),
      ),
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function CustomerRow({
  member,
  onReviewMember,
  onRemindMember,
  remindingMemberId,
}: {
  member: MealHeadcountMember;
  onReviewMember?: (member: MealHeadcountMember) => void;
  onRemindMember?: (member: MealHeadcountMember) => void;
  remindingMemberId?: UUID | null;
}) {
  const { t } = useTranslation();
  const canReview = member.paymentStatus === 'PENDING_APPROVAL' && member.paymentProofImageUrl;
  const canRemind = canSendPaymentReminder(member.paymentStatus) && onRemindMember != null;
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
      <View style={styles.customerActions}>
        {canRemind ? (
          <Pressable
            style={styles.remindLink}
            onPress={() => onRemindMember(member)}
            disabled={remindingMemberId === member.memberId}>
            <Text style={styles.remindLinkText}>
              {remindingMemberId === member.memberId
                ? t('meals.poll.sendingReminder')
                : t('meals.poll.remind')}
            </Text>
          </Pressable>
        ) : null}
        <Text style={styles.customerPlates}>
          {t('dashboard.headcount.memberPlates', { count: plateCount })}
        </Text>
      </View>
    </RowWrapper>
  );
}

function ComboAtLocationBlock({
  combo,
  showMealPrices = true,
  onReviewMember,
  onRemindMember,
  remindingMemberId,
}: {
  combo: ComboAtLocation;
  showMealPrices?: boolean;
  onReviewMember?: (member: MealHeadcountMember) => void;
  onRemindMember?: (member: MealHeadcountMember) => void;
  remindingMemberId?: UUID | null;
}) {
  const { t } = useTranslation();

  if (combo.members.length === 0) {
    return null;
  }

  return (
    <View style={styles.comboBlock}>
      <View style={styles.comboHeader}>
        <Text style={styles.comboLabel} numberOfLines={2}>
          {formatComboNameWithPrice(
            combo.label,
            combo.price,
            combo.currencyCode,
            showMealPrices,
          )}
        </Text>
        <Badge
          label={t('dashboard.headcount.plateBadge', { count: combo.totalPlates })}
          showDot={false}
        />
      </View>
      {combo.detail ? (
        <Text style={styles.comboDetail} numberOfLines={2}>
          {combo.detail}
        </Text>
      ) : null}
      <View style={styles.customerList}>
        {combo.members.map(member => (
          <CustomerRow
            key={member.memberId}
            member={member}
            onReviewMember={onReviewMember}
            onRemindMember={onRemindMember}
            remindingMemberId={remindingMemberId}
          />
        ))}
      </View>
    </View>
  );
}

function DeliveryLocationHierarchyAccordion({
  group,
  locationMode,
  showMealPrices = true,
  editableServingLocation = false,
  onSaveServingLocation,
  defaultExpanded = true,
  onReviewMember,
  onRemindMember,
  remindingMemberId,
}: {
  group: DeliveryLocationHierarchy;
  locationMode: ServingLocationMode;
  showMealPrices?: boolean;
  editableServingLocation?: boolean;
  onSaveServingLocation?: (name: string) => void | Promise<void>;
  defaultExpanded?: boolean;
  onReviewMember?: (member: MealHeadcountMember) => void;
  onRemindMember?: (member: MealHeadcountMember) => void;
  remindingMemberId?: UUID | null;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(group.locationName);
  const isUnsetWarning = usesDeliveryLocations(locationMode) && group.locationKey === '__none__';
  const locationPrefix = usesPropertyServingLocation(locationMode)
    ? t('dashboard.headcount.servingLocationHeading')
    : t('dashboard.headcount.locationHeading');
  const mealsLabel = t('dashboard.headcount.locationMeals', { count: group.totalMeals });

  useEffect(() => {
    if (!editing) {
      setDraft(group.locationName);
    }
  }, [editing, group.locationName]);

  const handleSaveServingLocation = useCallback(() => {
    const nextName = draft.trim();
    if (!nextName) {
      return;
    }
    void Promise.resolve(onSaveServingLocation?.(nextName)).finally(() => {
      setEditing(false);
    });
  }, [draft, onSaveServingLocation]);

  const startEditing = useCallback(() => {
    setDraft(group.locationName);
    setEditing(true);
    setExpanded(true);
  }, [group.locationName]);

  return (
    <View style={styles.locationSection}>
      <View style={styles.locationHeader}>
        {editing ? (
          <>
            <Text style={styles.locationPrefix}>{locationPrefix}:</Text>
            <TextInput
              style={styles.servingLocationInput}
              value={draft}
              onChangeText={setDraft}
              placeholder={t('dashboard.headcount.servingLocationPlaceholder')}
              placeholderTextColor={colors.muted}
              autoFocus
            />
            <View style={styles.servingLocationEditActions}>
              <Pressable
                style={styles.servingLocationSaveBtn}
                onPress={handleSaveServingLocation}
                accessibilityRole="button">
                <Text style={styles.servingLocationSaveText}>
                  {t('dashboard.headcount.servingLocationSave')}
                </Text>
              </Pressable>
              <Pressable
                style={styles.servingLocationCancelBtn}
                onPress={() => {
                  setDraft(group.locationName);
                  setEditing(false);
                }}
                accessibilityRole="button">
                <Text style={styles.servingLocationCancelText}>
                  {t('dashboard.headcount.servingLocationCancel')}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable
            style={styles.locationHeaderMainPressable}
            onPress={() => setExpanded(prev => !prev)}
            accessibilityRole="button"
            accessibilityState={{ expanded }}>
            <Text style={styles.locationPrefix}>{locationPrefix}:</Text>
            {editableServingLocation ? (
              <Pressable
                style={styles.locationNameEditGroup}
                onPress={startEditing}
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.headcount.editServingLocation')}>
                <Text
                  style={[styles.locationName, isUnsetWarning && styles.locationTitleWarning]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {group.locationName}
                </Text>
                <Text style={styles.servingLocationEditIcon}>✏️</Text>
              </Pressable>
            ) : (
              <Text
                style={[styles.locationName, isUnsetWarning && styles.locationTitleWarning]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {group.locationName}
              </Text>
            )}
            <Text style={styles.locationSeparator}>:</Text>
            <View style={styles.locationHeaderSpacer} />
            <Text style={styles.locationMealsInline}>{mealsLabel}</Text>
            <Text style={styles.chevron}>{expanded ? '▾' : '›'}</Text>
          </Pressable>
        )}
      </View>

      {expanded && !editing ? (
        <View style={styles.locationBody}>
          {group.combos.map((combo, index) => (
            <React.Fragment key={combo.optionId}>
              <ComboAtLocationBlock
                combo={combo}
                showMealPrices={showMealPrices}
                onReviewMember={onReviewMember}
                onRemindMember={onRemindMember}
                remindingMemberId={remindingMemberId}
              />
            </React.Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MealHeadcountDetailBody({
  detail,
  locationMode,
  showMealPrices = true,
  propertyServingLocationName,
  onSaveServingLocation,
  onReviewMember,
  onRemindMember,
  remindingMemberId,
}: {
  detail: MealHeadcountDetailResponse;
  locationMode: ServingLocationMode;
  showMealPrices?: boolean;
  propertyServingLocationName: string;
  onSaveServingLocation?: (name: string) => void | Promise<void>;
  onReviewMember?: (member: MealHeadcountMember) => void;
  onRemindMember?: (member: MealHeadcountMember) => void;
  remindingMemberId?: UUID | null;
}) {
  const { t } = useTranslation();

  const locationHierarchy = useMemo(
    () =>
      buildLocationComboHierarchy(detail.options, detail.deliveryBreakdown, {
        mode: locationMode,
        noLocationLabel: t('dashboard.headcount.noDeliveryLocation'),
        propertyServingLocationName,
      }),
    [detail.deliveryBreakdown, detail.options, locationMode, propertyServingLocationName, t],
  );

  const flatCombos = useMemo(
    () => (showsServingLocationSection(locationMode) ? [] : buildFlatComboList(detail.options)),
    [detail.options, locationMode],
  );

  const notAvailableOption = useMemo(
    () => detail.options.find(option => option.optionType === 'NOT_AVAILABLE') ?? null,
    [detail.options],
  );

  const isPollClosed = detail.pollStatus === 'CLOSED';
  const showLocationSections = showsServingLocationSection(locationMode);

  return (
    <View>
      {isPollClosed ? <Text style={styles.closedBadge}>{t('meals.poll.pollClosed')}</Text> : null}

      {showLocationSections && locationHierarchy.length > 0 ? (
        <View style={styles.locationHierarchyList}>
          {locationHierarchy.map(group => (
            <DeliveryLocationHierarchyAccordion
              key={group.locationKey}
              group={group}
              locationMode={locationMode}
              showMealPrices={showMealPrices}
              editableServingLocation={usesPropertyServingLocation(locationMode)}
              onSaveServingLocation={onSaveServingLocation}
              defaultExpanded={locationHierarchy.length === 1}
              onReviewMember={onReviewMember}
              onRemindMember={onRemindMember}
              remindingMemberId={remindingMemberId}
            />
          ))}
        </View>
      ) : null}

      {!showLocationSections && flatCombos.length > 0 ? (
        <View style={styles.flatComboList}>
          {flatCombos.map((combo, index) => (
            <React.Fragment key={combo.optionId}>
              <ComboAtLocationBlock
                combo={combo}
                showMealPrices={showMealPrices}
                onReviewMember={onReviewMember}
                onRemindMember={onRemindMember}
                remindingMemberId={remindingMemberId}
              />
            </React.Fragment>
          ))}
        </View>
      ) : null}

      {showLocationSections && locationHierarchy.length === 0 && flatCombos.length === 0 ? (
        <Text style={styles.emptyText}>{t('dashboard.headcount.noDeliveryData')}</Text>
      ) : null}

      {!showLocationSections && flatCombos.length === 0 ? (
        <Text style={styles.emptyText}>{t('dashboard.headcount.noDeliveryData')}</Text>
      ) : null}

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

export function MealHeadcountActionButtons({
  spaceId,
  menuDate,
  activeMealType,
  statusKind,
  pollStatus,
  isMess,
  readOnly = false,
  onBeforeNavigate,
  onAfterClosePoll,
}: {
  spaceId: UUID;
  menuDate: string;
  activeMealType: MealType;
  statusKind: MealStatusKind;
  pollStatus: MealPollStatus | null;
  isMess: boolean;
  readOnly?: boolean;
  onBeforeNavigate?: () => void;
  onAfterClosePoll?: () => void;
}) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [closingPoll, setClosingPoll] = useState(false);

  const handleRemind = useCallback(() => {
    onBeforeNavigate?.();
    navigateMainStack('MenuSharePreview', { spaceId, menuDate, mealType: activeMealType });
  }, [activeMealType, menuDate, onBeforeNavigate, spaceId]);

  const handleShareMenu = useCallback(() => {
    onBeforeNavigate?.();
    navigateMainStack('MenuSharePreview', {
      spaceId,
      menuDate,
      mealType: activeMealType,
    });
  }, [activeMealType, menuDate, onBeforeNavigate, spaceId]);

  const handleShareDay = useCallback(() => {
    onBeforeNavigate?.();
    navigateMainStack('MenuSharePreview', { spaceId, menuDate });
  }, [menuDate, onBeforeNavigate, spaceId]);

  const runClosePoll = useCallback(async () => {
    setClosingPoll(true);
    try {
      await mealsApi.closeMealPoll(spaceId, menuDate, activeMealType);
      showToast(t('meals.poll.closeSuccess'));
      onAfterClosePoll?.();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setClosingPoll(false);
    }
  }, [activeMealType, menuDate, onAfterClosePoll, showToast, spaceId, t]);

  const handleClosePoll = useCallback(() => {
    Alert.alert(t('meals.poll.closeConfirmTitle'), t('meals.poll.closeConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('meals.poll.closePoll'),
        style: 'destructive',
        onPress: () => {
          void runClosePoll();
        },
      },
    ]);
  }, [runClosePoll, t]);

  if (readOnly) {
    return null;
  }

  // Mess lifecycle-aligned actions
  if (isMess) {
    if (statusKind === 'draft' || statusKind === 'needs_reshare') {
      return (
        <View style={styles.actionsRow}>
          <SheetPrimaryButton
            label={t('dashboard.headcount.shareMenu')}
            onPress={handleShareMenu}
          />
        </View>
      );
    }

    if (statusKind === 'empty') {
      return (
        <View style={styles.actionsRow}>
          <SheetPrimaryButton
            label={t('dashboard.operations.planMenuCta')}
            onPress={() => {
              onBeforeNavigate?.();
              navigateMainStack('MenuPlanning', {
                spaceId,
                menuDate,
                mealType: activeMealType,
              });
            }}
          />
        </View>
      );
    }

    if (statusKind === 'shared' && pollStatus === 'CLOSED') {
      return (
        <View style={styles.actionsRow}>
          <SheetPrimaryButton
            label={t('dashboard.headcount.shareAgain')}
            onPress={handleShareMenu}
          />
        </View>
      );
    }

    // Shared + open (or open status not yet resolved) → remind + close poll
    if (statusKind === 'shared') {
      return (
        <View style={styles.actionsRowHorizontal}>
          <View style={styles.actionFlex}>
            <SheetPrimaryButton
              label={t('dashboard.headcount.remindMembers')}
              onPress={handleRemind}
              disabled={closingPoll}
            />
          </View>
          <View style={styles.actionFlex}>
            <SheetSecondaryButton
              label={t('meals.poll.closePoll')}
              onPress={handleClosePoll}
              disabled={closingPoll}
            />
          </View>
        </View>
      );
    }

    return null;
  }

  // Non-Mess: keep prior remind + share while poll is open
  if (pollStatus === 'CLOSED') {
    return null;
  }

  return (
    <View style={styles.actionsRow}>
      <SheetPrimaryButton label={t('dashboard.headcount.remindMembers')} onPress={handleRemind} />
      <SheetSecondaryButton label={t('dashboard.headcount.shareMenu')} onPress={handleShareDay} />
    </View>
  );
}

export function MealHeadcountPanel({
  spaceId,
  menuDate,
  slots,
  slotRows: slotRowsProp,
  slotsLoading = false,
  initialMealType = 'BREAKFAST',
  enabled = true,
  showTotalSummary = true,
  showActions = false,
  onReload,
  onActiveMealTypeChange,
  onFooterStateChange,
  onPollStatusChange,
  onBeforeNavigate,
  detailRefreshToken = 0,
  readOnly = false,
}: MealHeadcountPanelProps) {
  const { t } = useTranslation();
  const { spaceType } = useSpacePermissions(spaceId);
  const isMess = spaceType === 'MESS';
  const mealPricing = useMealPricingPolicy(spaceId);
  const locationMode = servingLocationMode(spaceType);
  const { servingLocationName, updateServingLocationName } = useServingLocationName(spaceId);
  const [activeMealType, setActiveMealType] = useState<MealType>(initialMealType);
  const [reviewMember, setReviewMember] = useState<MealHeadcountMember | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [remindingMemberId, setRemindingMemberId] = useState<UUID | null>(null);
  const showToast = useToastStore(state => state.showToast);

  const slotRows = useMemo(
    () =>
      slotRowsProp && slotRowsProp.length > 0
        ? slotRowsProp
        : fallbackSlotRowsFromHeadcount(slots),
    [slotRowsProp, slots],
  );

  const activeHasHeadcountSlot = slots.some(slot => slot.mealType === activeMealType);
  const panelEnabled = enabled && activeHasHeadcountSlot;
  const { loading, detail, error, reload } = useMealHeadcountDetail(
    spaceId,
    menuDate,
    activeMealType,
    panelEnabled,
  );

  const totalMealsAllSlots = useMemo(
    () => slots.reduce((sum, slot) => sum + slot.mealsToPrepare, 0),
    [slots],
  );

  const activeRow = slotRows.find(row => row.mealType === activeMealType);
  const activeSlot = slots.find(slot => slot.mealType === activeMealType);
  const resolvedPollStatus: MealPollStatus | null =
    detail?.pollStatus ?? activeSlot?.pollStatus ?? null;
  const statusKind: MealStatusKind = activeRow?.statusKind ?? 'empty';

  useEffect(() => {
    if (slotRows.length === 0) {
      return;
    }
    const preferred = slotRows.some(row => row.mealType === initialMealType)
      ? initialMealType
      : slotRows[0].mealType;
    setActiveMealType(preferred);
  }, [initialMealType, menuDate, slotRows]);

  useEffect(() => {
    onActiveMealTypeChange?.(activeMealType);
  }, [activeMealType, onActiveMealTypeChange]);

  useEffect(() => {
    onFooterStateChange?.({
      statusKind,
      pollStatus: resolvedPollStatus,
      hasHeadcountSlot: activeHasHeadcountSlot,
    });
    onPollStatusChange?.(resolvedPollStatus === 'CLOSED');
  }, [
    activeHasHeadcountSlot,
    onFooterStateChange,
    onPollStatusChange,
    resolvedPollStatus,
    statusKind,
  ]);

  useEffect(() => {
    if (detailRefreshToken <= 0) {
      return;
    }
    void reload();
  }, [detailRefreshToken, reload]);
  const handleReviewMember = useCallback((member: MealHeadcountMember) => {
    setReviewMember(member);
  }, []);

  const closeReview = useCallback(() => {
    if (!reviewing) {
      setReviewMember(null);
    }
  }, [reviewing]);

  const refreshAll = useCallback(() => {
    void reload();
    onReload?.();
  }, [onReload, reload]);

  const handleRemindMember = useCallback(
    async (member: MealHeadcountMember) => {
      setRemindingMemberId(member.memberId);
      try {
        await mealsApi.sendMealPollPaymentReminder(spaceId, menuDate, member.memberId);
        showToast(t('meals.poll.reminderSent'));
        refreshAll();
      } catch {
        showToast(t('meals.errors.saveFailed'));
      } finally {
        setRemindingMemberId(null);
      }
    },
    [menuDate, refreshAll, showToast, spaceId, t],
  );

  const handleApprovePayment = useCallback(
    async (memberId: UUID, approvalRemarks?: string) => {
      setReviewing(true);
      try {
        await mealsApi.approveMealPollPayment(spaceId, menuDate, memberId, approvalRemarks);
        showToast(t('meals.poll.paymentApproved'));
        setReviewMember(null);
        refreshAll();
      } catch {
        showToast(t('meals.errors.saveFailed'));
      } finally {
        setReviewing(false);
      }
    },
    [menuDate, refreshAll, showToast, spaceId, t],
  );

  const handleSaveServingLocation = useCallback(
    async (name: string) => {
      await updateServingLocationName(name);
      showToast(t('dashboard.headcount.servingLocationSaved'));
    },
    [showToast, t, updateServingLocationName],
  );

  const handleRejectPayment = useCallback(
    async (memberId: UUID, rejectionReason?: string) => {
      setReviewing(true);
      try {
        await mealsApi.rejectMealPollPayment(spaceId, menuDate, memberId, rejectionReason);
        showToast(t('meals.poll.paymentRejected'));
        setReviewMember(null);
        refreshAll();
      } catch {
        showToast(t('meals.errors.saveFailed'));
      } finally {
        setReviewing(false);
      }
    },
    [menuDate, refreshAll, showToast, spaceId, t],
  );

  const handleOpenShareOrPlan = useCallback(() => {
    onBeforeNavigate?.();
    const kind = activeRow?.statusKind;
    if (kind === 'empty') {
      navigateMainStack('MenuPlanning', {
        spaceId,
        menuDate,
        mealType: activeMealType,
      });
      return;
    }
    // Draft / needs reshare / shared-without-poll → share preview for this meal.
    navigateMainStack('MenuSharePreview', {
      spaceId,
      menuDate,
      mealType: activeMealType,
    });
  }, [activeMealType, activeRow?.statusKind, menuDate, onBeforeNavigate, spaceId]);

  if (slotsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (slots.length === 0 && slotRows.every(row => row.statusKind === 'empty')) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>{t('dashboard.headcount.noData')}</Text>
      </View>
    );
  }

  return (
    <>
      {showTotalSummary ? (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalMeals}>
            {t('dashboard.headcount.totalMeals')}:{' '}
            <Text style={styles.summaryTotalMealsValue}>{totalMealsAllSlots}</Text>
          </Text>
        </View>
      ) : null}

      <MealHeadcountMealSelector
        slotRows={slotRows}
        activeMealType={activeMealType}
        onSelect={setActiveMealType}
      />

      {!activeHasHeadcountSlot ? (
        <View style={styles.emptyActionWrap}>
          <Text style={styles.emptyText}>
            {activeRow?.statusKind === 'shared'
              ? t('dashboard.headcount.noData')
              : t('dashboard.headcount.notSharedYet', {
                  meal: t(mealTypeLabelKey(activeMealType)),
                })}
          </Text>
          {!readOnly && activeRow?.statusKind === 'empty' && !isMess ? (
            <View style={styles.emptyActionButton}>
              <SheetPrimaryButton
                label={t('dashboard.operations.planMenuCta')}
                onPress={handleOpenShareOrPlan}
              />
            </View>
          ) : null}
          {!readOnly &&
          activeRow?.statusKind !== 'shared' &&
          activeRow?.statusKind !== 'empty' &&
          !isMess ? (
            <View style={styles.emptyActionButton}>
              <SheetPrimaryButton
                label={t('dashboard.headcount.shareMenu')}
                onPress={handleOpenShareOrPlan}
              />
            </View>
          ) : null}
        </View>
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <Text style={styles.emptyText}>{t('dashboard.headcount.loadError')}</Text>
      ) : !detail ? (
        <Text style={styles.emptyText}>{t('dashboard.headcount.noData')}</Text>
      ) : (
        <MealHeadcountDetailBody
          detail={detail}
          locationMode={locationMode}
          showMealPrices={mealPricing.showMealPrices}
          propertyServingLocationName={servingLocationName}
          onSaveServingLocation={readOnly ? undefined : handleSaveServingLocation}
          onReviewMember={readOnly ? undefined : handleReviewMember}
          onRemindMember={readOnly ? undefined : handleRemindMember}
          remindingMemberId={remindingMemberId}
        />
      )}

      {showActions && !readOnly ? (
        <MealHeadcountActionButtons
          spaceId={spaceId}
          menuDate={menuDate}
          activeMealType={activeMealType}
          statusKind={statusKind}
          pollStatus={resolvedPollStatus}
          isMess={isMess}
          readOnly={readOnly}
          onBeforeNavigate={onBeforeNavigate}
          onAfterClosePoll={refreshAll}
        />
      ) : null}

      <MealPollPaymentReviewModal
        visible={reviewMember != null}
        memberName={reviewMember?.memberName ?? ''}
        memberId={reviewMember?.memberId ?? ('' as UUID)}
        proofImageUrl={reviewMember?.paymentProofImageUrl}
        reviewing={reviewing}
        onClose={closeReview}
        onApprove={(memberId, approvalRemarks) => void handleApprovePayment(memberId, approvalRemarks)}
        onReject={(memberId, rejectionReason) => void handleRejectPayment(memberId, rejectionReason)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyWrap: {
    paddingVertical: spacing.md,
  },
  emptyActionWrap: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  emptyActionButton: {
    marginTop: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
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
    alignItems: 'stretch',
    gap: spacing.sm,
    marginBottom: spacing.md,
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
    marginBottom: spacing.sm,
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  locationHeaderMainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  locationPrefix: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    flexShrink: 0,
  },
  locationNameEditGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  locationName: {
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.textPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
  locationTitleWarning: {
    color: '#B45309',
  },
  locationSeparator: {
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.muted,
    flexShrink: 0,
  },
  locationMealsInline: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.primaryDark,
    flexShrink: 0,
  },
  locationHeaderSpacer: {
    flex: 1,
    minWidth: spacing.sm,
  },
  servingLocationEditIcon: {
    fontSize: 14,
    flexShrink: 0,
  },
  servingLocationInput: {
    flex: 1,
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
    minWidth: 0,
  },
  servingLocationEditActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  servingLocationSaveBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
  },
  servingLocationSaveText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  servingLocationCancelBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  servingLocationCancelText: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  flatComboList: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  locationBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  comboBlock: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  comboHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: '#F0FAF5',
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  comboLabel: {
    ...typography.bodyStrong,
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  comboDetail: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
    paddingHorizontal: spacing.xxs,
    marginTop: spacing.xxs,
  },
  customerList: {
    gap: spacing.xxs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xxs,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  customerInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  customerActions: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
    minWidth: 88,
  },
  customerName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  remindLink: {
    paddingVertical: 2,
  },
  remindLinkText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
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
    paddingVertical: spacing.lg,
  },
  actionsRow: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionsRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionFlex: {
    flex: 1,
  },
});
