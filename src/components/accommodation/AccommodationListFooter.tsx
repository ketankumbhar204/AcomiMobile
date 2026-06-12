import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';

type AccommodationListFooterProps = {
  loadingMore?: boolean;
};

export function AccommodationListFooter({ loadingMore }: AccommodationListFooterProps) {
  if (!loadingMore) {
    return null;
  }

  return (
    <View style={styles.footer}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
