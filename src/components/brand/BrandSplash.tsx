import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme';

/** Shown while the app boots, matching the native window splash. */
export function BrandSplash() {
  return (
    <View style={styles.splash}>
      <Image
        source={require('../../assets/brand/icon-light.png')}
        style={styles.mark}
        accessibilityIgnoresInvertColors
      />
      <Text style={styles.name}>ACOMI</Text>
      <Text style={styles.tagline}>Spaces · Meals · People belong</Text>
      <ActivityIndicator style={styles.spinner} size="small" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  mark: {
    width: 96,
    height: 96,
    borderRadius: 22,
  },
  name: {
    marginTop: spacing.md,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: '#0F2744',
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  spinner: {
    marginTop: spacing.lg,
  },
});
