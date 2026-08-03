import React, { type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Building2, User } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../../theme';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export type DashboardPersonRoleTone =
  | 'owner'
  | 'customer'
  | 'resident'
  | 'former'
  | 'staff'
  | 'neutral';

const ROLE_TONE: Record<
  DashboardPersonRoleTone,
  { bg: string; text: string; border: string }
> = {
  owner: { bg: colors.lightGreen, text: colors.primaryDark, border: `${colors.primary}40` },
  customer: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  resident: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  former: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  staff: { bg: colors.surface, text: colors.textSecondary, border: colors.border },
  neutral: { bg: colors.surface, text: colors.textSecondary, border: colors.border },
};

export type DashboardStatusTone = 'available' | 'current' | 'muted';

export function DashboardAvatar({
  label,
  icon: Icon = User,
}: {
  label?: string;
  icon?: ComponentType<IconProps>;
}) {
  const initial = label?.trim()?.charAt(0)?.toUpperCase();
  return (
    <View style={styles.avatar}>
      {initial ? (
        <Text style={styles.avatarText}>{initial}</Text>
      ) : (
        <Icon size={18} color={colors.primaryDark} strokeWidth={2.2} />
      )}
    </View>
  );
}

export function DashboardRoleChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: DashboardPersonRoleTone;
}) {
  const palette = ROLE_TONE[tone];
  return (
    <View
      style={[
        styles.roleChip,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}>
      <Text style={[styles.roleChipText, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

export function DashboardStatusChip({
  label,
  tone = 'available',
}: {
  label: string;
  tone?: DashboardStatusTone;
}) {
  const color =
    tone === 'available'
      ? colors.primaryDark
      : tone === 'current'
        ? '#6D28D9'
        : colors.muted;
  return (
    <View style={styles.statusChip}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

export type DashboardPersonCardProps = {
  name: string;
  mobile: string;
  sourceLabel: string;
  roleLabel: string;
  roleTone?: DashboardPersonRoleTone;
  statusLabel: string;
  statusTone?: DashboardStatusTone;
  actionLabel: string;
  onAdd: () => void;
  disabled?: boolean;
  selected?: boolean;
};

/** Import / reuse person row matching guided-setup mockup. */
export function DashboardPersonCard({
  name,
  mobile,
  sourceLabel,
  roleLabel,
  roleTone = 'customer',
  statusLabel,
  statusTone = 'available',
  actionLabel,
  onAdd,
  disabled = false,
  selected = false,
}: DashboardPersonCardProps) {
  return (
    <View style={[styles.card, selected && styles.cardSelected, disabled && styles.cardDisabled]}>
      <DashboardAvatar label={name} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <DashboardStatusChip label={statusLabel} tone={statusTone} />
        </View>
        <Text style={styles.mobile}>{mobile}</Text>
        <View style={styles.metaRow}>
          <Building2 size={12} color={colors.muted} strokeWidth={2.2} />
          <Text style={styles.source} numberOfLines={1}>
            {sourceLabel}
          </Text>
        </View>
        <View style={styles.footerRow}>
          <DashboardRoleChip label={roleLabel} tone={roleTone} />
          <Pressable
            onPress={onAdd}
            disabled={disabled}
            style={({ pressed }) => [
              styles.addBtn,
              pressed && !disabled && styles.addBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}>
            <Text style={styles.addBtnText}>{actionLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  roleChip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  roleChipText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  statusChip: {
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
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.bodyStrong,
    flex: 1,
  },
  mobile: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  source: {
    ...typography.caption,
    color: colors.muted,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  addBtnPressed: {
    backgroundColor: colors.lightGreen,
  },
  addBtnText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
