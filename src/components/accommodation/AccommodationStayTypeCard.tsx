import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react-native';
import type { OccupancyResponse } from '../../api/types';
import { colors, pastels, radius, shadows, spacing, typography } from '../../theme';
import {
  stayChoiceDefaultLabel,
  stayChoiceLabelKey,
  type StayChoice,
} from '../../utils/shortStay';
import { resolveOccupancyStayKind } from '../../utils/stayFinancialDisplay';
import { DashboardSectionTitle } from '../dashboard/DashboardSectionTitle';

type AccommodationStayTypeCardProps = {
  occupancy?: Pick<OccupancyResponse, 'stayKind' | 'pricingBasis'> | null;
  /** Fallback when only a summary DTO exposes stayKind (e.g. bed occupant). */
  stayKind?: StayChoice | null;
};

/**
 * Occupant Stay Type card — only when occupancy provides enough data to resolve a kind.
 * Vacant inventory must not pass a fabricated stay type.
 */
export function AccommodationStayTypeCard({
  occupancy = null,
  stayKind = null,
}: AccommodationStayTypeCardProps) {
  const { t } = useTranslation();

  const explicitOccupancy =
    occupancy?.stayKind === 'MONTHLY' ||
    occupancy?.stayKind === 'SHORT' ||
    occupancy?.stayKind === 'OPEN_ENDED';
  const hasPricingBasis = Boolean(occupancy?.pricingBasis);
  const explicitSummary =
    stayKind === 'MONTHLY' || stayKind === 'SHORT' || stayKind === 'OPEN_ENDED';

  if (!explicitOccupancy && !hasPricingBasis && !explicitSummary) {
    return null;
  }

  const kind = (
    explicitOccupancy || hasPricingBasis
      ? resolveOccupancyStayKind(occupancy!)
      : stayKind
  ) as StayChoice;
  const label = t(stayChoiceLabelKey(kind), {
    defaultValue: stayChoiceDefaultLabel(kind),
  });

  return (
    <View style={styles.wrap}>
      <DashboardSectionTitle
        title={t('occupancy.section.stayDetails', { defaultValue: 'Stay Details' })}
      />
      <View style={styles.card}>
        <View style={styles.icon}>
          <CalendarDays size={16} color={pastels.purple.fg} strokeWidth={2.2} />
        </View>
        <View style={styles.text}>
          <Text style={styles.label}>
            {t('occupancyWizard.steps.stayType', { defaultValue: 'Stay Type' })}
          </Text>
          <View style={styles.chip}>
            <Text style={styles.chipText} numberOfLines={2}>
              {label}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: pastels.purple.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: pastels.purple.bg,
    borderRadius: radius.full ?? 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: pastels.purple.border,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '700',
    color: pastels.purple.fg,
  },
});
