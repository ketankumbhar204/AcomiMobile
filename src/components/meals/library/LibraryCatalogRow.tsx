import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../theme';
import { FoodTypeIcon } from '../../ui/FoodTypeIcon';
import {
  HeaderOverflowMenu,
  type HeaderOverflowMenuHandle,
  type HeaderOverflowMenuItem,
} from '../../ui/HeaderOverflowMenu';
import type { FoodType } from '../../../api/types';

type LibraryCatalogRowProps = {
  title: string;
  subtitle?: string;
  detail?: string;
  status?: string;
  meta?: string | null;
  foodType?: FoodType | null;
  leading?: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  /** When there is no row onPress, tapping the row opens the same menu as the overflow button. */
  openMenuOnPress?: boolean;
  menuItems?: HeaderOverflowMenuItem[];
  menuAccessibilityLabel: string;
  testID?: string;
};

export function LibraryCatalogRow({
  title,
  subtitle,
  detail,
  status,
  meta,
  foodType,
  leading,
  selected = false,
  onPress,
  openMenuOnPress = false,
  menuItems = [],
  menuAccessibilityLabel,
  testID,
}: LibraryCatalogRowProps) {
  const menuRef = useRef<HeaderOverflowMenuHandle>(null);
  const hasMenu = menuItems.length > 0;

  const handleRowPress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (openMenuOnPress && hasMenu) {
      menuRef.current?.open();
    }
  };

  const rowPressable = Boolean(onPress) || (openMenuOnPress && hasMenu);

  return (
    <Pressable
      onPress={rowPressable ? handleRowPress : undefined}
      disabled={!rowPressable}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && rowPressable && styles.rowPressed,
      ]}
      accessibilityRole={rowPressable ? 'button' : undefined}
      accessibilityLabel={title}
      testID={testID}>
      <View style={styles.leading}>
        {leading ?? (foodType ? <FoodTypeIcon foodType={foodType} size={16} /> : null)}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {meta ? (
            <Text style={styles.meta} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
        {detail ? (
          <Text style={styles.detail} numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
        {status ? (
          <Text style={styles.status} numberOfLines={1}>
            {status}
          </Text>
        ) : null}
      </View>
      {hasMenu ? (
        <HeaderOverflowMenu
          ref={menuRef}
          items={menuItems}
          accessibilityLabel={menuAccessibilityLabel}
          variant="inline"
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 64,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  rowPressed: {
    opacity: 0.92,
  },
  leading: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    flex: 1,
    minWidth: 0,
    fontWeight: '700',
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    flexShrink: 0,
    marginTop: 2,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detail: {
    ...typography.caption,
    color: colors.muted,
  },
  status: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
  },
});
