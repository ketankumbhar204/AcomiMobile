import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, shadows, spacing, typography } from '../../theme';
import {
  getAccommodationHierarchyAccent,
  getAccommodationHierarchyIcon,
  type AccommodationHierarchyLevel,
} from '../../utils/accommodationHierarchy';

type AccommodationEntityHeroProps = {
  level: AccommodationHierarchyLevel;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  badge?: React.ReactNode;
  /** Optional custom icon; defaults to hierarchy Lucide icon */
  icon?: LucideIcon;
  /** When true, show first letter of title instead of Lucide icon */
  useInitial?: boolean;
  footer?: React.ReactNode;
};

/** Premium hero card for Building / Floor / Unit / Room / Bed detail screens. */
export function AccommodationEntityHero({
  level,
  title,
  subtitle,
  meta,
  badge,
  icon,
  useInitial = false,
  footer,
}: AccommodationEntityHeroProps) {
  const palette = getAccommodationHierarchyAccent(level);
  const Icon = icon ?? getAccommodationHierarchyIcon(level);
  const initial = title?.trim()?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <View style={[styles.wrap, { borderColor: palette.border }]}>
      <View
        style={[styles.decorBlob, { backgroundColor: palette.soft }]}
        pointerEvents="none"
      />
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWell,
            { backgroundColor: palette.soft, borderColor: palette.border },
          ]}>
          {useInitial ? (
            <Text style={[styles.initial, { color: palette.accent }]}>{initial}</Text>
          ) : (
            <Icon size={22} color={palette.accent} strokeWidth={2.2} />
          )}
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
          {badge || meta ? (
            <View style={styles.metaRow}>
              {badge}
              {meta ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {meta}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.lg,
    overflow: 'hidden',
    gap: spacing.md,
    ...shadows.sm,
  },
  decorBlob: {
    position: 'absolute',
    top: -48,
    right: -36,
    width: 132,
    height: 132,
    borderRadius: 66,
    opacity: 0.7,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWell: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    ...typography.h2,
    fontSize: 22,
    fontWeight: '700',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    ...typography.h2,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  meta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
    flexShrink: 1,
  },
  footer: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
