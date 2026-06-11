import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export type MemberDetailTab =
  | 'profile'
  | 'deposit'
  | 'documents'
  | 'notes'
  | 'history';

const TABS: MemberDetailTab[] = [
  'profile',
  'deposit',
  'documents',
  'notes',
  'history',
];

type MemberDetailTabBarProps = {
  activeTab: MemberDetailTab;
  onTabChange: (tab: MemberDetailTab) => void;
};

export function MemberDetailTabBar({ activeTab, onTabChange }: MemberDetailTabBarProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.tabs}>
      {TABS.map(tab => {
        const isActive = activeTab === tab;
        return (
          <Pressable
            key={tab}
            onPress={() => onTabChange(tab)}
            style={[styles.tab, isActive && styles.tabActive]}>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
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
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  tabLabelActive: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.primaryDark,
  },
});
