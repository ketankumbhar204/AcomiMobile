import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AccommodationStatus, SpaceType } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { isOccupancyTargetSupported } from '../../utils/buildOccupancyTarget';
import type { OccupancyFlowContext } from '../../hooks/useAccommodationOccupancyFlow';
import type { useAccommodationOccupancyFlow } from '../../hooks/useAccommodationOccupancyFlow';

type FlowController = ReturnType<typeof useAccommodationOccupancyFlow>;

type AccommodationOccupancyQuickActionsProps = {
  spaceType: SpaceType;
  accommodationStatus: AccommodationStatus;
  context: OccupancyFlowContext;
  flow: FlowController;
  canManage?: boolean;
  occupantLabel?: string | null;
  onViewOccupant?: () => void;
  layout?: 'compact' | 'default';
};

function QuickButton({
  label,
  variant = 'primary',
  onPress,
  disabled,
  compact,
}: {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.quickBtn,
        compact && styles.quickBtnCompact,
        variant === 'secondary' && styles.quickBtnSecondary,
        variant === 'ghost' && styles.quickBtnGhost,
        disabled && styles.quickBtnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}>
      <Text
        style={[
          styles.quickBtnText,
          variant === 'secondary' && styles.quickBtnTextSecondary,
          variant === 'ghost' && styles.quickBtnTextGhost,
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function AccommodationOccupancyQuickActions({
  spaceType,
  accommodationStatus,
  context,
  flow,
  canManage = true,
  occupantLabel,
  onViewOccupant,
  layout = 'default',
}: AccommodationOccupancyQuickActionsProps) {
  const { t } = useTranslation();
  const compact = layout === 'compact';

  if (
    !canManage ||
    !isOccupancyTargetSupported(spaceType, context.target.targetType)
  ) {
    return null;
  }

  if (accommodationStatus === 'MAINTENANCE' || accommodationStatus === 'BLOCKED') {
    return null;
  }

  const disabled = flow.loading;
  const isAvailable = accommodationStatus === 'AVAILABLE';
  const isReserved = accommodationStatus === 'RESERVED';
  const isOccupied = accommodationStatus === 'OCCUPIED';

  const occupantText =
    occupantLabel && isReserved
      ? t('occupancy.quickActions.reservedFor', { name: occupantLabel })
      : occupantLabel && isOccupied
        ? t('occupancy.quickActions.occupiedBy', { name: occupantLabel })
        : isReserved
          ? t('occupancy.quickActions.viewReservation')
          : isOccupied
            ? t('occupancy.quickActions.viewOccupant')
            : null;

  return (
    <View style={styles.wrap}>
      {occupantText && onViewOccupant && (isReserved || isOccupied) ? (
        <Pressable onPress={onViewOccupant} hitSlop={6} style={styles.occupantRow}>
          <Text style={styles.occupantLabel} numberOfLines={1}>
            {occupantText}
          </Text>
          <Text style={styles.occupantChevron}>›</Text>
        </Pressable>
      ) : occupantText ? (
        <Text style={styles.occupantLabel} numberOfLines={1}>
          {occupantText}
        </Text>
      ) : null}

      <View style={[styles.row, compact && styles.rowCompact]}>
        {isAvailable ? (
          <>
            <QuickButton
              label={t('occupancy.actions.reserve')}
              onPress={() => flow.startReserve(context)}
              disabled={disabled}
              compact={compact}
            />
            <QuickButton
              label={t('occupancy.actions.walkInAllocate')}
              variant="secondary"
              onPress={() => flow.startWalkIn(context)}
              disabled={disabled}
              compact={compact}
            />
          </>
        ) : null}

        {isReserved ? (
          <>
            <QuickButton
              label={t('occupancy.actions.moveIn')}
              onPress={() => void flow.startMoveIn(context)}
              disabled={disabled}
              compact={compact}
            />
            <QuickButton
              label={
                compact
                  ? t('occupancy.actions.cancelShort')
                  : t('occupancy.actions.cancelReservation')
              }
              variant="ghost"
              onPress={() => void flow.startCancelReservation(context)}
              disabled={disabled}
              compact={compact}
            />
          </>
        ) : null}

        {isOccupied ? (
          <>
            <QuickButton
              label={t('occupancy.actions.transfer')}
              variant="secondary"
              onPress={() => void flow.startTransfer(context)}
              disabled={disabled}
              compact={compact}
            />
            <QuickButton
              label={t('occupancy.actions.vacate')}
              variant="ghost"
              onPress={() => void flow.startVacate(context)}
              disabled={disabled}
              compact={compact}
            />
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  occupantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  occupantLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
    flex: 1,
  },
  occupantChevron: {
    ...typography.caption,
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rowCompact: {
    flexWrap: 'nowrap',
    gap: spacing.sm,
  },
  quickBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
  },
  quickBtnCompact: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  quickBtnSecondary: {
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quickBtnGhost: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickBtnDisabled: {
    opacity: 0.5,
  },
  quickBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.white,
  },
  quickBtnTextSecondary: {
    color: colors.primaryDark,
  },
  quickBtnTextGhost: {
    color: colors.textPrimary,
  },
});
