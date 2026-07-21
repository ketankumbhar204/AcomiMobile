import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealHeadcountSlot, MealPollStatus, MealType, UUID } from '../../api/types';
import { useDashboardMealDay } from '../../hooks/useDashboardMealDay';
import { useOwnerMealHeadcount } from '../../hooks/useOwnerMealHeadcount';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { colors, spacing, typography } from '../../theme';
import {
  buildDashboardMealSlotRows,
  type DashboardMealSlotRow,
} from '../../utils/dashboardMealSlotDisplay';
import {
  formatMenuDate,
  formatMenuDateCompact,
  headcountTitleKey,
  headcountTitleUsesDateParam,
  isPastMenuDate,
  todayIsoDate,
} from '../../utils/mealDates';
import type { MealStatusKind } from '../../utils/mealStatusTheme';
import {
  MealHeadcountActionButtons,
  MealHeadcountPanel,
  type MealHeadcountFooterState,
} from './MealHeadcountPanel';
import { MenuDateNavRow } from './MenuDateNavRow';
import { MenuDatePickerModal } from './MenuDatePickerModal';
import { MenuPlanningBottomSheet } from './MenuPlanningBottomSheet';

type MealHeadcountBottomSheetProps = {
  visible: boolean;
  spaceId: UUID;
  /** Dashboard (or host) selected date — used to seed the drawer on open. */
  menuDate: string;
  openSlots: MealHeadcountSlot[];
  /** Optional Dashboard-style rows so Breakfast / Lunch / Dinner all appear in the strip. */
  slotRows?: DashboardMealSlotRow[];
  initialMealType: MealType;
  onClose: () => void;
  onReload?: () => void;
  readOnly?: boolean;
  slotsLoading?: boolean;
};

function deriveFooterState(
  activeMealType: MealType,
  slotRows: DashboardMealSlotRow[] | undefined,
  openSlots: MealHeadcountSlot[],
  detailPollStatus: MealPollStatus | null,
): MealHeadcountFooterState {
  const row = slotRows?.find(slot => slot.mealType === activeMealType);
  const slot = openSlots.find(item => item.mealType === activeMealType);
  const statusKind: MealStatusKind = row?.statusKind ?? (slot ? 'shared' : 'empty');
  const pollStatus: MealPollStatus | null =
    detailPollStatus ??
    slot?.pollStatus ??
    (statusKind === 'shared' && slot != null ? 'OPEN' : null);

  return {
    statusKind,
    pollStatus,
    hasHeadcountSlot: slot != null,
  };
}

function shouldShowFooter(
  state: MealHeadcountFooterState,
  isMess: boolean,
  readOnly: boolean,
): boolean {
  if (readOnly) {
    return false;
  }
  if (isMess) {
    return (
      state.statusKind === 'draft' ||
      state.statusKind === 'needs_reshare' ||
      state.statusKind === 'empty' ||
      state.statusKind === 'shared'
    );
  }
  return state.pollStatus !== 'CLOSED';
}

function buildSlotsFromMealDay(
  headcountSlots: MealHeadcountSlot[],
  pollMap: ReturnType<typeof useDashboardMealDay>['pollMap'],
  platesByMeal: ReturnType<typeof useDashboardMealDay>['platesByMeal'],
): MealHeadcountSlot[] {
  if (headcountSlots.length > 0) {
    return headcountSlots;
  }
  return (['BREAKFAST', 'LUNCH', 'DINNER'] as MealType[])
    .map(mealType => {
      const poll = pollMap[mealType];
      if (!poll) {
        return null;
      }
      return {
        mealType,
        pollId: poll.id,
        pollStatus: poll.status,
        mealsToPrepare: platesByMeal[mealType] ?? poll.responseCount ?? 0,
      };
    })
    .filter((slot): slot is MealHeadcountSlot => slot != null);
}

