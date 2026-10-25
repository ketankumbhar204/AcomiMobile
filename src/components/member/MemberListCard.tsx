import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, ChevronRight, Smartphone } from 'lucide-react-native';
import { DashboardAvatar } from '../dashboard/shared/DashboardPersonCard';
import { ContactNumberLine, StayTrailLine } from './ContactAndStayMeta';
import { colors, shadows, spacing, typography } from '../../theme';

type MemberListCardProps = {
  title: string;
  iconLabel: string;
  onPress: () => void;
  roleChip?: React.ReactNode;
  contactLabel?: string;
  stayLabel?: string | null;
  statusChip?: React.ReactNode;
  statusLabel?: string;
  statusColor?: string;
  acomiLabel?: string;
  acomiActive?: boolean;
  footerLine?: string;
  paymentLine?: { text: string; tone: 'due' | 'clear' | 'review' };
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
  stayLabel,
  statusChip,
  statusLabel,
  statusColor = colors.textSecondary,
  acomiLabel,
  acomiActive,
  footerLine,
  paymentLine,
  onPaymentPress,
  foodLine,
}: MemberListCardProps) {
  const paymentColor =
    paymentLine?.tone === 'due'
      ? '#D97706'
      : paymentLine?.tone === 'review'
        ? '#1D4ED8'
        : colors.primaryDark;
  const showMeta = Boolean(statusLabel || acomiLabel || footerLine);
  const showBottom = Boolean(paymentLine || foodLine);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <DashboardAvatar initial={iconLabel} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.identity}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {roleChip}
          </View>
          <View style={styles.trailing}>
            {statusChip}
            <ChevronRight size={16} color={colors.muted} />
          </View>
        </View>
        {contactLabel ? <ContactNumberLine label={contactLabel} /> : null}
        {stayLabel ? <StayTrailLine label={stayLabel} /> : null}
        {showMeta ? (
          <View style={styles.metaRow}>
            {statusLabel ? (
              <View style={styles.metaItem}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.metaText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            ) : null}
            {acomiLabel ? (
              <View style={styles.metaItem}>
                <Smartphone
                  size={12}
                  color={acomiActive ? colors.primary : colors.muted}
                  strokeWidth={2.2}
                />
                <Text style={[styles.metaText, acomiActive ? styles.acomiOn : styles.metaMuted]}>
                  {acomiLabel}
                </Text>
              </View>
            ) : null}
            {footerLine ? (
              <View style={styles.metaItem}>
                <CalendarDays size={12} color={colors.muted} />
                <Text style={[styles.metaText, styles.metaMuted]}>{footerLine}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {showBottom ? (
          <View style={styles.bottomRow}>
            {paymentLine ? (
              <Pressable
                accessibilityRole="button"
                onPress={onPaymentPress}
                disabled={!onPaymentPress}
                style={styles.paymentPress}>
                <Text style={[styles.paymentText, { color: paymentColor }]} numberOfLines={1}>
                  {paymentLine.text}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.paymentPress} />
            )}
            {foodLine ? (
              <View style={styles.foodRow}>
                <Text style={styles.foodLabel}>{foodLine.label}</Text>
                {foodLine.manageControl}
              </View>
            ) : null}
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
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 18,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
    paddingTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.sm,
    rowGap: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  metaText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  metaMuted: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  acomiOn: {
    color: colors.primaryDark,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 2,
  },
  paymentPress: {
    flexShrink: 1,
    minWidth: 0,
  },
  paymentText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 12,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    flexShrink: 1,
    maxWidth: '62%',
  },
  foodLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
});
