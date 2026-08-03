import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BadgeCheck, CircleSlash, type LucideIcon } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';

export type SpaceStatusTone = 'active' | 'inactive' | 'neutral' | 'premium';

type ToneStyle = { bg: string; fg: string; border: string };

const TONES: Record<SpaceStatusTone, ToneStyle> = {
  active: { bg: colors.successTint, fg: colors.success, border: '#A7F3D0' },
  inactive: { bg: colors.errorTint, fg: colors.danger, border: '#FECACA' },
  neutral: { bg: colors.surfaceSecondary, fg: '#475569', border: colors.border },
  premium: { bg: colors.warningTint, fg: '#B45309', border: '#FDE68A' },
};

type SpaceStatusChipProps = {
  label: string;
  tone?: SpaceStatusTone;
  icon?: LucideIcon;
};

/** Material tonal status chip for spaces (Active / Inactive / etc.). */
export function SpaceStatusChip({ label, tone = 'active', icon }: SpaceStatusChipProps) {
  const palette = TONES[tone];
  const Icon = icon ?? (tone === 'inactive' ? CircleSlash : BadgeCheck);

  return (
    <View
      style={[styles.chip, { backgroundColor: palette.bg, borderColor: palette.border }]}
      accessibilityRole="text"
      accessibilityLabel={label}>
      <Icon size={12} color={palette.fg} strokeWidth={2.4} />
      <Text style={[styles.text, { color: palette.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  text: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
});
