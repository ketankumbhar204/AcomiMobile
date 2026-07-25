import React, { type ComponentType, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../../theme';
import { Button } from '../../ui/Button';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export type DashboardChoiceCardProps = {
  icon: ComponentType<IconProps>;
  title: string;
  description: string;
  ctaLabel: string;
  onPress: () => void;
  /** primary = filled green CTA; secondary = outlined/ghost CTA */
  variant?: 'primary' | 'secondary';
};

/** Large action choice card (Add customers / Import) for guided setup hubs. */
export function DashboardChoiceCard({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onPress,
  variant = 'primary',
}: DashboardChoiceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Icon size={22} color={colors.primaryDark} strokeWidth={2.2} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Button
        label={ctaLabel}
        onPress={onPress}
        variant={variant === 'primary' ? 'primary' : 'ghost'}
        icon={variant === 'secondary' ? Icon : undefined}
        style={styles.cta}
      />
    </View>
  );
}

export type DashboardTipCardProps = {
  icon?: ComponentType<IconProps>;
  message: string;
};

/** Soft tip / warning callout (lightbulb yellow). */
export function DashboardTipCard({
  icon: Icon,
  message,
}: DashboardTipCardProps) {
  return (
    <View style={styles.tipCard}>
      {Icon ? (
        <View style={styles.tipIcon}>
          <Icon size={18} color="#B45309" strokeWidth={2.2} />
        </View>
      ) : null}
      <Text style={styles.tipText}>{message}</Text>
    </View>
  );
}

export type DashboardReasonRow = {
  icon: ComponentType<IconProps>;
  title: string;
};

export type DashboardReasonCardProps = {
  title: string;
  rows: DashboardReasonRow[];
};

/** “Why …?” informational list with icon circles. */
export function DashboardReasonCard({ title, rows }: DashboardReasonCardProps) {
  return (
    <View style={styles.reasonCard}>
      <Text style={styles.reasonTitle}>{title}</Text>
      <View style={styles.reasonList}>
        {rows.map(row => {
          const RowIcon = row.icon;
          return (
            <View key={row.title} style={styles.reasonRow}>
              <View style={styles.reasonIcon}>
                <RowIcon size={18} color={colors.primaryDark} strokeWidth={2.2} />
              </View>
              <Text style={styles.reasonRowTitle}>{row.title}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function DashboardOrDivider({ label }: { label: string }) {
  return (
    <View style={styles.orRow}>
      <View style={styles.orLine} />
      <Text style={styles.orLabel}>{label}</Text>
      <View style={styles.orLine} />
    </View>
  );
}

export type DashboardInfoBannerProps = {
  icon?: ComponentType<IconProps>;
  title: string;
  badge?: string;
  children?: ReactNode;
};

/** Summary banner (e.g. “People from your other spaces · 12 found”). */
export function DashboardInfoBanner({
  icon: Icon,
  title,
  badge,
  children,
}: DashboardInfoBannerProps) {
  return (
    <View style={styles.infoBanner}>
      <View style={styles.infoBannerRow}>
        {Icon ? (
          <View style={styles.infoBannerIcon}>
            <Icon size={18} color={colors.primaryDark} strokeWidth={2.2} />
          </View>
        ) : null}
        <Text style={styles.infoBannerTitle}>{title}</Text>
        {badge ? (
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  description: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  cta: {
    alignSelf: 'stretch',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.card,
    padding: spacing.md,
  },
  tipIcon: {
    marginTop: 1,
  },
  tipText: {
    ...typography.caption,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  reasonCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  reasonTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.md,
  },
  reasonList: {
    gap: spacing.md,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reasonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonRowTitle: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  orLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
  },
  infoBanner: {
    backgroundColor: colors.lightGreen,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerTitle: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    flex: 1,
  },
  infoBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  infoBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
});
