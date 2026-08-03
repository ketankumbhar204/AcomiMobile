import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';

export type MenuSelectionTab = 'history' | 'combos' | 'items';

type MenuSelectionTabBarProps = {
  activeTab: MenuSelectionTab;
  onTabChange: (tab: MenuSelectionTab) => void;
};

export function MenuSelectionTabBar({ activeTab, onTabChange }: MenuSelectionTabBarProps) {
  const { t } = useTranslation();
  const tabs: MenuSelectionTab[] = ['history', 'combos', 'items'];

  const labelFor = (tab: MenuSelectionTab) => {
    if (tab === 'history') return t('meals.planning.tabHistory');
    if (tab === 'combos') return t('meals.planning.tabCombos');
    return t('meals.planning.tabIndividualItems');
  };

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
              <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
                {labelFor(tab)}
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
    paddingHorizontal: spacing.xxs,
  },
  tabPressed: {
    opacity: 0.85,
  },
  label: {
    ...typography.body,
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: spacing.sm,
    right: spacing.sm,
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
