import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Lock, Share2 } from 'lucide-react-native';
import type {
  DailyMenuResponse,
  MealEligibilitySummaryResponse,
  MealPollSlot,
  MealType,
} from '../../api/types';
import { Button } from '../ui/Button';
import { colors, pastels, radius, spacing, typography } from '../../theme';
import { buildDashboardMealSlotRows } from '../../utils/dashboardMealSlotDisplay';
import {
  resolveDayShareVisual,
  type DailyMenuDaySummary,
  type DayPollControl,
  type DayShareAction,
} from '../../utils/dailyMenuDayStatus';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import { MealOperationSlotCard } from './MealOperationSlotCard';

type MenuPlanningDayOverviewProps = {
  menuMap: Partial<Record<MealType, DailyMenuResponse>>;
  statusSummary: DailyMenuDaySummary;
  /** Kept for call-site compatibility; cards are no longer visually selected. */
  selectedMealType?: MealType;
  onSelectMealType: (mealType: MealType) => void;
  onShareDay?: () => void;
  shareAction?: DayShareAction;
  shareDisabled?: boolean;
  /** True after a share attempt the backend did not confirm. */
  shareFailed?: boolean;
  dateReadOnly?: boolean;
  pollControl?: DayPollControl;
  closingPoll?: boolean;
  onClosePoll?: () => void;
  /** Same publication and poll data the Dashboard cards use. */
  polls?: MealPollSlot[];
  eligibility?: MealEligibilitySummaryResponse | null;
};

