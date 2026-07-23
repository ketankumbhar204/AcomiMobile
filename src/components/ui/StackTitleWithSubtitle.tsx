import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../../theme';

type StackTitleWithSubtitleProps = {
  title: string;
  subtitle?: string | null;
};

/** Compact nav title + one-line context (e.g. space name) without extra screen height. */
export function StackTitleWithSubtitle({ title, subtitle }: StackTitleWithSubtitleProps) {
  const trimmed = subtitle?.trim();
  return (
    <View style={styles.wrap} accessibilityRole="header">
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {trimmed ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {trimmed}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 220,
  },
  title: {
    ...typography.h3,
    fontSize: 17,
    lineHeight: 20,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    color: colors.muted,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
});
