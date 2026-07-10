import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export type PaymentsSection = 'members' | 'pendingReview' | 'history';

export type PaymentSectionTabItem = {
  id: string;
  label: string;
};

type PaymentsSectionTabBarProps = {
  sections: PaymentSectionTabItem[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
};

/** Shared segmented control used by owner and tenant Payments screens. */
export function PaymentsSectionTabBar({
  sections,
  activeSection,
  onSectionChange,
}: PaymentsSectionTabBarProps) {
  return (
    <View style={styles.tabs}>
      {sections.map(section => {
        const isActive = activeSection === section.id;
        return (
          <Pressable
            key={section.id}
            onPress={() => onSectionChange(section.id)}
            style={[styles.tab, isActive && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
              {section.label}
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
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
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
    fontSize: 11,
  },
  tabLabelActive: {
    ...typography.bodyStrong,
    fontSize: 11,
    color: colors.primaryDark,
  },
});
