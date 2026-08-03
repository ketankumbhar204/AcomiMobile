import React, { useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Building2, ChevronRight } from 'lucide-react-native';
import type { BuildingResponse, BuildingSummaryResponse, SpaceType } from '../../api/types';
import { InlineEditableName } from '../ui/InlineEditableName';
import { colors, fontSize, shadows, spacing, typography } from '../../theme';
import {
  getBuildingLayoutTypeLabelKey,
  resolveBuildingCardStats,
} from '../../utils/buildingListCardContent';
import { isAccommodationEntityActive } from '../../utils/accommodationEntityActive';
import { getAccommodationHierarchyAccent } from '../../utils/accommodationHierarchy';
import { AccommodationInactiveBadge, accommodationInactiveCardStyle } from './AccommodationInactiveBadge';

type BuildingListCardProps = {
  building: BuildingResponse;
  summary?: BuildingSummaryResponse;
  spaceType?: SpaceType;
  editableName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function StatColumn({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statColumn}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type DetailChipTone = 'neutral' | 'available' | 'occupied';

const DETAIL_CHIP_TONES: Record<DetailChipTone, { bg: string; text: string }> = {
  neutral: { bg: '#EFF6FF', text: '#1D4ED8' },
  available: { bg: '#D1FAE5', text: '#047857' },
  occupied: { bg: '#F1F5F9', text: '#334155' },
};

function DetailChip({ label, tone = 'neutral' }: { label: string; tone?: DetailChipTone }) {
  const palette = DETAIL_CHIP_TONES[tone];
  return (
    <View style={[styles.detailChip, { backgroundColor: palette.bg }]}>
      <Text style={[styles.detailChipText, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function BuildingCardDetails({
  stats,
  t,
}: {
  stats: NonNullable<ReturnType<typeof resolveBuildingCardStats>>;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const chips: { key: string; label: string; tone: DetailChipTone }[] = [];

  if (stats.rooms != null) {
    chips.push({
      key: 'rooms',
      label: t('accommodation.home.buildingCard.detailChipRooms', { count: stats.rooms }),
      tone: 'neutral',
    });
  }

  chips.push(
    {
      key: 'available',
      label: t('accommodation.home.buildingCard.detailChipAvailable', {
        count: stats.available,
      }),
      tone: 'available',
    },
    {
      key: 'occupied',
      label: t('accommodation.home.buildingCard.detailChipOccupied', {
        count: stats.occupied,
      }),
      tone: 'occupied',
    },
  );

  return (
    <View style={styles.detailSection}>
      <View style={styles.chipRow}>
        {chips.map(chip => (
          <DetailChip key={chip.key} label={chip.label} tone={chip.tone} />
        ))}
      </View>
    </View>
  );
}

export function BuildingListCard({
  building,
  summary,
  editableName = false,
  onSaveName,
  onPress,
  style,
}: BuildingListCardProps) {
  const { t } = useTranslation();
  const buildingAccent = getAccommodationHierarchyAccent('building');

  const layoutMode = summary?.layoutMode ?? building.layoutMode;
  const inactive = !isAccommodationEntityActive(building);

  const stats = useMemo(
    () => (summary ? resolveBuildingCardStats(layoutMode, summary, t) : null),
    [layoutMode, summary, t],
  );

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(37, 99, 235, 0.08)' }}
      accessibilityRole="button"
      accessibilityLabel={building.name}
      style={({ pressed }) => [
        styles.card,
        style,
        inactive && accommodationInactiveCardStyle,
        pressed && styles.pressed,
      ]}>
      <View style={styles.headerRow}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: inactive ? '#F3F4F6' : buildingAccent.soft,
              borderColor: inactive ? '#D1D5DB' : buildingAccent.border,
            },
          ]}>
          <Building2
            size={20}
            color={inactive ? '#9CA3AF' : buildingAccent.accent}
            strokeWidth={2.2}
          />
        </View>

        <View style={styles.headerBody}>
          <View style={styles.nameSection}>
            <InlineEditableName
              value={building.name}
              editable={editableName}
              onSave={onSaveName}
            />
          </View>
          <Text style={styles.layoutType} numberOfLines={1}>
            {t(getBuildingLayoutTypeLabelKey(layoutMode))}
          </Text>
        </View>

        {inactive ? (
          <View style={styles.inactiveBadgeWrap}>
            <AccommodationInactiveBadge />
          </View>
        ) : null}

        {onPress ? <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} /> : null}
      </View>

      {stats ? (
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            {stats.columns.map(column => (
              <StatColumn
                key={column.labelKey}
                value={column.value}
                label={t(column.labelKey)}
              />
            ))}
          </View>

          <BuildingCardDetails stats={stats} t={t} />
        </View>
      ) : (
        <Text style={styles.placeholderLine}>{t('accommodation.home.manageHint')}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 88,
    ...shadows.sm,
  },
  pressed: {
    borderColor: `${colors.primary}66`,
    backgroundColor: colors.surface,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inactiveBadgeWrap: {
    flexShrink: 0,
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameSection: {
    flexShrink: 1,
    minWidth: 0,
  },
  layoutType: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    flexShrink: 0,
    marginLeft: 'auto',
    textAlign: 'right',
  },
  statsSection: {
    width: '100%',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 28,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailSection: {
    width: '100%',
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    width: '100%',
  },
  detailChip: {
    flex: 1,
    minWidth: 0,
    borderRadius: 9999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailChipText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  placeholderLine: {
    ...typography.caption,
    color: colors.muted,
  },
});
