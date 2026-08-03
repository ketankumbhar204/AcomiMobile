import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Building2, CalendarDays, MailPlus, UserRound } from 'lucide-react-native';
import { DashboardAvatar } from '../dashboard/shared/DashboardPersonCard';
import { Button } from '../ui';
import { colors, shadows, spacing, typography } from '../../theme';

type InvitationCardProps = {
  spaceName: string;
  spaceTypeLabel: string;
  roleLabel: string;
  invitedBy: string;
  expiresLabel: string;
  acceptLabel: string;
  accepting: boolean;
  disabled?: boolean;
  onAccept: () => void;
};

export function InvitationCard({
  spaceName,
  spaceTypeLabel,
  roleLabel,
  invitedBy,
  expiresLabel,
  acceptLabel,
  accepting,
  disabled,
  onAccept,
}: InvitationCardProps) {
  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.header}>
        <DashboardAvatar label={spaceName} icon={Building2} />
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {spaceName}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {spaceTypeLabel}
          </Text>
        </View>
        <View style={styles.roleChip}>
          <Text style={styles.roleChipText}>{roleLabel}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <UserRound size={14} color={colors.muted} strokeWidth={2.2} />
        <Text style={styles.meta} numberOfLines={1}>
          {invitedBy}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <CalendarDays size={14} color={colors.muted} strokeWidth={2.2} />
        <Text style={styles.meta} numberOfLines={1}>
          {expiresLabel}
        </Text>
      </View>
      <View style={styles.pendingChip}>
        <MailPlus size={12} color="#B45309" strokeWidth={2.4} />
        <Text style={styles.pendingText}>Pending</Text>
      </View>

      <Button
        label={acceptLabel}
        onPress={onAccept}
        loading={accepting}
        disabled={disabled}
      />
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  roleChip: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  roleChipText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
    flex: 1,
  },
  pendingChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: colors.warningTint,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#B45309',
  },
});
