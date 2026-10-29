import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme';

/** Shown while the app boots, matching the native window splash. */
export function BrandSplash() {
  return (
    <View style={styles.splash}>
      <View style={styles.markFrame}>
        <Image
          source={require('../../assets/brand/icon-light.png')}
          style={styles.mark}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
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
  markFrame: {
    width: 112,
    height: 112,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#ECFDF5',
  },
  mark: {
    width: 112,
    height: 112,
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
