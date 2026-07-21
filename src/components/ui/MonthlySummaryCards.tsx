import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export type MonthlySummaryCardTone = 'default' | 'success' | 'pending' | 'remaining';

export type MonthlySummaryCardItem = {
  label: string;
  value: string;
  tone?: MonthlySummaryCardTone;
  onPress?: () => void;
};

type MonthlySummaryCardsProps = {
  cards: MonthlySummaryCardItem[];
};

const toneStyles: Record<MonthlySummaryCardTone, object | undefined> = {
  default: undefined,
  success: { color: colors.success },
  pending: { color: '#EAB308' },
  remaining: { color: colors.primary },
};

/**
 * Compact 2×2 (or flex-wrap) KPI grid used across monthly summary screens.
 * Card order convention: Total/Expected → Collected → Pending amount → Count.
 */
export function MonthlySummaryCards({ cards }: MonthlySummaryCardsProps) {
  if (cards.length === 0) {
    return null;
  }

  const useRow = cards.length === 3;

  return (
    <View style={useRow ? styles.row : styles.grid}>
      {cards.map(card => {
        const cardStyle = [styles.card, useRow && styles.cardInRow];
        const content = (
          <>
            <Text style={[styles.value, toneStyles[card.tone ?? 'default']]} numberOfLines={1}>
              {card.value}
            </Text>
            <Text style={styles.label}>{card.label}</Text>
          </>
        );

        if (card.onPress) {
          return (
            <Pressable
              key={card.label}
              style={({ pressed }) => [...cardStyle, pressed && styles.cardPressed]}
              onPress={card.onPress}
              accessibilityRole="button">
              {content}
            </Pressable>
          );
        }

        return (
          <View key={card.label} style={cardStyle}>
            {content}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 1,
  },
  cardInRow: {
    minWidth: 0,
  },
  cardPressed: {
    opacity: 0.88,
    borderColor: colors.primary,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 15,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
  },
});
