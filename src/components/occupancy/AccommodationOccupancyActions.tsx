import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftRight,
  CalendarClock,
  LogIn,
  LogOut,
  UserPlus,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import type {
  AccommodationStatus,
  OccupancyResponse,
  SpaceType,
} from '../../api/types';
import { Button } from '../ui';
import { occupancyActionTint } from './occupancyActionTints';
import { useAccommodationOccupancyFlow } from '../../hooks/useAccommodationOccupancyFlow';
import { colors, pastels, radius, shadows, spacing, typography } from '../../theme';
import { isOccupancyTargetSupported } from '../../utils/buildOccupancyTarget';
import type { OccupancyTargetSelection } from '../../utils/occupancyRules';
import { AccommodationOccupancyFlowModals } from './AccommodationOccupancyFlowModals';

type OccupancyActionsLayout = 'stack' | 'tiles';

type AccommodationOccupancyActionsProps = {
  spaceId: string;
  spaceType: SpaceType;
  canManage?: boolean;
  accommodationStatus: AccommodationStatus;
  target: OccupancyTargetSelection;
  occupancy?: OccupancyResponse | null;
  onSuccess?: () => void;
  layout?: OccupancyActionsLayout;
  /** Return false to keep buttons enabled but skip starting allocate. */
  onBeforeAllocate?: () => boolean;
  /** Return false to keep buttons enabled but skip starting reserve. */
  onBeforeReserve?: () => boolean;
};

type ActionTile = {
  key: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
  well: string;
  border: string;
  onPress: () => void;
};

function ActionTileCard({
  tile,
  disabled,
}: {
  tile: ActionTile;
  disabled?: boolean;
}) {
  const Icon = tile.icon;
  return (
    <Pressable
      onPress={tile.onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={tile.title}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: tile.well, borderColor: tile.border },
        disabled && styles.tileDisabled,
        pressed && !disabled && styles.tilePressed,
      ]}>
      <View style={[styles.tileIcon, { backgroundColor: colors.white }]}>
        <Icon size={18} color={tile.accent} strokeWidth={2.2} />
      </View>
      <Text style={styles.tileTitle} numberOfLines={1}>
        {tile.title}
      </Text>
      <Text style={styles.tileSubtitle} numberOfLines={2}>
        {tile.subtitle}
      </Text>
    </Pressable>
  );
}

