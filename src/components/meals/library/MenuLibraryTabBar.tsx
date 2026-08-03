import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package, PlusCircle, UtensilsCrossed, type LucideIcon } from 'lucide-react-native';
import { SegmentedTabs, type SegmentedTabItem } from '../../ui';
import { spacing } from '../../../theme';

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
};

export function MenuLibraryTabBar({
  activeTab,
  onTabChange,
  showExtras = false,
}: MenuLibraryTabBarProps) {
  const { t } = useTranslation();

  const items = useMemo<SegmentedTabItem<MenuLibraryTab>[]>(() => {
    const tabs: MenuLibraryTab[] = showExtras
      ? ['items', 'combos', 'extras']
      : ['items', 'combos'];

    return tabs.map(tab => ({
      key: tab,
      label:
        tab === 'items'
          ? t('meals.library.tabItems')
          : tab === 'combos'
            ? t('meals.library.tabCombos')
            : t('meals.library.tabExtras'),
      icon: TAB_ICONS[tab],
    }));
  }, [showExtras, t]);

  return (
    <SegmentedTabs
      items={items}
      value={activeTab}
      onChange={onTabChange}
      compact
      style={styles.wrap}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
});
