import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Building2, BedSingle, ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { AccommodationStatus } from '../../api/types';
import { colors, pastels, radius, shadows, spacing, typography } from '../../theme';
import { AccommodationInactiveBadge } from './AccommodationInactiveBadge';
import { AccommodationStatusBadge } from './AccommodationStatusBadge';
import { chunkIntoRows } from './layout/visual/planLayoutUtils';

export type InventoryListingKind = 'unit' | 'bed';

export type InventoryListingCardProps = {
  title: string;
  /** Optional secondary line (e.g. building name). */
  subtitle?: string | null;
  status?: AccommodationStatus | null;
  inactive?: boolean;
  /** When provided, shown next to the status badge (e.g. 100%). */
  occupancyPercent?: number | null;
  kind?: InventoryListingKind;
  menu?: React.ReactNode;
  onPressDetails: () => void;
  /** When set, tapping the card body also opens details (in addition to the button). */
  onPressCard?: () => void;
  detailsLabel?: string;
  style?: object;
};

/**
 * Approved individual unit/bed listing card (Rental Units Overview reference).
 * Intrinsic height only — never use flex:1 here (collapses inside ScrollView / flex parents).
 */
export function InventoryListingCard({
  title,
  subtitle,
  status = null,
  inactive = false,
  occupancyPercent,
  kind = 'unit',
  menu,
  onPressDetails,
  onPressCard,
  detailsLabel,
  style,
}: InventoryListingCardProps) {
  const { t } = useTranslation();
  const Icon: LucideIcon = kind === 'bed' ? BedSingle : Building2;
  const percentLabel =
    occupancyPercent == null || Number.isNaN(occupancyPercent)
      ? null
      : `${Math.max(0, Math.min(100, Math.round(occupancyPercent)))}%`;
  const viewDetails =
    detailsLabel ??
    t('accommodation.layout.dashboard.viewDetails', { defaultValue: 'View details' });

  const body = (
    <>
      <View style={styles.cardTop}>
        <View style={styles.entityIcon}>
          <Icon size={16} color={pastels.green.fg} strokeWidth={2.2} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {menu ? <View style={styles.menu}>{menu}</View> : null}
      </View>
      <View style={styles.statusRow}>
        {inactive ? (
          <AccommodationInactiveBadge />
        ) : status ? (
          <AccommodationStatusBadge status={status} />
        ) : (
          <View />
        )}
        {percentLabel != null ? <Text style={styles.percent}>{percentLabel}</Text> : null}
      </View>
    </>
  );

  return (
    <View style={[styles.card, inactive && styles.cardInactive, style]}>
      {onPressCard ? (
        <Pressable
          onPress={onPressCard}
          style={({ pressed }) => [styles.cardBody, pressed && styles.cardPressed]}
          accessibilityRole="button"
          accessibilityLabel={title}>
          {body}
        </Pressable>
      ) : (
        <View style={styles.cardBody}>{body}</View>
      )}
      <Pressable
        onPress={onPressDetails}
        style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsPressed]}
        accessibilityRole="button"
        accessibilityLabel={viewDetails}>
        <Text style={styles.detailsLabel}>{viewDetails}</Text>
        <ChevronRight size={16} color={colors.primary} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

type InventoryListingCardGridProps<T> = {
  items: T[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
};

/** Two-column grid matching the Units Overview reference layout. */
export function InventoryListingCardGrid<T>({
  items,
  keyExtractor,
  renderCard,
}: InventoryListingCardGridProps<T>) {
  const rows = useMemo(() => chunkIntoRows(items, 2), [items]);
  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.gridRow}>
          {row.map(item => (
            <View key={keyExtractor(item)} style={styles.gridCell}>
              {renderCard(item)}
            </View>
          ))}
          {row.length < 2 ? <View style={styles.gridSpacer} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardBody: {
    gap: spacing.sm,
  },
  cardInactive: {
    opacity: 0.7,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  entityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: pastels.green.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
  },
  menu: {
    marginRight: -4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 24,
  },
  percent: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  detailsButton: {
    minHeight: 36,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
  },
  detailsPressed: {
    backgroundColor: colors.mintSubtle,
  },
  detailsLabel: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.primary,
  },
  grid: {
    width: '100%',
    gap: spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  gridCell: {
    flex: 1,
    minWidth: 0,
  },
  gridSpacer: {
    flex: 1,
  },
});
