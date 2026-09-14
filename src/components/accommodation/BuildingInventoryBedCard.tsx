import React, { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BedSingle, Plus } from 'lucide-react-native';
import type { AccommodationStatus, BedSpaceListItemResponse } from '../../api/types';
import { BedPricingFields } from './BedPricingFields';
import { colors, spacing, typography } from '../../theme';
import { formatBedDisplayLabel } from '../../utils/formatBedDisplayLabel';
import { getAccommodationStatusColor } from '../../utils/accommodationStatus';

/** Wide enough for labeled Rent / Deposit while still showing ~2 cards. */
const BED_CARD_WIDTH = 188;
const ADD_CARD_WIDTH = 128;

function bedSurface(status: AccommodationStatus): {
  bg: string;
  border: string;
  iconBg: string;
  accent: string;
} {
  const accent = getAccommodationStatusColor(status);
  // Soft fills — green vacant, red occupied, amber reserved, grey other
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
  bed: BedSpaceListItemResponse;
  pricingEditable?: boolean;
  onPress?: () => void;
  onCommitPricing?: (
    field: 'defaultRent' | 'defaultDeposit',
    value: number | null,
  ) => Promise<void>;
  menu?: React.ReactNode;
  footer?: React.ReactNode;
};

function BuildingInventoryBedCardComponent({
  bed,
  pricingEditable = false,
  onPress,
  onCommitPricing,
  menu,
  footer,
}: BuildingInventoryBedCardProps) {
  const { t } = useTranslation();
  const displayLabel = formatBedDisplayLabel(bed.label, t);
  const surface = useMemo(() => bedSurface(bed.status), [bed.status]);
  const [rent, setRent] = useState(bed.defaultRent);
  const [deposit, setDeposit] = useState(bed.defaultDeposit);

  useEffect(() => {
    setRent(bed.defaultRent);
    setDeposit(bed.defaultDeposit);
  }, [bed.bedId, bed.defaultDeposit, bed.defaultRent]);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: surface.bg,
          borderColor: surface.border,
        },
        pressed && onPress ? styles.cardPressed : null,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={displayLabel}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: surface.iconBg }]}>
          <BedSingle size={16} color={surface.accent} strokeWidth={2.2} />
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.label} numberOfLines={1}>
            {displayLabel}
          </Text>
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
              {t(`accommodation.status.${bed.status}`, { defaultValue: bed.status })}
            </Text>
          </View>
        </View>
        {menu ? <View style={styles.menuSlot}>{menu}</View> : null}
      </View>
      {pricingEditable ? (
        <View style={styles.pricingWell}>
          <BedPricingFields
            rent={rent}
            deposit={deposit}
            editable
            layout="stack"
            onCommit={async (field, value) => {
              if (field === 'defaultRent') {
                setRent(value);
              } else {
                setDeposit(value);
              }
              await onCommitPricing?.(field, value);
            }}
          />
        </View>
      ) : null}
      {footer}
    </Pressable>
  );
}

type BuildingInventoryAddBedCardProps = {
  onPress: () => void;
};

export function BuildingInventoryAddBedCard({ onPress }: BuildingInventoryAddBedCardProps) {
  const { t } = useTranslation();
  return (
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
  );
}

export const BuildingInventoryBedCard = memo(BuildingInventoryBedCardComponent);

const styles = StyleSheet.create({
  card: {
    width: BED_CARD_WIDTH,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  cardPressed: {
    opacity: 0.92,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    width: '100%',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  label: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  menuSlot: {
    marginTop: -6,
    marginRight: -6,
  },
  pricingWell: {
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: 2,
  },
  addCard: {
    width: ADD_CARD_WIDTH,
    minHeight: 148,
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
