import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { OccupancyResponse } from '../../api/types';
import { Button, Card } from '../ui';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { formatOccupancyAllocatedDate } from '../../utils/occupancyRules';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type AccommodationOccupantSectionProps = {
  spaceId: string;
  occupancy: OccupancyResponse | null;
  loading?: boolean;
  error?: string | null;
};

export function AccommodationOccupantSection({
  spaceId,
  occupancy,
  loading = false,
  error = null,
}: AccommodationOccupantSectionProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  if (loading) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.sectionTitle}>
          {t('occupancy.targetOccupant.title', { defaultValue: 'Current occupant' })}
        </Text>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.sectionTitle}>
          {t('occupancy.targetOccupant.title', { defaultValue: 'Current occupant' })}
        </Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!occupancy) {
    return null;
  }

  function openMemberProfile() {
    navigation.navigate('MemberDetails', {
      spaceId,
      memberId: occupancy!.memberId,
    });
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>
        {t('occupancy.targetOccupant.title', { defaultValue: 'Current occupant' })}
      </Text>
      <Card style={styles.card}>
        <Text style={styles.label}>
          {t('occupancy.targetOccupant.member', { defaultValue: 'Member' })}
        </Text>
        <Pressable onPress={openMemberProfile} hitSlop={8}>
          <Text style={styles.memberName}>{occupancy.memberName}</Text>
        </Pressable>
        <Text style={styles.label}>{t('occupancy.section.allocatedOn')}</Text>
        <Text style={styles.meta}>{formatOccupancyAllocatedDate(occupancy.allocatedAt)}</Text>
        <Button
          label={t('occupancy.targetOccupant.viewMember', {
            defaultValue: 'View member profile',
          })}
          variant="secondary"
          onPress={openMemberProfile}
          style={styles.button}
        />
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
