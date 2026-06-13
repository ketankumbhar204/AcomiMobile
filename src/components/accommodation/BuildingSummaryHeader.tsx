import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BuildingSummaryResponse } from '../../api/types';
import { Card, InlineEditableName, Skeleton } from '../ui';
import { colors, spacing, typography } from '../../theme';
import type { AccommodationUiProfile } from '../../utils/accommodationProfile';
import { getLayoutModeLabelKey } from '../../utils/propertyLayoutMode';

type BuildingSummaryHeaderProps = {
  summary: BuildingSummaryResponse | null;
  profile: AccommodationUiProfile;
  loading?: boolean;
  editableName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
};

export function BuildingSummaryHeader({
  summary,
  profile,
  loading,
  editableName = false,
  onSaveName,
}: BuildingSummaryHeaderProps) {
  const { t } = useTranslation();

  if (loading && !summary) {
    return (
      <Card style={styles.card}>
        <Skeleton width="60%" height={20} />
        <View style={styles.gap} />
        <Skeleton width="80%" height={14} />
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const structureParts: string[] = [];
  if (profile.showFloors && summary.floors > 0) {
    structureParts.push(
      t('accommodation.builder.summaryFloors', { count: summary.floors }),
    );
  }
  if (profile.showUnitsOnFloor && summary.visibleUnitCount > 0) {
    structureParts.push(
      t('accommodation.builder.summaryApartments', { count: summary.visibleUnitCount }),
    );
  } else if (profile.showUnits && summary.visibleUnitCount > 0) {
    structureParts.push(
      t('accommodation.builder.summaryUnits', { count: summary.visibleUnitCount }),
    );
  }
  if (summary.rooms > 0) {
    structureParts.push(
      t('accommodation.builder.summaryRooms', { count: summary.rooms }),
    );
  }
  if (profile.showBeds && summary.beds > 0) {
    structureParts.push(
      t('accommodation.builder.summaryBeds', { count: summary.beds }),
    );
  }

  return (
    <Card style={styles.card}>
      <InlineEditableName
        value={summary.name}
        editable={editableName}
        onSave={onSaveName}
      />
      {summary.code ? (
        <Text style={styles.code}>{t('accommodation.buildings.code', { value: summary.code })}</Text>
      ) : null}
      <Text style={styles.layoutMode}>
        {t(getLayoutModeLabelKey(summary.layoutMode))}
      </Text>
      {structureParts.length > 0 ? (
        <Text style={styles.structure}>{structureParts.join(' · ')}</Text>
      ) : (
        <Text style={styles.structure}>{t('accommodation.builder.emptyStructure')}</Text>
      )}
      <Text style={styles.status}>
        {t('accommodation.builder.statusLine', {
          available: summary.available,
          occupied: summary.occupied,
          reserved: summary.reserved,
          maintenance: summary.maintenance,
          blocked: summary.blocked,
        })}
      </Text>
      {profile.showBeds && summary.availableBeds != null ? (
        <Text style={styles.availability}>
          {t('accommodation.builder.availabilityBeds', {
            available: summary.availableBeds,
            occupied: summary.occupiedBeds ?? 0,
            reserved: summary.reservedBeds ?? 0,
          })}
        </Text>
      ) : null}
      {summary.availableRooms != null && summary.availableRooms + (summary.occupiedRooms ?? 0) + (summary.reservedRooms ?? 0) > 0 ? (
        <Text style={styles.availability}>
          {t('accommodation.builder.availabilityRooms', {
            available: summary.availableRooms,
            occupied: summary.occupiedRooms ?? 0,
            reserved: summary.reservedRooms ?? 0,
          })}
        </Text>
      ) : null}
      {profile.showUnits && summary.availableUnits != null ? (
        <Text style={styles.availability}>
          {t('accommodation.builder.availabilityUnits', {
            available: summary.availableUnits,
            occupied: summary.occupiedUnits ?? 0,
            reserved: summary.reservedUnits ?? 0,
          })}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  gap: {
    height: spacing.sm,
  },
  code: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  layoutMode: {
    ...typography.caption,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  structure: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  status: {
    ...typography.caption,
    color: colors.muted,
  },
  availability: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
