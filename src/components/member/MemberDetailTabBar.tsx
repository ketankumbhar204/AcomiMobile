import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export type MemberDetailTab = 'profile' | 'meals' | 'deposit' | 'history';

const BASE_TABS: MemberDetailTab[] = ['profile', 'deposit', 'history'];

type MemberDetailTabBarProps = {
  activeTab: MemberDetailTab;
  onTabChange: (tab: MemberDetailTab) => void;
  showMealsTab?: boolean;
  compact?: boolean;
};

export function MemberDetailTabBar({
  activeTab,
  onTabChange,
  showMealsTab = false,
  compact = false,
}: MemberDetailTabBarProps) {
  const { t } = useTranslation();

  const tabs = showMealsTab
    ? (['profile', 'meals', 'deposit', 'history'] as MemberDetailTab[])
    : BASE_TABS;

  return (
    <View style={[styles.tabs, compact && styles.tabsCompact]}>
      {tabs.map(tab => {
        const isActive = activeTab === tab;
        return (
          <Pressable
            key={tab}
            onPress={() => onTabChange(tab)}
            style={[styles.tab, isActive && styles.tabActive]}>
            <Text
              style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              numberOfLines={1}>
              {t(`membership.detailTabs.${tab}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: spacing.xs,
    gap: spacing.xxs,
  },
  tabsCompact: {
    marginBottom: spacing.sm,
    padding: 2,
    gap: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  tabActive: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
  },
  tabLabelActive: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.primaryDark,
  },
});
