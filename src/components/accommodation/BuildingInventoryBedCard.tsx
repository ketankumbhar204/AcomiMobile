import React, { memo, useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Plus } from 'lucide-react-native';
import type { AccommodationStatus } from '../../api/types';
import { BedPricingDisplay } from './BedPricingDisplay';
import { OccupiedBedPaymentFace } from './OccupiedBedPaymentFace';
import { StayTypeBadge } from './StayTypeBadge';
import { getBedIllustration } from './layout/illustrations/illustrationAssets';
import { useMoveInBedFace } from '../dashboard/bedInventoryFace';
import { useOccupiedBedStay } from '../../hooks/useOccupiedBedStay';
import { colors, pastels, spacing, typography } from '../../theme';
import { formatBedDisplayLabel } from '../../utils/formatBedDisplayLabel';
import { getAccommodationStatusColor } from '../../utils/accommodationStatus';
import type { StayChoice } from '../../utils/shortStay';

/** Fields both the room list and the building inventory list provide. */
export type InventoryBedCardModel = {
  bedId: string;
  label: string;
  status: AccommodationStatus;
  defaultRent?: number | null;
  defaultDeposit?: number | null;
  active?: boolean;
};

/** Fills the carousel slot. The room carousel sets the card width. */

function bedSurface(status: AccommodationStatus): {
  bg: string;
  border: string;
  iconBg: string;
  accent: string;
} {
  const accent = getAccommodationStatusColor(status);
  switch (status) {
    case 'AVAILABLE':
      return {
        accent,
        bg: '#F0FDF4',
        border: '#BBF7D0',
        iconBg: '#DCFCE7',
      };
    case 'OCCUPIED':
      return {
        accent,
        bg: '#FEF2F2',
        border: '#FECACA',
        iconBg: '#FEE2E2',
      };
    case 'RESERVED':
      return {
        accent,
        bg: '#FFFBEB',
        border: '#FDE68A',
        iconBg: '#FEF3C7',
      };
    case 'MAINTENANCE':
    case 'BLOCKED':
    default:
      return {
        accent,
        bg: '#F8FAFC',
        border: '#E2E8F0',
        iconBg: '#E2E8F0',
      };
  }
}

type BuildingInventoryBedCardProps = {
  bed: InventoryBedCardModel;
  spaceId?: string;
  highlighted?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onEdit?: () => void;
  menu?: React.ReactNode;
  footer?: React.ReactNode;
};

