import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors, pastels, spacing } from '../../theme';

/**
 * Splash uses the same soft KPI pastel tokens as Dashboard cards
 * (occupied/available/reserved) so branding stays on-theme.
 */
/** Occupied / Available / Reserved card borders — muted enough for splash waves. */
const WAVE_MINT = pastels.mint.border;
const WAVE_LAVENDER = pastels.purple.border;
const WAVE_PEACH = pastels.orange.border;
const TOP_MINT = pastels.mint.bg;

/** Shown while the app boots. Visual layout matches the approved splash reference. */
export function BrandSplash() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const waveHeight = Math.max(118, Math.round(height * 0.2));

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel="Loading Acomi">
      <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="splashBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.white} />
            <Stop offset="0.4" stopColor="#FBFEFC" />
            <Stop offset="1" stopColor={colors.mintSubtle} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#splashBg)" />
        {/* Soft mint accent in the upper-left corner */}
        <Path
          d={`M0 0 H${width * 0.7} C${width * 0.46} ${height * 0.035} ${width * 0.26} ${height * 0.09} 0 ${height * 0.16} Z`}
          fill={TOP_MINT}
          opacity={0.7}
        />
      </Svg>

      <View
        style={[
          styles.center,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + waveHeight * 0.32,
          },
        ]}
      >
        <View style={styles.tile}>
          <Image
            source={require('../../assets/brand/splash-mark.png')}
            style={styles.mark}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
        <Text style={styles.name}>Acomi</Text>
        <View style={styles.taglineRow}>
          <Text style={styles.taglineWord}>Spaces</Text>
          <Text style={[styles.taglineDot, { color: pastels.green.fg }]}> · </Text>
          <Text style={styles.taglineWord}>Meals</Text>
          <Text style={[styles.taglineDot, { color: pastels.purple.fg }]}> · </Text>
          <Text style={styles.taglineWord}>People belong</Text>
        </View>
        <ActivityIndicator style={styles.spinner} size="small" color={colors.primary} />
      </View>

      <View
        style={[styles.waves, { height: waveHeight + insets.bottom }]}
        pointerEvents="none"
      >
        <Svg
          width={width}
          height={waveHeight + insets.bottom}
          viewBox={`0 0 ${width} ${waveHeight + insets.bottom}`}
        >
          {/* Top: light mint / teal (occupied-card family) */}
          <Path
            d={`M0 ${waveHeight * 0.36}
                C ${width * 0.2} ${waveHeight * 0.12}, ${width * 0.4} ${waveHeight * 0.48}, ${width * 0.62} ${waveHeight * 0.28}
                S ${width * 0.86} ${waveHeight * 0.08}, ${width} ${waveHeight * 0.24}
                V ${waveHeight + insets.bottom} H0 Z`}
            fill={WAVE_MINT}
            opacity={0.88}
          />
          {/* Middle: soft lavender (available-card family) */}
          <Path
            d={`M0 ${waveHeight * 0.52}
                C ${width * 0.22} ${waveHeight * 0.36}, ${width * 0.45} ${waveHeight * 0.7}, ${width * 0.7} ${waveHeight * 0.46}
                S ${width * 0.9} ${waveHeight * 0.4}, ${width} ${waveHeight * 0.5}
                V ${waveHeight + insets.bottom} H0 Z`}
            fill={WAVE_LAVENDER}
            opacity={0.9}
          />
          {/* Bottom: soft peach / orange (reserved-card family) */}
          <Path
            d={`M0 ${waveHeight * 0.68}
                C ${width * 0.24} ${waveHeight * 0.54}, ${width * 0.48} ${waveHeight * 0.86}, ${width * 0.74} ${waveHeight * 0.62}
                S ${width * 0.92} ${waveHeight * 0.58}, ${width} ${waveHeight * 0.7}
                V ${waveHeight + insets.bottom} H0 Z`}
            fill={WAVE_PEACH}
            opacity={0.92}
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 1,
  },
  tile: {
    width: 118,
    height: 118,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  mark: {
    width: 92,
    height: 92,
  },
  name: {
    marginTop: 22,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.textPrimary,
  },
  taglineRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  taglineWord: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.35,
    color: colors.textSecondary,
  },
  taglineDot: {
    fontSize: 13,
    fontWeight: '700',
  },
  spinner: {
    marginTop: 28,
  },
  waves: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
