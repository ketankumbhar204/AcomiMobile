import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { BedOccupantSummaryResponse, OccupancyResponse } from '../../api/types';
import { Button, Card } from '../ui';
import { OccupancyContractSnapshotCard } from './OccupancyContractSnapshotCard';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import {
  formatOccupancyAllocatedDate,
  getOccupancyExitDate,
} from '../../utils/occupancyRules';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type AccommodationOccupantSectionProps = {
  spaceId: string;
  occupancy?: OccupancyResponse | null;
  occupant?: BedOccupantSummaryResponse | null;
  loading?: boolean;
  error?: string | null;
};

export function AccommodationOccupantSection({
  spaceId,
  occupancy = null,
  occupant = null,
  loading = false,
  error = null,
}: AccommodationOccupantSectionProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const memberId = occupancy?.memberId ?? occupant?.memberId;
  const memberName = occupancy?.memberName ?? occupant?.memberName;
  const status = occupancy?.status ?? occupant?.occupancyStatus;
  const isReserved = status === 'RESERVED';

  const sectionTitle = isReserved
    ? t('occupancy.targetOccupant.titleReserved', { defaultValue: 'Reserved occupant' })
    : t('occupancy.targetOccupant.title', { defaultValue: 'Current occupant' });

  if (loading) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!memberId || !memberName) {
    return null;
  }

  function openMemberProfile() {
    navigation.navigate('MemberDetails', {
      spaceId,
      memberId: memberId!,
    });
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      <Card style={styles.card}>
        <View style={styles.badgeRow}>
          <Text style={[styles.statusBadge, isReserved && styles.statusReserved]}>
            {isReserved
              ? t('occupancy.status.RESERVED')
              : t('occupancy.status.ACTIVE')}
          </Text>
        </View>
        <Text style={styles.label}>
          {t('occupancy.targetOccupant.member', { defaultValue: 'Member' })}
        </Text>
        <Pressable onPress={openMemberProfile} hitSlop={8}>
          <Text style={styles.memberName}>{memberName}</Text>
        </Pressable>

        {occupancy?.moveInDate && isReserved ? (
          <>
            <Text style={styles.label}>{t('occupancy.section.moveInDate')}</Text>
            <Text style={styles.meta}>{formatOccupancyAllocatedDate(occupancy.moveInDate)}</Text>
          </>
        ) : null}

        {occupancy?.actualMoveInAt || (occupancy?.allocatedAt && !isReserved) ? (
          <>
            <Text style={styles.label}>
              {isReserved
                ? t('occupancy.section.reservedOn')
                : t('occupancy.section.allocatedOn')}
            </Text>
            <Text style={styles.meta}>
              {formatOccupancyAllocatedDate(
                isReserved
                  ? occupancy?.reservedAt
                  : occupancy?.actualMoveInAt ?? occupancy?.allocatedAt,
              )}
            </Text>
          </>
        ) : null}

        {getOccupancyExitDate(occupancy) ? (
          <>
            <Text style={styles.label}>{t('occupancy.fields.expectedExit')}</Text>
            <Text style={styles.meta}>
              {formatOccupancyAllocatedDate(getOccupancyExitDate(occupancy))}
            </Text>
          </>
        ) : null}

        <Button
          label={t('occupancy.targetOccupant.viewMember', {
            defaultValue: 'View member profile',
          })}
          variant="secondary"
          onPress={openMemberProfile}
          style={styles.button}
        />

        {!isReserved && occupancy ? (
          <OccupancyContractSnapshotCard occupancy={occupancy} />
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
  },
  card: {
    gap: spacing.xs,
  },
  badgeRow: {
    marginBottom: spacing.xs,
  },
  statusBadge: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  statusReserved: {
    color: '#B45309',
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  memberName: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  meta: {
    ...typography.body,
  },
  button: {
    marginTop: spacing.sm,
    width: '100%',
  },
  loader: {
    marginVertical: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
  },
});
