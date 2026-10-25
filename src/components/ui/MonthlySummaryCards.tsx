import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';

export type MonthlySummaryCardTone = 'default' | 'success' | 'pending' | 'remaining';

export type MonthlySummaryCardItem = {
  label: string;
  value: string;
  tone?: MonthlySummaryCardTone;
  onPress?: () => void;
  selected?: boolean;
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
            <View style={styles.copy}>
              <Text
                style={[styles.value, toneStyles[card.tone ?? 'default']]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}>
                {card.value}
              </Text>
              <Text style={styles.label} numberOfLines={2}>
                {card.label}
              </Text>
            </View>
            {card.onPress ? (
              <ChevronRight size={16} color={colors.muted} strokeWidth={2.2} />
            ) : null}
          </>
        );

        if (card.onPress) {
          return (
            <Pressable
              key={card.label}
              style={({ pressed }) => [
                ...cardStyle,
                card.selected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
              onPress={card.onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: Boolean(card.selected) }}
              accessibilityLabel={`${card.label}, ${card.value}`}>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 64,
    gap: spacing.xs,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  cardInRow: {
    minWidth: 0,
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.lightGreen,
  },
  cardPressed: {
    opacity: 0.88,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 15,
  },
});