export function MealHeadcountBottomSheet({
  visible,
  spaceId,
  menuDate,
  openSlots,
  slotRows,
  initialMealType,
  onClose,
  onReload,
  readOnly = false,
  slotsLoading = false,
}: MealHeadcountBottomSheetProps) {
  const { t, i18n } = useTranslation();
  const { spaceType } = useSpacePermissions(spaceId);
  const isMess = spaceType === 'MESS';
  const enableDateNavigation = isMess;

  const [sheetDate, setSheetDate] = useState(menuDate);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState(initialMealType);
  const [detailPollByMeal, setDetailPollByMeal] = useState<
    Partial<Record<MealType, MealPollStatus>>
  >({});
  const [detailRefreshToken, setDetailRefreshToken] = useState(0);
  const wasVisibleRef = useRef(false);

  // Seed drawer date from host only when the drawer opens (not while browsing inside).
  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      setSheetDate(menuDate);
      setActiveMealType(initialMealType);
      setDetailPollByMeal({});
      setDetailRefreshToken(0);
    }
    wasVisibleRef.current = visible;
  }, [initialMealType, menuDate, visible]);

  const sheetDataEnabled = visible && enableDateNavigation;
  const sheetMealDay = useDashboardMealDay(spaceId, sheetDate, sheetDataEnabled);
  const sheetHeadcount = useOwnerMealHeadcount(spaceId, sheetDate, sheetDataEnabled);

  const usingSheetOwnedDate = enableDateNavigation && sheetDate !== menuDate;

  const effectiveSlotRows = useMemo(() => {
    if (!enableDateNavigation) {
      return slotRows;
    }
    const built = buildDashboardMealSlotRows(
      sheetMealDay.menuMap,
      sheetMealDay.pollMap,
      sheetMealDay.eligibleByMeal,
      sheetMealDay.platesByMeal,
      sheetMealDay.eligibleCount,
    );
    if (usingSheetOwnedDate) {
      return built;
    }
    if (sheetMealDay.loading && slotRows && slotRows.length > 0) {
      return slotRows;
    }
    return built.length > 0 ? built : slotRows;
  }, [
    enableDateNavigation,
    sheetMealDay.eligibleByMeal,
    sheetMealDay.eligibleCount,
    sheetMealDay.loading,
    sheetMealDay.menuMap,
    sheetMealDay.platesByMeal,
    sheetMealDay.pollMap,
    slotRows,
    usingSheetOwnedDate,
  ]);

  const effectiveOpenSlots = useMemo(() => {
    if (!enableDateNavigation) {
      return openSlots;
    }
    const fromSheet = buildSlotsFromMealDay(
      sheetHeadcount.slots.length > 0 ? sheetHeadcount.slots : sheetMealDay.headcountSlots,
      sheetMealDay.pollMap,
      sheetMealDay.platesByMeal,
    );
    if (fromSheet.length > 0) {
      return fromSheet;
    }
    if (!usingSheetOwnedDate) {
      return openSlots;
    }
    return fromSheet;
  }, [
    enableDateNavigation,
    openSlots,
    sheetHeadcount.slots,
    sheetMealDay.headcountSlots,
    sheetMealDay.platesByMeal,
    sheetMealDay.pollMap,
    usingSheetOwnedDate,
  ]);

  const effectiveSlotsLoading =
    enableDateNavigation
      ? visible &&
        effectiveOpenSlots.length === 0 &&
        (sheetMealDay.loading || sheetHeadcount.loading || !sheetHeadcount.ready)
      : slotsLoading;

  const effectiveReadOnly = enableDateNavigation ? isPastMenuDate(sheetDate) : readOnly;

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleReload = useCallback(() => {
    if (enableDateNavigation) {
      void sheetMealDay.reload();
      void sheetHeadcount.reload();
    }
    onReload?.();
  }, [
    enableDateNavigation,
    onReload,
    sheetHeadcount.reload,
    sheetMealDay.reload,
  ]);

  const handleAfterClosePoll = useCallback(() => {
    setDetailPollByMeal(prev => ({ ...prev, [activeMealType]: 'CLOSED' }));
    setDetailRefreshToken(token => token + 1);
    handleReload();
  }, [activeMealType, handleReload]);

  const handlePanelFooterState = useCallback(
    (state: MealHeadcountFooterState) => {
      if (state.pollStatus == null) {
        return;
      }
      setDetailPollByMeal(prev => ({
        ...prev,
        [activeMealType]: state.pollStatus as MealPollStatus,
      }));
    },
    [activeMealType],
  );

  const handleSheetDateChange = useCallback((nextDate: string) => {
    setSheetDate(nextDate);
    setDetailPollByMeal({});
    setDetailRefreshToken(0);
  }, []);

  const footerState = useMemo(
    () =>
      deriveFooterState(
        activeMealType,
        effectiveSlotRows,
        effectiveOpenSlots,
        detailPollByMeal[activeMealType] ?? null,
      ),
    [activeMealType, detailPollByMeal, effectiveOpenSlots, effectiveSlotRows],
  );

  const totalMeals = useMemo(
    () => effectiveOpenSlots.reduce((sum, slot) => sum + slot.mealsToPrepare, 0),
    [effectiveOpenSlots],
  );

  const sheetTitle = headcountTitleUsesDateParam(sheetDate)
    ? t(headcountTitleKey(sheetDate), {
        date: formatMenuDateCompact(sheetDate, i18n.language),
      })
    : t(headcountTitleKey(sheetDate));

  const mealsSummary = t('dashboard.headcount.summaryTotalOnly', { count: totalMeals });

  const headerCenter = enableDateNavigation ? (
    <View style={styles.headerCenter}>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {sheetTitle}
      </Text>
      <MenuDateNavRow
        menuDate={sheetDate}
        onMenuDateChange={handleSheetDateChange}
        onOpenCalendar={() => setDatePickerOpen(true)}
        onJumpToToday={() => handleSheetDateChange(todayIsoDate())}
        compact
      />
      <Text style={styles.headerMeals} numberOfLines={1}>
        {mealsSummary}
      </Text>
    </View>
  ) : undefined;

  const sheetSubtitle = enableDateNavigation
    ? undefined
    : headcountTitleUsesDateParam(sheetDate)
      ? mealsSummary
      : t('dashboard.headcount.summarySubtitle', {
          date: formatMenuDate(sheetDate, i18n.language),
          count: totalMeals,
        });

  const footer =
    visible && shouldShowFooter(footerState, isMess, effectiveReadOnly) ? (
      <MealHeadcountActionButtons
        spaceId={spaceId}
        menuDate={sheetDate}
        activeMealType={activeMealType}
        statusKind={footerState.statusKind}
        pollStatus={footerState.pollStatus}
        isMess={isMess}
        readOnly={effectiveReadOnly}
        onBeforeNavigate={handleClose}
        onAfterClosePoll={handleAfterClosePoll}
      />
    ) : null;

  return (
    <>
      <MenuPlanningBottomSheet
        visible={visible}
        title={sheetTitle}
        subtitle={sheetSubtitle}
        headerCenter={headerCenter}
        onClose={handleClose}
        scrollContentStyle={styles.scrollContent}
        footer={footer}
        minHeightRatio={0.8}
        maxHeightRatio={0.8}>
        <MealHeadcountPanel
          key={sheetDate}
          spaceId={spaceId}
          menuDate={sheetDate}
          slots={effectiveOpenSlots}
          slotRows={effectiveSlotRows}
          slotsLoading={effectiveSlotsLoading}
          initialMealType={initialMealType}
          enabled={visible}
          showTotalSummary={false}
          onReload={handleReload}
          onActiveMealTypeChange={setActiveMealType}
          onFooterStateChange={handlePanelFooterState}
          onBeforeNavigate={handleClose}
          detailRefreshToken={detailRefreshToken}
          readOnly={effectiveReadOnly}
        />
      </MenuPlanningBottomSheet>

      {enableDateNavigation ? (
        <MenuDatePickerModal
          visible={datePickerOpen}
          value={sheetDate}
          allowPastDates
          onClose={() => setDatePickerOpen(false)}
          onConfirm={next => {
            handleSheetDateChange(next);
            setDatePickerOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: spacing.sm,
  },
  headerCenter: {
    width: '100%',
    alignItems: 'stretch',
    gap: 2,
  },
  headerTitle: {
    ...typography.bodyStrong,
    fontSize: 15,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  headerMeals: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
  },
});
