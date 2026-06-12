import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type {
  AccommodationTrailLevel,
  AccommodationTrailSegment,
} from '../../utils/accommodationContext';
import { colors, spacing, typography } from '../../theme';

type AccommodationContextTrailProps = {
  segments: AccommodationTrailSegment[];
  onNavigate?: (level: AccommodationTrailLevel) => void;
};

export function AccommodationContextTrail({
  segments,
  onNavigate,
}: AccommodationContextTrailProps) {
  if (segments.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {segments.map((segment, index) => (
          <React.Fragment key={`${segment.level}-${segment.label}`}>
            {index > 0 ? <Text style={styles.separator}> › </Text> : null}
            {segment.navigable && onNavigate ? (
              <Pressable
                onPress={() => onNavigate(segment.level)}
                hitSlop={4}
                accessibilityRole="link"
                accessibilityLabel={segment.label}>
                <Text style={styles.link} numberOfLines={2}>
                  {segment.label}
                </Text>
              </Pressable>
            ) : (
              <Text
                style={segment.navigable ? styles.ancestor : styles.current}
                numberOfLines={2}>
                {segment.label}
              </Text>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  separator: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
  },
  ancestor: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
  },
  link: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
  current: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 18,
  },
});
