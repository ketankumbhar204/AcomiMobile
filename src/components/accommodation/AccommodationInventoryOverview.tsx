import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  CalendarPlus,
  CalendarClock,
  IndianRupee,
  Layers,
  Shield,
  Tag,
  type LucideIcon,
} from 'lucide-react-native';
import type { AccommodationStatus } from '../../api/types';
import { colors, pastels, radius, shadows, spacing, typography } from '../../theme';
import { AccommodationStatusBadge } from './AccommodationStatusBadge';
import { AccommodationInactiveBadge } from './AccommodationInactiveBadge';
import { formatAccommodationDate } from './AccommodationDetailRows';
import { DashboardSectionTitle } from '../dashboard/DashboardSectionTitle';

export type InventoryOverviewKind = 'unit' | 'bed' | 'room';

type AccommodationInventoryOverviewProps = {
  kind: InventoryOverviewKind;
  /** Business reference code (e.g. UNT00157). */
  referenceCode?: string | null;
  status: AccommodationStatus;
  inactive?: boolean;
  /** Catalog / configured rent — not occupancy snapshot. */
  rent?: number | null;
  deposit?: number | null;
  /**
   * Optional pricing-basis label for the inventory entity.
   * Pass null/undefined to show “Not set”; omit the row with `showPricingBasis={false}`.
   */
  pricingBasisLabel?: string | null;
  showPricingBasis?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  /** Override rent field label (default: Rent). */
  rentLabel?: string;
};

function formatMoney(value: number | null | undefined, empty: string): string {
  if (value == null || Number.isNaN(value)) {
    return empty;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

type TileProps = {
  icon: LucideIcon;
  iconBg: string;
  iconFg: string;
  label: string;
  children: React.ReactNode;
};

function OverviewTile({ icon: Icon, iconBg, iconFg, label, children }: TileProps) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: iconBg }]}>
        <Icon size={16} color={iconFg} strokeWidth={2.2} />
      </View>
      <View style={styles.tileText}>
        <Text style={styles.tileLabel} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.tileValue}>{children}</View>
      </View>
    </View>
  );
}

/**
 * Compact Property Overview + Key Dates for unit/bed/room detail screens.
 * Avoids tall label/value stacks and duplicate name/number fields already shown in the hero.
 */
export function AccommodationInventoryOverview({
  kind,
  referenceCode,
  status,
  inactive = false,
  rent,
  deposit,
  pricingBasisLabel = null,
  showPricingBasis = true,
  createdAt,
  updatedAt,
  rentLabel,
}: AccommodationInventoryOverviewProps) {
  const { t } = useTranslation();
  const notConfigured = t('accommodation.pricing.notConfigured', {
    defaultValue: 'Not configured',
  });
  const notSet = t('accommodation.pricingConfirm.notSet', { defaultValue: 'Not set' });

  const idLabel =
    kind === 'bed'
      ? t('accommodation.beds.idLabel', { defaultValue: 'Bed ID' })
      : kind === 'room'
        ? t('accommodation.rooms.idLabel', { defaultValue: 'Room ID' })
        : t('accommodation.units.idLabel', { defaultValue: 'Unit ID' });

  const resolvedRentLabel =
    rentLabel ?? t('accommodation.fields.rent', { defaultValue: 'Rent' });

  return (
    <View style={styles.wrap}>
      <DashboardSectionTitle title={t('accommodation.setup.propertyOverview')} />
      <View style={styles.overviewCard}>
        <View style={styles.gridRow}>
          <OverviewTile
            icon={Building2}
            iconBg={pastels.green.bg}
            iconFg={pastels.green.fg}
            label={idLabel}>
            <Text style={styles.valueText} numberOfLines={1}>
              {referenceCode?.trim() ? referenceCode : '—'}
            </Text>
          </OverviewTile>
          <View style={styles.vDivider} />
          <OverviewTile
            icon={Layers}
            iconBg={pastels.blue.bg}
            iconFg={pastels.blue.fg}
            label={t('accommodation.status.label')}>
            {inactive ? (
              <AccommodationInactiveBadge />
            ) : (
              <AccommodationStatusBadge status={status} />
            )}
          </OverviewTile>
        </View>

        <View style={styles.hDivider} />

        <View style={styles.gridRow}>
          <OverviewTile
            icon={IndianRupee}
            iconBg={pastels.orange.bg}
            iconFg={pastels.orange.fg}
            label={resolvedRentLabel}>
            <Text
              style={[styles.valueText, rent == null && styles.mutedValue]}
              numberOfLines={2}>
              {formatMoney(rent, notConfigured)}
            </Text>
          </OverviewTile>
          <View style={styles.vDivider} />
          <OverviewTile
            icon={Shield}
            iconBg={pastels.green.bg}
            iconFg={pastels.green.fg}
            label={t('accommodation.fields.securityDeposit', {
              defaultValue: 'Security Deposit',
            })}>
            <Text
              style={[styles.valueText, deposit == null && styles.mutedValue]}
              numberOfLines={2}>
              {formatMoney(deposit, notConfigured)}
            </Text>
          </OverviewTile>
        </View>

        {showPricingBasis ? (
          <>
            <View style={styles.hDivider} />
            <View style={styles.fullRow}>
              <View style={[styles.tileIcon, { backgroundColor: pastels.green.bg }]}>
                <Tag size={16} color={pastels.green.fg} strokeWidth={2.2} />
              </View>
              <View style={styles.tileText}>
                <Text style={styles.tileLabel}>
                  {t('occupancy.contract.pricingBasis', { defaultValue: 'Pricing Basis' })}
                </Text>
                <Text
                  style={[
                    styles.valueText,
                    !pricingBasisLabel && styles.mutedValue,
                  ]}
                  numberOfLines={2}>
                  {pricingBasisLabel?.trim() ? pricingBasisLabel : notSet}
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </View>

      <DashboardSectionTitle
        title={t('accommodation.fields.keyDates', { defaultValue: 'Key Dates' })}
      />
      <View style={styles.datesCard}>
        <View style={styles.dateCol}>
          <View style={[styles.tileIcon, { backgroundColor: pastels.green.bg }]}>
            <CalendarPlus size={16} color={pastels.green.fg} strokeWidth={2.2} />
          </View>
          <View style={styles.tileText}>
            <Text style={styles.tileLabel}>{t('accommodation.fields.created')}</Text>
            <Text style={styles.valueText}>{formatAccommodationDate(createdAt)}</Text>
          </View>
        </View>
        <View style={styles.vDivider} />
        <View style={styles.dateCol}>
          <View style={[styles.tileIcon, { backgroundColor: pastels.green.bg }]}>
            <CalendarClock size={16} color={pastels.green.fg} strokeWidth={2.2} />
          </View>
          <View style={styles.tileText}>
            <Text style={styles.tileLabel}>{t('accommodation.fields.updated')}</Text>
            <Text style={styles.valueText}>{formatAccommodationDate(updatedAt)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  overviewCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tile: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
  },
  fullRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  tileLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  tileValue: {
    minHeight: 22,
    justifyContent: 'center',
  },
  valueText: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  mutedValue: {
    color: colors.muted,
    fontWeight: '600',
  },
  hDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  vDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  datesCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  dateCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
  },
});
