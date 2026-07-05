import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FloorListItemResponse } from '../../../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../../../theme';
import { getFloorIllustration } from '../illustrations/illustrationAssets';
import { CircularOccupancyIndicator } from './CircularOccupancyIndicator';
import { LayoutCardShell } from './LayoutCardShell';
import { OccupancyLevelBadge } from './OccupancyLevelBadge';
import { OccupancyProgressBar } from './OccupancyProgressBar';
import { calcOccupancyPercent, getOccupancyLevel } from './occupancyUtils';

const CORRIDOR_IMAGE_HEIGHT = 120;

type CorridorFloorLayoutCardProps = {
  floor: FloorListItemResponse;
  highlighted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
};

export function CorridorFloorLayoutCard({
  floor,
  highlighted = false,
  onPress,
  onLongPress,
  menu,
}: CorridorFloorLayoutCardProps) {
  const { t } = useTranslation();
  const percent = calcOccupancyPercent(floor.occupied, floor.bedCount);
  const level = getOccupancyLevel(percent);

  return (
    <View style={[styles.wrap, highlighted && styles.highlighted]}>
      <LayoutCardShell
        debugCardId={`floor-corridor-${floor.floorId}`}
        onPress={onPress}
        onLongPress={onLongPress}
        menu={menu}
        cardStyle={[styles.card, highlighted && styles.cardHighlighted]}
        pressedStyle={styles.pressed}>
        <View style={styles.imageBanner}>
          <Image
            source={getFloorIllustration('CORRIDOR_PG')}
            style={styles.corridorImage}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {floor.name}
            </Text>
            <CircularOccupancyIndicator percent={percent} size={44} />
          </View>

          <Text style={styles.ratio}>
            {t('accommodation.layout.dashboard.bedsOccupied', {
              occupied: floor.occupied,
              total: floor.bedCount,
            })}
          </Text>

          <Text style={styles.meta}>
            {t('accommodation.layout.roomsCount', { count: floor.roomCount })}
          </Text>

          <OccupancyLevelBadge level={level} />

          <View style={styles.progressWrap}>
            <OccupancyProgressBar percent={percent} />
          </View>
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
  imageBanner: {
    width: '100%',
    height: CORRIDOR_IMAGE_HEIGHT,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  corridorImage: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: spacing.lg,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xxs,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 17,
    flex: 1,
    minWidth: 0,
  },
  ratio: {
    ...typography.body,
    color: colors.textSecondary,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xxs,
  },
  progressWrap: {
    marginTop: spacing.sm,
  },
});
