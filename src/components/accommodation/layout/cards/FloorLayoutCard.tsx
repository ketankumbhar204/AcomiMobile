import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FloorListItemResponse } from '../../../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../../../theme';
import { isAccommodationEntityActive } from '../../../../utils/accommodationEntityActive';
import { getFloorIllustration } from '../illustrations/illustrationAssets';
import { InlineEditableName } from '../../../ui/InlineEditableName';
import {
  AccommodationInactiveBadge,
  accommodationInactiveCardStyle,
  accommodationInactiveIllustrationStyle,
} from '../../AccommodationInactiveBadge';
import { CorridorFloorLayoutCard } from './CorridorFloorLayoutCard';
import { CircularOccupancyIndicator } from './CircularOccupancyIndicator';
import { LayoutCardShell } from './LayoutCardShell';
import { LayoutIllustration } from './LayoutIllustration';
import { OccupancyLevelBadge } from './OccupancyLevelBadge';
import { OccupancyProgressBar } from './OccupancyProgressBar';
import { calcOccupancyPercent, getOccupancyLevel } from './occupancyUtils';

type FloorLayoutCardProps = {
  floor: FloorListItemResponse;
  layoutMode?: string;
  floorIllustrationType?: 'CORRIDOR' | 'DEFAULT';
  highlighted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
  editableName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
};

export function isCorridorFloorCardLayout(
  layoutMode?: string,
  floorIllustrationType?: 'CORRIDOR' | 'DEFAULT',
): boolean {
  return layoutMode === 'CORRIDOR_PG' || floorIllustrationType === 'CORRIDOR';
}

export function FloorLayoutCard({
  floor,
  layoutMode,
  floorIllustrationType,
  highlighted = false,
  onPress,
  onLongPress,
  menu,
  editableName = false,
  onSaveName,
}: FloorLayoutCardProps) {
  if (isCorridorFloorCardLayout(layoutMode, floorIllustrationType)) {
    return (
      <CorridorFloorLayoutCard
        floor={floor}
        highlighted={highlighted}
        onPress={onPress}
        onLongPress={onLongPress}
        menu={menu}
      />
    );
  }

  const { t } = useTranslation();
  const inactive = !isAccommodationEntityActive(floor);
  const percent = inactive
    ? 0
    : calcOccupancyPercent(floor.occupied, floor.bedCount);
  const level = getOccupancyLevel(percent);

  return (
    <View style={[styles.wrap, highlighted && styles.highlighted]}>
      <LayoutCardShell
        debugCardId={`floor-${floor.floorId}`}
        onPress={onPress}
        onLongPress={onLongPress}
        menu={menu}
        cardStyle={[
          styles.card,
          highlighted && styles.cardHighlighted,
          inactive && accommodationInactiveCardStyle,
        ]}
        pressedStyle={styles.pressed}>
        <View style={styles.row}>
          <LayoutIllustration
            source={getFloorIllustration(layoutMode)}
            size="floor"
            style={inactive ? accommodationInactiveIllustrationStyle : undefined}
          />
          <View style={styles.body}>
            {editableName && onSaveName ? (
              <InlineEditableName value={floor.name} editable onSave={onSaveName} />
            ) : (
              <Text style={[styles.title, inactive && styles.titleInactive]}>{floor.name}</Text>
            )}
            {!inactive ? (
              <>
                <Text style={styles.ratio}>
                  {t('accommodation.layout.dashboard.bedsOccupied', {
                    occupied: floor.occupied,
                    total: floor.bedCount,
                  })}
                </Text>
                <Text style={styles.meta}>
                  {t('accommodation.layout.roomsCount', { count: floor.roomCount })}
                </Text>
                <View style={styles.progressWrap}>
                  <OccupancyProgressBar percent={percent} />
                </View>
                <OccupancyLevelBadge level={level} />
              </>
            ) : (
              <AccommodationInactiveBadge />
            )}
          </View>
          {!inactive ? <CircularOccupancyIndicator percent={percent} size={48} /> : null}
        </View>
      </LayoutCardShell>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  highlighted: {
    borderRadius: radius.card + 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardHighlighted: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    gap: spacing.md,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 17,
  },
  titleInactive: {
    color: '#6B7280',
  },
  ratio: {
    ...typography.body,
    color: colors.textSecondary,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
  },
  progressWrap: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
});
