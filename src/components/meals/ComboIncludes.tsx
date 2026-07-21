import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import {
  formatComboIncludeLines,
  formatComboIncludesCompact,
  type ComboIncludeItem,
} from '../../utils/comboIncludes';

type ComboIncludesProps = {
  items: ComboIncludeItem[];
  /** compact = single line; list = bullets (default). */
  variant?: 'list' | 'compact';
  /** Hide the section entirely when empty. */
  hideWhenEmpty?: boolean;
  numberOfLines?: number;
};

/** Customer-facing Includes generated from structured combo item quantities. */
export function ComboIncludes({
  items,
  variant = 'list',
  hideWhenEmpty = true,
  numberOfLines,
}: ComboIncludesProps) {
  const { t } = useTranslation();
  const lines = formatComboIncludeLines(items);

  if (lines.length === 0) {
    return hideWhenEmpty ? null : null;
  }

  if (variant === 'compact') {
    return (
      <Text style={styles.compact} numberOfLines={numberOfLines ?? 2}>
        {t('meals.combo.includesLabel')}: {formatComboIncludesCompact(items)}
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{t('meals.combo.includesLabel')}</Text>
      {lines.map((line, index) => (
        <View key={`${line}-${index}`} style={styles.row}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.line}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xs,
    gap: spacing.xxs,
  },
  heading: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    ...typography.body,
    color: colors.muted,
    lineHeight: 22,
  },
  line: {
    ...typography.body,
    flex: 1,
  },
  compact: {
    ...typography.caption,
    color: colors.muted,
  },
});
