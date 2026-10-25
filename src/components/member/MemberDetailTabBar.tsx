import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SegmentedTabs, type SegmentedTabItem } from '../ui';
import { colors, radius, spacing } from '../../theme';

export type MemberDetailTab = 'profile' | 'meals' | 'payments' | 'deposit' | 'history';

const BASE_TABS: MemberDetailTab[] = ['profile', 'payments', 'deposit', 'history'];
const ALL_TABS: MemberDetailTab[] = ['profile', 'meals', 'payments', 'deposit', 'history'];

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

  const items = useMemo<SegmentedTabItem<MemberDetailTab>[]>(
    () =>
      (showMealsTab ? ALL_TABS : BASE_TABS).map(tab => ({
        key: tab,
        label: t(`membership.detailTabs.${tab}`),
      })),
    [showMealsTab, t],
  );

  return (
    <SegmentedTabs
      items={items}
      value={activeTab}
      onChange={onTabChange}
      compact
      style={compact ? styles.wrapCompact : styles.wrap}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    backgroundColor: colors.section,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
  },
  wrapCompact: {
    marginBottom: spacing.sm,
    backgroundColor: colors.section,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
  },
});
