import React, { type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export type PaymentsSection = 'members' | 'pendingReview' | 'history';

export type PaymentSectionTabItem = {
  id: string;
  label: string;
  icon?: ComponentType<IconProps>;
  badge?: number;
  /** Visual tone for the count badge. */
  badgeTone?: 'primary' | 'info' | 'muted';
};

type PaymentsSectionTabBarProps = {
  sections: PaymentSectionTabItem[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
};

const BADGE_TONE = {
  primary: { bg: colors.primary, text: colors.white },
  info: { bg: '#2563EB', text: colors.white },
  muted: { bg: '#E2E8F0', text: colors.textSecondary },
} as const;

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
        const Icon = section.icon;
        const tone = BADGE_TONE[section.badgeTone ?? 'muted'];
        const showBadge = typeof section.badge === 'number' && section.badge > 0;
        const accent = isActive
          ? section.id === 'pendingReview'
            ? '#2563EB'
            : colors.primaryDark
          : colors.muted;

        return (
          <Pressable
            key={section.id}
            onPress={() => onSectionChange(section.id)}
            style={[
              styles.tab,
              isActive && styles.tabActive,
              isActive && section.id === 'pendingReview' && styles.tabActiveInfo,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}>
            <View style={styles.tabInner}>
              {Icon ? <Icon size={14} color={accent} strokeWidth={2.3} /> : null}
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                  isActive && section.id === 'pendingReview' && styles.tabLabelInfo,
                ]}
                numberOfLines={1}>
                {section.label}
              </Text>
              {showBadge ? (
                <View style={[styles.badge, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.badgeText, { color: tone.text }]}>{section.badge}</Text>
                </View>
              ) : null}
            </View>
            {isActive ? (
              <View
                style={[
                  styles.underline,
                  {
                    backgroundColor:
                      section.id === 'pendingReview' ? '#2563EB' : colors.primary,
                  },
                ]}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  tabActive: {},
  tabActiveInfo: {},
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 22,
    paddingBottom: spacing.xs,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  tabLabelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  tabLabelInfo: {
    color: '#2563EB',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  underline: {
    alignSelf: 'stretch',
    height: 2,
    borderRadius: 1,
    marginHorizontal: spacing.xs,
  },
});