function BuildingInventoryBedCardComponent({
  bed,
  spaceId,
  highlighted = false,
  onPress,
  onLongPress,
  onEdit,
  menu,
  footer,
}: BuildingInventoryBedCardProps) {
  const { t } = useTranslation();
  const displayLabel = formatBedDisplayLabel(bed.label, t);
  const moveIn = useMoveInBedFace(bed.bedId);
  const showStayBadges =
    Boolean(moveIn) || bed.status === 'OCCUPIED' || bed.status === 'RESERVED';
  const showStayLookup = Boolean(spaceId) && showStayBadges;
  const occupiedStay = useOccupiedBedStay(spaceId, bed.bedId, showStayLookup);
  const stayKind: StayChoice | null | undefined =
    moveIn?.stayKind ?? occupiedStay.occupancy?.stayKind ?? null;
  const surface = useMemo(() => {
    if (moveIn) {
      return {
        accent: pastels.blue.fg,
        bg: pastels.blue.bg,
        border: pastels.blue.border,
        iconBg: '#DBEAFE',
      };
    }
    return bedSurface(bed.status);
  }, [bed.status, moveIn]);

  return (
    <View style={styles.slot}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={!onPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: surface.bg,
            borderColor: highlighted ? colors.primary : surface.border,
            borderWidth: highlighted ? 1.5 : 1,
          },
          bed.active === false ? styles.cardInactive : null,
          pressed && onPress ? styles.cardPressed : null,
        ]}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={displayLabel}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: surface.iconBg }]}>
            <Image
              source={getBedIllustration(bed.status)}
              style={styles.bedArt}
              resizeMode="contain"
              fadeDuration={0}
            />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {displayLabel}
          </Text>
          {onEdit ? (
            <Pressable
              onPress={event => {
                event.stopPropagation?.();
                onEdit();
              }}
              hitSlop={8}
              style={({ pressed }) => [styles.editBtn, pressed && styles.cardPressed]}
              accessibilityRole="button"
              accessibilityLabel={t('accommodation.builder.editBed', { defaultValue: 'Edit bed' })}>
              <ChevronRight size={18} color={colors.info} strokeWidth={2.4} />
            </Pressable>
          ) : menu ? (
            <View style={styles.menuSlot}>{menu}</View>
          ) : null}
        </View>

        {showStayBadges ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.badgeRow}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: `${surface.accent}18`,
                  borderColor: `${surface.accent}44`,
                },
              ]}>
              <View style={[styles.statusDot, { backgroundColor: surface.accent }]} />
              <Text style={[styles.statusText, { color: surface.accent }]} numberOfLines={1}>
                {moveIn
                  ? t('dashboard.drilldown.movedIn', { defaultValue: 'Moved in' })
                  : t(`accommodation.status.${bed.status}`, { defaultValue: bed.status })}
              </Text>
            </View>
            <StayTypeBadge stayKind={stayKind} />
          </ScrollView>
        ) : null}

        {showStayBadges ? <View style={styles.divider} /> : null}

        <View style={styles.pricing}>
          {moveIn ? (
            <>
              {moveIn.moveInDate ? (
                <Text style={styles.moveInLine} numberOfLines={1}>
                  {t('dashboard.drilldown.moveInLine', { date: moveIn.moveInDate })}
                </Text>
              ) : null}
              <Text style={styles.moveInMember} numberOfLines={1}>
                {moveIn.memberName}
              </Text>
              <BedPricingDisplay
                rent={moveIn.rent}
                deposit={moveIn.deposit}
                stayKind={moveIn.stayKind}
                layout="inline"
              />
            </>
          ) : bed.status === 'OCCUPIED' || bed.status === 'RESERVED' ? (
            <OccupiedBedPaymentFace spaceId={spaceId} bedId={bed.bedId} />
          ) : (
            <BedPricingDisplay
              rent={bed.defaultRent}
              deposit={bed.defaultDeposit}
              layout="inline"
            />
          )}
        </View>
        {footer}
      </Pressable>
    </View>
  );
}

type BuildingInventoryAddBedCardProps = {
  onPress: () => void;
};

export function BuildingInventoryAddBedCard({ onPress }: BuildingInventoryAddBedCardProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.slot}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.addCard, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={t('accommodation.builder.addBed', { defaultValue: 'Add Bed' })}>
        <View style={styles.addIconWrap}>
          <Plus size={20} color={colors.primary} strokeWidth={2.6} />
        </View>
        <Text style={styles.addLabel}>
          {t('accommodation.builder.addBed', { defaultValue: 'Add Bed' })}
        </Text>
      </Pressable>
    </View>
  );
}

export const BuildingInventoryBedCard = memo(BuildingInventoryBedCardComponent);

const styles = StyleSheet.create({
  slot: {
    width: '100%',
    flexGrow: 1,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 6,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardInactive: {
    opacity: 0.55,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: '100%',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bedArt: {
    width: 40,
    height: 40,
  },
  label: {
    ...typography.bodyStrong,
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 6,
    paddingRight: 2,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    width: '100%',
    marginTop: 1,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginRight: -2,
  },
  menuSlot: {
    marginRight: -6,
  },
  moveInLine: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  moveInMember: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  pricing: {
    minWidth: 0,
    width: '100%',
  },
  addCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.mintSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  addIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
});
