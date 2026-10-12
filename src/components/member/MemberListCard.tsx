import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, ChevronRight } from 'lucide-react-native';
import { DashboardAvatar } from '../dashboard/shared/DashboardPersonCard';
import { colors, shadows, spacing, typography } from '../../theme';

type MemberListCardProps = {
  title: string;
  iconLabel?: string;
  onPress: () => void;
  roleChip?: React.ReactNode;
  contactLabel?: string;
  statusChip?: React.ReactNode;
  statusLabel?: string;
  acomiLabel?: string;
  acomiActive?: boolean;
  footerLine?: string;
  paymentLine?: {
    text: string;
    tone: 'due' | 'clear' | 'review';
  };
  onPaymentPress?: () => void;
  foodLine?: {
    label: string;
    manageControl?: React.ReactNode;
  };
};

export function MemberListCard({
  title,
  iconLabel,
  onPress,
  roleChip,
  contactLabel,
  statusChip,
  statusLabel,
  acomiLabel,
  acomiActive = false,
  footerLine,
  paymentLine,
  onPaymentPress,
  foodLine,
}: MemberListCardProps) {
  const hasStatusLine = Boolean(statusLabel || acomiLabel);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(18, 140, 126, 0.08)' }}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={contactLabel ? `${title}, ${contactLabel}` : title}>
      <DashboardAvatar label={iconLabel ?? title} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.identity}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {roleChip || contactLabel ? (
              <View style={styles.roleRow}>
                {roleChip ? <View style={styles.roleSlot}>{roleChip}</View> : null}
                {contactLabel ? (
                  <Text style={styles.contactNumber}>{`·  ${contactLabel}`}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
          <View style={styles.trailing}>
            {statusChip}
            <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
          </View>
        </View>

        {hasStatusLine || foodLine ? (
          <View style={styles.metaRow}>
            <View style={styles.statusLine}>
              {statusLabel ? (
                <Text style={styles.statusLabel} numberOfLines={1}>
                  {statusLabel}
                </Text>
              ) : null}
              {acomiLabel ? (
                <>
                  <View
                    style={[
                      styles.separatorDot,
                      acomiActive && styles.separatorDotActive,
                    ]}
                  />
                  <Text style={styles.acomiLabel} numberOfLines={1}>
                    {acomiLabel}
                  </Text>
                </>
              ) : null}
            </View>
            {foodLine ? (
              <View style={styles.foodRow}>
                <Text style={styles.foodLabel} numberOfLines={1}>
                  {foodLine.label}
                </Text>
                {foodLine.manageControl}
              </View>
            ) : null}
          </View>
        ) : null}

        {paymentLine ? (
          <Pressable
            onPress={onPaymentPress}
            disabled={!onPaymentPress}
            hitSlop={6}
            accessibilityRole={onPaymentPress ? 'button' : 'text'}
            accessibilityLabel={paymentLine.text}>
            <Text
              style={[
                styles.paymentLine,
                paymentLine.tone === 'due' && styles.paymentDue,
                paymentLine.tone === 'clear' && styles.paymentClear,
                paymentLine.tone === 'review' && styles.paymentReview,
              ]}
              numberOfLines={1}>
              {paymentLine.text}
            </Text>
          </Pressable>
        ) : null}

        {footerLine ? (
          <View style={styles.footerRow}>
            <CalendarDays size={12} color={colors.muted} strokeWidth={2.2} />
            <Text style={styles.footerLine} numberOfLines={1}>
              {footerLine}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  cardPressed: {
    borderColor: `${colors.primary}66`,
    backgroundColor: colors.surface,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: '100%',
  },
  roleSlot: {
    flexShrink: 0,
  },
  contactNumber: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    flexShrink: 1,
    flexGrow: 1,
    minWidth: 96,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
    paddingTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
    minWidth: 0,
  },
  statusLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  separatorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  separatorDotActive: {
    backgroundColor: colors.primary,
  },
  acomiLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
    flexShrink: 1,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: spacing.xs,
  },
  foodLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  paymentLine: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  paymentDue: {
    color: '#D97706',
  },
  paymentClear: {
    color: colors.primaryDark,
  },
  paymentReview: {
    color: '#2563EB',
  },
  footerLine: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
    flexShrink: 1,
  },
});
