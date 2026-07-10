import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type MemberListCardProps = {
  title: string;
  subtitle?: string;
  iconLabel?: string;
  onPress: () => void;
  statusChip?: React.ReactNode;
  metaLine?: string;
  foodLine?: {
    label: string;
    manageControl?: React.ReactNode;
  };
};

export function MemberListCard({
  title,
  subtitle,
  iconLabel,
  onPress,
  statusChip,
  metaLine,
  foodLine,
}: MemberListCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button">
      {iconLabel ? (
        <View style={styles.icon}>
          <Text style={styles.iconText}>{iconLabel}</Text>
        </View>
      ) : null}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {statusChip ? <View style={styles.chipSlot}>{statusChip}</View> : null}
          <Text style={styles.chevron}>›</Text>
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {metaLine || foodLine ? (
          <View style={styles.metaRow}>
            {metaLine ? (
              <Text style={styles.metaLine} numberOfLines={2}>
                {metaLine}
              </Text>
            ) : (
              <View style={styles.metaLineSpacer} />
            )}
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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  cardPressed: {
    borderColor: `${colors.primary}66`,
    backgroundColor: colors.surface,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
    flex: 1,
    minWidth: 0,
  },
  chipSlot: {
    flexShrink: 0,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.muted,
    lineHeight: 24,
    flexShrink: 0,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  metaLine: {
    ...typography.caption,
    color: colors.muted,
    flex: 1,
    minWidth: 0,
  },
  metaLineSpacer: {
    flex: 1,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: spacing.xxs,
  },
  foodLabel: {
    ...typography.caption,
    color: colors.muted,
  },
});
