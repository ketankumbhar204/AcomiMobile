import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CreditCard, History, User, UtensilsCrossed, Wallet } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { SegmentedTabs, type SegmentedTabItem } from '../ui';
import { spacing } from '../../theme';

export type MemberDetailTab = 'profile' | 'meals' | 'payments' | 'deposit' | 'history';

const BASE_TABS: MemberDetailTab[] = ['profile', 'payments', 'deposit', 'history'];
const ALL_TABS: MemberDetailTab[] = ['profile', 'meals', 'payments', 'deposit', 'history'];

const TAB_ICONS: Record<MemberDetailTab, LucideIcon> = {
  profile: User,
  meals: UtensilsCrossed,
  payments: CreditCard,
  deposit: Wallet,
  history: History,
};

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
        icon: TAB_ICONS[tab],
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
  },
  wrapCompact: {
    marginBottom: spacing.sm,
  },
});
