import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Layers, Package, UtensilsCrossed, type LucideIcon } from 'lucide-react-native';
import { pastels, radius, spacing, typography } from '../../../theme';

export type LibrarySummaryFocus = 'items' | 'categories' | 'combos';

type SummaryTile = {
  key: LibrarySummaryFocus;
  icon: LucideIcon;
  value: number;
  label: string;
  background: string;
  border: string;
  foreground: string;
  testID: string;
};

type LibrarySummaryStripProps = {
  categoryCount: number;
  itemCount: number;
  comboCount: number;
  categoriesLabel: string;
  itemsLabel: string;
  combosLabel: string;
  selected?: LibrarySummaryFocus | null;
  onSelect?: (focus: LibrarySummaryFocus) => void;
};

export function LibrarySummaryStrip({
  categoryCount,
  itemCount,
  comboCount,
  categoriesLabel,
  itemsLabel,
  combosLabel,
  selected = null,
  onSelect,
}: LibrarySummaryStripProps) {
  const tiles: SummaryTile[] = [
    {
      key: 'items',
      icon: UtensilsCrossed,
      value: itemCount,
      label: itemsLabel,
      background: pastels.mint.bg,
      border: pastels.mint.border,
      foreground: pastels.mint.fg,
      testID: 'library-summary-items',
    },
    {
      key: 'categories',
      icon: Layers,
      value: categoryCount,
      label: categoriesLabel,
      background: pastels.purple.bg,
      border: pastels.purple.border,
      foreground: pastels.purple.fg,
      testID: 'library-summary-categories',
    },
    {
      key: 'combos',
      icon: Package,
      value: comboCount,
      label: combosLabel,
      background: pastels.orange.bg,
      border: pastels.orange.border,
      foreground: pastels.orange.fg,
      testID: 'library-summary-combos',
    },
  ];

  return (
    <View style={styles.row} accessibilityRole="summary">
      {tiles.map(tile => {
        const Icon = tile.icon;
        const isSelected = selected === tile.key;
        const content = (
          <>
            <View style={[styles.iconWrap, { backgroundColor: `${tile.foreground}14` }]}>
              <Icon size={16} color={tile.foreground} strokeWidth={2.2} />
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.value, { color: tile.foreground }]} numberOfLines={1}>
                {tile.value}
              </Text>
              <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                {tile.label}
              </Text>
            </View>
          </>
        );
        if (!onSelect) {
          return (
            <View
              key={tile.key}
              style={[styles.tile, { backgroundColor: tile.background, borderColor: tile.border }]}
              testID={tile.testID}
              accessibilityLabel={`${tile.value} ${tile.label}`}>
              {content}
            </View>
          );
        }
        return (
          <Pressable
            key={tile.key}
            onPress={() => onSelect(tile.key)}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: tile.background,
                borderColor: isSelected ? tile.foreground : tile.border,
                borderWidth: isSelected ? 2 : 1,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${tile.value} ${tile.label}`}
            testID={tile.testID}>
            {content}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  value: {
    ...typography.bodyStrong,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
  },
});