export function AccommodationOccupancyActions({
  spaceId,
  spaceType,
  canManage = true,
  accommodationStatus,
  target,
  occupancy = null,
  onSuccess,
  layout = 'stack',
  onBeforeAllocate,
  onBeforeReserve,
}: AccommodationOccupancyActionsProps) {
  const { t } = useTranslation();

  const flow = useAccommodationOccupancyFlow({
    spaceId,
    spaceType,
    canManage,
    onSuccess,
  });

  const context = useMemo(
    () => ({
      target,
      accommodationStatus,
      occupancy,
    }),
    [accommodationStatus, occupancy, target],
  );

  const targetSupported = isOccupancyTargetSupported(spaceType, target.targetType);
  const showActions = canManage && targetSupported;

  if (!showActions) {
    return null;
  }

  if (accommodationStatus === 'MAINTENANCE' || accommodationStatus === 'BLOCKED') {
    return null;
  }

  const isAvailable = accommodationStatus === 'AVAILABLE';
  const isReserved = accommodationStatus === 'RESERVED';
  const isOccupied = accommodationStatus === 'OCCUPIED';
  const disabled = flow.loading;
  const useTiles = layout === 'tiles';

  const startAllocate = () => {
    if (onBeforeAllocate && !onBeforeAllocate()) {
      return;
    }
    flow.startWalkIn(context);
  };

  const startReserve = () => {
    if (onBeforeReserve && !onBeforeReserve()) {
      return;
    }
    flow.startReserve(context);
  };

  const tiles: ActionTile[] = isAvailable
    ? [
        {
          key: 'allocate',
          title: t('occupancy.bedQuickActions.allocateTitle', {
            defaultValue: 'Allocate Bed',
          }),
          subtitle: t('occupancy.bedQuickActions.allocateHint', {
            defaultValue: 'Assign a member to this bed',
          }),
          icon: UserPlus,
          accent: pastels.green.fg,
          well: pastels.green.bg,
          border: pastels.green.border,
          onPress: startAllocate,
        },
        {
          key: 'reserve',
          title: t('occupancy.bedQuickActions.reserveTitle', {
            defaultValue: 'Reserve Bed',
          }),
          subtitle: t('occupancy.bedQuickActions.reserveHint', {
            defaultValue: 'Reserve for future use',
          }),
          icon: CalendarClock,
          accent: pastels.purple.fg,
          well: pastels.purple.bg,
          border: pastels.purple.border,
          onPress: startReserve,
        },
      ]
    : isReserved
      ? [
          {
            key: 'moveIn',
            title: t('occupancy.actions.moveIn'),
            subtitle: t('occupancy.bedQuickActions.moveInHint', {
              defaultValue: 'Complete move-in for the reserved member',
            }),
            icon: LogIn,
            accent: pastels.green.fg,
            well: pastels.green.bg,
            border: pastels.green.border,
            onPress: () => void flow.startMoveIn(context),
          },
          {
            key: 'cancel',
            title: t('occupancy.actions.cancelReservation'),
            subtitle: t('occupancy.bedQuickActions.cancelHint', {
              defaultValue: 'Release this reservation',
            }),
            icon: X,
            accent: colors.danger,
            well: colors.errorTint,
            border: '#FECACA',
            onPress: () => void flow.startCancelReservation(context),
          },
        ]
      : isOccupied
        ? [
            {
              key: 'transfer',
              title: t('occupancy.actions.transfer'),
              subtitle: t('occupancy.bedQuickActions.transferHint', {
                defaultValue: 'Move the resident to another bed',
              }),
              icon: ArrowLeftRight,
              accent: pastels.blue.fg,
              well: pastels.blue.bg,
              border: pastels.blue.border,
              onPress: () => void flow.startTransfer(context),
            },
            {
              key: 'vacate',
              title: t('occupancy.actions.vacate'),
              subtitle: t('occupancy.bedQuickActions.vacateHint', {
                defaultValue: 'End the current occupancy',
              }),
              icon: LogOut,
              accent: colors.danger,
              well: colors.errorTint,
              border: '#FECACA',
              onPress: () => void flow.startVacate(context),
            },
          ]
        : [];

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>
        {useTiles
          ? t('accommodation.home.quickActions', { defaultValue: 'Quick actions' })
          : t('occupancy.accommodationActions.title')}
      </Text>

      {flow.error ? <Text style={styles.errorText}>{flow.error}</Text> : null}

      {useTiles ? (
        <View style={styles.tileRow}>
          {tiles.map(tile => (
            <ActionTileCard key={tile.key} tile={tile} disabled={disabled} />
          ))}
        </View>
      ) : (
        <View style={styles.actions}>
          {isAvailable ? (
            <>
              <Button
                label={t('occupancy.actions.allocate')}
                tint={occupancyActionTint.allocate}
                icon={UserPlus}
                onPress={startAllocate}
                disabled={flow.loading}
                style={styles.actionBtn}
              />
              <Button
                label={t('occupancy.actions.reserve')}
                tint={occupancyActionTint.reserve}
                icon={CalendarClock}
                onPress={startReserve}
                disabled={flow.loading}
                style={styles.actionBtn}
              />
            </>
          ) : null}

          {isReserved ? (
            <>
              <Button
                label={t('occupancy.actions.moveIn')}
                tint={occupancyActionTint.moveIn}
                icon={LogIn}
                onPress={() => void flow.startMoveIn(context)}
                disabled={flow.loading}
                style={styles.actionBtn}
              />
              <Button
                label={t('occupancy.actions.cancelReservation')}
                tint={occupancyActionTint.cancel}
                icon={X}
                onPress={() => void flow.startCancelReservation(context)}
                disabled={flow.loading}
                style={styles.actionBtn}
              />
            </>
          ) : null}

          {isOccupied ? (
            <>
              <Button
                label={t('occupancy.actions.transfer')}
                tint={occupancyActionTint.transfer}
                icon={ArrowLeftRight}
                onPress={() => void flow.startTransfer(context)}
                disabled={flow.loading}
                style={styles.actionBtn}
              />
              <Button
                label={t('occupancy.actions.vacate')}
                tint={occupancyActionTint.vacate}
                icon={LogOut}
                onPress={() => void flow.startVacate(context)}
                disabled={flow.loading}
                style={styles.actionBtn}
              />
            </>
          ) : null}
        </View>
      )}

      <AccommodationOccupancyFlowModals spaceId={spaceId} spaceType={spaceType} flow={flow} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionBtn: {
    flexGrow: 1,
    flexBasis: '40%',
    minWidth: 120,
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  tileDisabled: {
    opacity: 0.5,
  },
  tilePressed: {
    opacity: 0.92,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  tileTitle: {
    ...typography.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  tileSubtitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
});
