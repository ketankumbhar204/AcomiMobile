import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package, PlusCircle, UtensilsCrossed, type LucideIcon } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../theme';

export type MenuLibraryTab = 'items' | 'combos' | 'extras';

const TAB_ICONS: Record<MenuLibraryTab, LucideIcon> = {
  items: UtensilsCrossed,
  combos: Package,
  extras: PlusCircle,
};

type MenuLibraryTabBarProps = {
  activeTab: MenuLibraryTab;
  onTabChange: (tab: MenuLibraryTab) => void;
  /** Mess-only third tab for reusable meal extras. */
  showExtras?: boolean;
  counts?: Partial<Record<MenuLibraryTab, number>>;
};

export function MenuLibraryTabBar({
  activeTab,
  onTabChange,
  showExtras = false,
  counts,
}: MenuLibraryTabBarProps) {
  const { t } = useTranslation();

  const items = useMemo(() => {
    const tabs: MenuLibraryTab[] = showExtras ? ['items', 'combos', 'extras'] : ['items', 'combos'];
    return tabs.map(tab => {
      const label =
        tab === 'items'
          ? t('meals.library.tabItems')
          : tab === 'combos'
            ? t('meals.library.tabCombos')
            : t('meals.library.tabExtras');
      const count = counts?.[tab];
      return {
        key: tab,
        label: count == null ? label : `${label} (${count})`,
        icon: TAB_ICONS[tab],
      };
    });
  }, [counts, showExtras, t]);

  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {items.map(item => {
        const isActive = item.key === activeTab;
        const Icon = item.icon;
        return (
          <Pressable
            key={item.key}
            onPress={() => onTabChange(item.key)}
            style={({ pressed }) => [
              styles.tab,
              isActive && styles.tabActive,
              pressed && !isActive && styles.tabPressed,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
            testID={`library-tab-${item.key}`}>
            <Icon
              size={15}
              color={isActive ? colors.white : colors.textSecondary}
              strokeWidth={2.2}
            />
            <Text
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    gap: 3,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  labelActive: {
    color: colors.white,
  },
});