export function MenuPlanningDayOverview({
  menuMap,
  statusSummary,
  onSelectMealType,
  onShareDay,
  shareAction = 'hidden',
  shareDisabled = false,
  shareFailed = false,
  dateReadOnly = false,
  pollControl = 'hidden',
  closingPoll = false,
  onClosePoll,
  polls = [],
  eligibility = null,
}: MenuPlanningDayOverviewProps) {
  const { t } = useTranslation();
  const dayStatus = resolveDayShareVisual(statusSummary, { shareFailed });
  const dayStatusLabel =
    dayStatus === 'failed'
      ? t('meals.planning.dayShare.failed', { defaultValue: 'Sharing failed' })
      : dayStatus === 'updated'
        ? t('meals.planning.dayShare.updated', { defaultValue: 'Updated since last share' })
        : dayStatus === 'shared'
          ? t('meals.planning.dayShare.shared', { defaultValue: 'Shared' })
          : t('meals.planning.dayShare.notShared', { defaultValue: 'Not shared' });
  const dayStatusHint =
    dayStatus === 'failed'
      ? t('meals.planning.dayShare.failedHint', {
          defaultValue: 'The menu was not shared. Try again.',
        })
      : dayStatus === 'updated'
        ? t('meals.planning.dayShare.updatedHint', {
            defaultValue: 'Share again so members see the latest menu',
          })
        : dayStatus === 'shared'
          ? t('meals.planning.dayShare.sharedHint', {
              defaultValue: "Today's menu has been shared",
            })
          : t('meals.planning.dayShare.notSharedHint', {
              defaultValue: "Today's menu has not been shared yet",
            });

  const showShareAction = !dateReadOnly && shareAction !== 'hidden' && onShareDay != null;
  const shareLabel =
    shareAction === 'reshare'
      ? t('meals.planning.dayShare.reshare', { defaultValue: "Reshare today's menu" })
      : t('meals.planning.dayShare.action', { defaultValue: "Share today's menu" });
  const showClosePoll = pollControl === 'open' && onClosePoll != null;
  const showPollClosed = pollControl === 'closed';

  const pollMap = useMemo(() => {
    const map: Partial<Record<MealType, MealPollSlot>> = {};
    for (const poll of polls) {
      map[poll.mealType] = poll;
    }
    return map;
  }, [polls]);

  const eligibleByMeal = useMemo(() => {
    const map: Partial<Record<MealType, number>> = {};
    for (const slot of eligibility?.slots ?? []) {
      map[slot.mealType] = slot.eligibleCount;
    }
    return map;
  }, [eligibility]);

  const slotRows = useMemo(
    () =>
      buildDashboardMealSlotRows(
        menuMap,
        pollMap,
        eligibleByMeal,
        {},
        eligibility?.distinctEligibleMemberCount ?? 0,
      ),
    [eligibleByMeal, eligibility?.distinctEligibleMemberCount, menuMap, pollMap],
  );

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.banner,
          dayStatus === 'shared' && styles.bannerShared,
          dayStatus === 'updated' && styles.bannerUpdated,
          dayStatus === 'failed' && styles.bannerFailed,
          dayStatus === 'not_shared' && styles.bannerNotShared,
        ]}
        accessibilityRole="text">
        {dayStatus === 'shared' ? (
          <Share2 size={18} color={pastels.green.fg} strokeWidth={2.2} />
        ) : (
          <AlertCircle
            size={18}
            color={
              dayStatus === 'failed'
                ? '#B91C1C'
                : dayStatus === 'updated'
                  ? pastels.blue.fg
                  : pastels.orange.fg
            }
            strokeWidth={2.2}
          />
        )}
        <View style={styles.bannerCopy}>
          <Text
            style={[
              styles.bannerTitle,
              dayStatus === 'shared' && styles.bannerTitleShared,
              dayStatus === 'updated' && styles.bannerTitleUpdated,
              dayStatus === 'failed' && styles.bannerTitleFailed,
              dayStatus === 'not_shared' && styles.bannerTitleNotShared,
            ]}>
            {dayStatusLabel}
          </Text>
          <Text style={styles.bannerHint}>{dayStatusHint}</Text>
        </View>
      </View>

      <View style={styles.mealStrip}>
        {slotRows.map(row => (
          <MealOperationSlotCard
            key={row.mealType}
            mealType={row.mealType}
            mealLabel={t(mealTypeLabelKey(row.mealType))}
            caption={t(row.captionKey, row.captionParams)}
            countPrimary={row.countPrimary}
            countUnit={row.countUnitKey ? t(row.countUnitKey) : undefined}
            captionTone={row.captionTone}
            statusKind={row.statusKind}
            onPress={() => onSelectMealType(row.mealType)}
          />
        ))}
      </View>

      <View style={styles.shareBlock}>
      {showShareAction ? (
        <Button
          label={shareLabel}
          icon={Share2}
          onPress={onShareDay}
          disabled={shareDisabled}
          numberOfLines={2}
          style={styles.shareButton}
        />
      ) : null}

      {showClosePoll ? (
        <Button
          label={t('meals.planning.dayShare.closePoll', { defaultValue: 'Close poll' })}
          icon={Lock}
          variant="ghost"
          loading={closingPoll}
          disabled={closingPoll}
          onPress={onClosePoll}
          tint={{
            bg: pastels.orange.bg,
            border: pastels.orange.border,
            fg: pastels.orange.fg,
          }}
          style={styles.shareButton}
        />
      ) : null}

      {showPollClosed ? (
        <View style={styles.pollClosedBanner} accessibilityRole="text">
          <Lock size={16} color="#4B5563" strokeWidth={2.2} />
          <View style={styles.bannerCopy}>
            <Text style={styles.pollClosedTitle}>
              {t('meals.planning.dayShare.pollClosed', { defaultValue: 'Poll closed' })}
            </Text>
            <Text style={styles.bannerHint}>
              {t('meals.planning.dayShare.pollClosedHint', {
                defaultValue: 'Members can no longer submit or change their selections',
              })}
            </Text>
          </View>
        </View>
      ) : null}

      {showShareAction ? (
        <Text style={styles.dayShareSubtitle}>
          {t('meals.planning.dayShare.subtitle', {
            defaultValue: 'Share Breakfast, Lunch and Dinner together',
          })}
        </Text>
      ) : !dateReadOnly && shareAction === 'hidden' ? (
        <Text style={styles.dayShareSubtitle}>
          {t('meals.planning.dayShare.emptyHint', {
            defaultValue: 'Plan at least one meal before sharing.',
          })}
        </Text>
      ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bannerNotShared: {
    backgroundColor: pastels.orange.bg,
    borderColor: pastels.orange.border,
  },
  bannerShared: {
    backgroundColor: pastels.green.bg,
    borderColor: pastels.green.border,
  },
  bannerUpdated: {
    backgroundColor: pastels.blue.bg,
    borderColor: pastels.blue.border,
  },
  bannerFailed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  bannerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  bannerTitle: {
    ...typography.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
  },
  bannerTitleNotShared: { color: pastels.orange.fg },
  bannerTitleShared: { color: pastels.green.fg },
  bannerTitleUpdated: { color: pastels.blue.fg },
  bannerTitleFailed: { color: '#B91C1C' },
  bannerHint: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  shareBlock: {
    gap: spacing.xs,
  },
  shareButton: {
    alignSelf: 'stretch',
  },
  pollClosedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.button,
    borderColor: '#E5E7EB',
    backgroundColor: '#F4F5F7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pollClosedTitle: {
    ...typography.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
    color: '#374151',
  },
  dayShareSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  mealStrip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
});
