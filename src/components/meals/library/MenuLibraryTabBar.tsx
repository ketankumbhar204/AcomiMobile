import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../../theme';

export type MenuLibraryTab = 'items' | 'combos';

type MenuLibraryTabBarProps = {
  activeTab: MenuLibraryTab;
  onTabChange: (tab: MenuLibraryTab) => void;
};

export function MenuLibraryTabBar({ activeTab, onTabChange }: MenuLibraryTabBarProps) {
  const { t } = useTranslation();

  const tabs: MenuLibraryTab[] = ['items', 'combos'];

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {tabs.map(tab => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => onTabChange(tab)}
              style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {t(`meals.library.tab${tab === 'items' ? 'Items' : 'Combos'}`)}
              </Text>
              {isActive ? <View style={styles.indicator} /> : <View style={styles.indicatorPlaceholder} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  tabPressed: {
    opacity: 0.85,
  },
  label: {
    ...typography.body,
    color: colors.muted,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  indicatorPlaceholder: {
    position: 'absolute',
    bottom: 0,
    height: 2,
  },
});
