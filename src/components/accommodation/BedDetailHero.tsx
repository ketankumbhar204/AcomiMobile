import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AccommodationStatus } from '../../api/types';
import { colors, shadows, spacing, typography } from '../../theme';
import { AccommodationStatusBadge } from './AccommodationStatusBadge';
import { LayoutIllustration } from './layout/cards/LayoutIllustration';
import { getBedIllustration } from './layout/illustrations/illustrationAssets';

type BedDetailHeroProps = {
  label: string;
  status: AccommodationStatus;
  occupantName?: string | null;
  subtitle?: string | null;
};

export function BedDetailHero({
  label,
  status,
  occupantName,
  subtitle,
}: BedDetailHeroProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <LayoutIllustration
          source={getBedIllustration(status)}
          size="bedHero"
        />
        <View style={styles.info}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.badgeRow}>
            <AccommodationStatusBadge status={status} />
          </View>
          {occupantName ? (
            <Text style={styles.occupant} numberOfLines={2}>
              {occupantName}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  label: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  badgeRow: {
    alignSelf: 'flex-start',
  },
  occupant: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
