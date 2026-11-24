import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type {
  MemberDirectoryAssociationResponse,
  MemberDirectoryPersonResponse,
} from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatMemberContactNumber } from '../../utils/indianMobile';
import { membershipRoleLabelKey } from '../../utils/memberRoles';
import { getMemberStatusColor, getMemberStatusLabelKey } from '../../utils/memberStatus';

type MemberDirectoryCardProps = {
  person: MemberDirectoryPersonResponse;
  onPress: (person: MemberDirectoryPersonResponse) => void;
  onPressAssociation: (association: MemberDirectoryAssociationResponse) => void;
};

/** Owner-level directory row: one person, one chip per space they belong to. */
export function MemberDirectoryCard({
  person,
  onPress,
  onPressAssociation,
}: MemberDirectoryCardProps) {
  const { t } = useTranslation();
  const initial = (person.displayName?.trim().charAt(0) || '?').toUpperCase();
  const contact =
    formatMemberContactNumber(person.mobileNumber) ??
    (person.mobileNumber || t('membership.members.mobileNotAvailable'));

  return (
    <Pressable
      onPress={() => onPress(person)}
      android_ripple={{ color: 'rgba(18, 140, 126, 0.06)' }}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={person.displayName}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {person.displayName}
          </Text>
          <Text style={styles.contact} numberOfLines={1}>
            {contact}
          </Text>
        </View>
      </View>
      <View style={styles.chipWrap}>
        {person.associations.map(association => {
          const statusColor = getMemberStatusColor(association.membershipStatus);
          return (
            <Pressable
              key={association.memberId}
              onPress={() => onPressAssociation(association)}
              hitSlop={4}
              style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
              accessibilityRole="button"
              accessibilityLabel={`${association.spaceName}, ${t(
                membershipRoleLabelKey(association.role, association.spaceType),
              )}, ${t(getMemberStatusLabelKey(association.membershipStatus))}`}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={styles.chipSpace} numberOfLines={1}>
                {association.spaceName}
              </Text>
              <Text style={styles.chipMeta} numberOfLines={1}>
                {t(membershipRoleLabelKey(association.role, association.spaceType))}
                {' · '}
                {t(getMemberStatusLabelKey(association.membershipStatus))}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGreen,
  },
  avatarText: {
    ...typography.bodyStrong,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  contact: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  chipPressed: {
    opacity: 0.7,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipSpace: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  chipMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
