import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Calendar, CheckCircle2, Lock, Share2 } from 'lucide-react-native';
import type { DailyMenuResponse, MealType } from '../../api/types';
import { Button } from '../ui/Button';
import { colors, pastels, radius, spacing, typography } from '../../theme';
import { mealTypeLabelKey, MEAL_TYPES } from '../../utils/mealLabels';
import {
  isMealPlanned,
  resolveDayShareVisual,
  type DailyMenuDaySummary,
  type DayPollControl,
  type DayShareAction,
} from '../../utils/dailyMenuDayStatus';
import { mealTypeTheme } from '../../utils/mealTypeTheme';
import { MealTypeVisual } from './MealTypeVisual';

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
};

function CompactMealSlotCell({
  mealType,
  menu,
  onPress,
}: {
  mealType: MealType;
  menu?: DailyMenuResponse | null;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const mealTheme = mealTypeTheme(mealType);
  const planned = isMealPlanned(menu);
  const statusLabel = planned
    ? t('meals.planning.selector.planned', { defaultValue: 'Planned' })
    : t('meals.planning.selector.notPlanned', { defaultValue: 'Not planned' });
  const actionLabel = planned
    ? t('meals.planning.selector.viewMenu', { defaultValue: 'View menu' })
    : t('meals.planning.selector.planMenu', { defaultValue: 'Plan menu' });
  const StatusIcon = planned ? CheckCircle2 : Calendar;
  const statusColor = planned ? pastels.green.fg : '#4B5563';

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(15, 23, 42, 0.06)' }}
      style={({ pressed }) => [
        styles.slotCell,
        { backgroundColor: mealTheme.soft },
        styles.slotCellBorder,
        pressed && styles.slotCellPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${t(mealTypeLabelKey(mealType))}, ${statusLabel}`}>
      <MealTypeVisual mealType={mealType} size={20} style={styles.slotIcon} />
      <Text style={[styles.slotName, { color: mealTheme.accent }]} numberOfLines={1}>
        {t(mealTypeLabelKey(mealType))}
      </Text>
      <View style={[styles.statusChip, planned ? styles.statusPlanned : styles.statusNotPlanned]}>
        <StatusIcon size={12} color={statusColor} strokeWidth={2.4} />
        <Text
          style={[styles.statusText, { color: statusColor }]}
          numberOfLines={1}>
          {statusLabel}
        </Text>
      </View>
      <Text style={[styles.slotHint, { color: mealTheme.accent }]} numberOfLines={1}>
        {actionLabel}
      </Text>
    </Pressable>
  );
}

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

      <View style={styles.mealStrip} accessibilityRole="tablist">
        {MEAL_TYPES.map(mealType => (
          <CompactMealSlotCell
            key={mealType}
            mealType={mealType}
            menu={menuMap[mealType]}
            onPress={() => onSelectMealType(mealType)}
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
    gap: spacing.sm,
  },
  slotCell: {
    flex: 1,
    minWidth: 0,
    minHeight: 132,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotCellBorder: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  slotCellPressed: {
    opacity: 0.92,
  },
  slotIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  slotName: {
    ...typography.bodyStrong,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 18,
  },
  statusChip: {
    maxWidth: '100%',
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusNotPlanned: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
  statusPlanned: {
    borderColor: '#6EE7B7',
    backgroundColor: '#ECFDF5',
  },
  statusText: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  slotHint: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
