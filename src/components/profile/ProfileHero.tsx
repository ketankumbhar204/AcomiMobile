import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Building2, SquarePen, UserRound } from 'lucide-react-native';
import { SpaceStatusChip, type SpaceStatusTone } from '../spaces/SpaceStatusChip';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type ProfileHeroProps = {
  fullName: string;
  mobile?: string | null;
  photoUrl?: string | null;
  roleLabel?: string | null;
  spaceName?: string | null;
  statusLabel?: string | null;
  statusTone?: SpaceStatusTone;
  membershipLabel?: string | null;
  completionPercent?: number | null;
  completionLabel?: string;
  editLabel: string;
  onEdit: () => void;
};

function previewUri(stored?: string | null): string {
  if (!stored) {
    return '';
  }
  if (
    stored.startsWith('file://') ||
    stored.startsWith('data:') ||
    stored.startsWith('http')
  ) {
    return stored;
  }
  return stored;
}

/** Premium account hero — avatar, identity, space, status, quick edit. */
export function ProfileHero({
  fullName,
  mobile,
  photoUrl,
  roleLabel,
  spaceName,
  statusLabel,
  statusTone = 'active',
  membershipLabel,
  completionPercent,
  completionLabel,
  editLabel,
  onEdit,
}: ProfileHeroProps) {
  const uri = previewUri(photoUrl);
  const initial = (fullName ?? 'U').trim().charAt(0).toUpperCase() || 'U';
  const showCompletion =
    typeof completionPercent === 'number' &&
    Number.isFinite(completionPercent) &&
    completionPercent < 100;

  return (
    <View style={styles.hero} accessibilityRole="header">
      <View style={styles.decorBlob} pointerEvents="none" />
      <View style={styles.topRow}>
        {uri ? (
          <Image source={{ uri }} style={styles.avatar} accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.avatarFallback} accessibilityElementsHidden>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {fullName || '—'}
          </Text>
          {mobile ? (
            <Text style={styles.mobile} numberOfLines={1}>
              {mobile.startsWith('+') ? mobile : `+91 ${mobile}`}
            </Text>
          ) : null}
          <View style={styles.chipRow}>
            {roleLabel ? (
              <SpaceStatusChip label={roleLabel} tone="premium" icon={UserRound} />
            ) : null}
            {statusLabel ? <SpaceStatusChip label={statusLabel} tone={statusTone} /> : null}
            {membershipLabel ? (
              <SpaceStatusChip label={membershipLabel} tone="neutral" />
            ) : null}
          </View>
        </View>
      </View>

      {spaceName ? (
        <View style={styles.spaceRow}>
          <Building2 size={14} color={colors.primaryDark} strokeWidth={2.2} />
          <Text style={styles.spaceText} numberOfLines={1}>
            {spaceName}
          </Text>
        </View>
      ) : null}

      {showCompletion ? (
        <View style={styles.completionBlock}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionLabel}>{completionLabel}</Text>
            <Text style={styles.completionValue}>{Math.round(completionPercent)}%</Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.max(0, Math.min(100, completionPercent))}%` },
              ]}
            />
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={onEdit}
        style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel={editLabel}>
        <SquarePen size={16} color={colors.white} strokeWidth={2.2} />
        <Text style={styles.editBtnText}>{editLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.successTint,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  decorBlob: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${colors.primaryDark}14`,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  name: {
    ...typography.h2,
    fontSize: 20,
    lineHeight: 26,
    color: colors.primaryDark,
  },
  mobile: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  spaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'stretch',
  },
  spaceText: {
    ...typography.caption,
    flex: 1,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  completionBlock: {
    gap: spacing.xs,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  completionValue: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: `${colors.primary}22`,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primaryDark,
  },
  editBtn: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
  },
  editBtnPressed: {
    opacity: 0.9,
  },
  editBtnText: {
    ...typography.bodyStrong,
    color: colors.white,
    fontSize: 14,
  },
});
