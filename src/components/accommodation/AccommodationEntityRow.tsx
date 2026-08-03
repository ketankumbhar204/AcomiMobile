import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { InlineEditableName } from '../ui/InlineEditableName';
import { colors, shadows, spacing, typography } from '../../theme';
import {
  AccommodationInactiveBadge,
  accommodationInactiveCardStyle,
} from './AccommodationInactiveBadge';
import { isAccommodationEntityActive } from '../../utils/accommodationEntityActive';
import {
  getAccommodationHierarchyAccent,
  getAccommodationHierarchyIcon,
  type AccommodationHierarchyLevel,
} from '../../utils/accommodationHierarchy';

type AccommodationEntityRowProps = {
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  /** @deprecated Prefer hierarchyLevel + Lucide icons */
  iconLabel?: string;
  hierarchyLevel?: AccommodationHierarchyLevel;
  icon?: LucideIcon;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  showChevron?: boolean;
  editableName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
  active?: boolean;
};

export function AccommodationEntityRow({
  title,
  subtitle,
  meta,
  iconLabel,
  hierarchyLevel,
  icon,
  onPress,
  onLongPress,
  menu,
  badge,
  footer,
  showChevron = true,
  editableName = false,
  onSaveName,
  active = true,
}: AccommodationEntityRowProps) {
  const inactive = !isAccommodationEntityActive({ active });
  const showTrailingChevron = showChevron && !menu;
  const palette = hierarchyLevel
    ? getAccommodationHierarchyAccent(hierarchyLevel)
    : null;
  const HierarchyIcon =
    icon ?? (hierarchyLevel ? getAccommodationHierarchyIcon(hierarchyLevel) : null);
  const showIcon = Boolean(HierarchyIcon || iconLabel);

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, inactive && accommodationInactiveCardStyle]}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          android_ripple={{ color: 'rgba(18, 140, 126, 0.08)' }}
          style={({ pressed }) => [styles.main, pressed && styles.mainPressed]}
          accessibilityRole="button"
          accessibilityLabel={title}>
          {showIcon ? (
            <View
              style={[
                styles.icon,
                palette && {
                  backgroundColor: palette.soft,
                  borderColor: palette.border,
                  borderWidth: 1,
                },
                inactive && styles.iconInactive,
              ]}>
              {HierarchyIcon && !inactive ? (
                <HierarchyIcon
                  size={20}
                  color={palette?.accent ?? colors.primaryDark}
                  strokeWidth={2.2}
                />
              ) : (
                <Text
                  style={[
                    styles.iconText,
                    palette && !inactive ? { color: palette.accent } : null,
                    inactive && styles.iconTextInactive,
                  ]}>
                  {(iconLabel ?? title).charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          ) : null}
          <View style={styles.info}>
            <InlineEditableName
              value={title}
              editable={editableName}
              onSave={onSaveName}
            />
            {meta ? <View style={styles.meta}>{meta}</View> : null}
            {subtitle ? (
              <Text
                style={[styles.subtitle, inactive && styles.subtitleInactive]}
                numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
            {inactive ? (
              <View style={styles.badge}>
                <AccommodationInactiveBadge />
              </View>
            ) : badge ? (
              <View style={styles.badge}>{badge}</View>
            ) : null}
          </View>
          {showTrailingChevron ? (
            <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
          ) : null}
        </Pressable>
        {menu ? (
          <>
            <View style={styles.divider} />
            <View style={styles.menuSlot}>{menu}</View>
          </>
        ) : null}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 72,
    overflow: 'hidden',
    ...shadows.sm,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  mainPressed: {
    backgroundColor: colors.surface,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  iconTextInactive: {
    color: colors.white,
  },
  iconInactive: {
    backgroundColor: '#9CA3AF',
    borderColor: '#9CA3AF',
  },
  info: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    justifyContent: 'center',
    gap: 2,
  },
  meta: {
    minHeight: 18,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
  },
  subtitleInactive: {
    color: '#9CA3AF',
  },
  badge: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  menuSlot: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
