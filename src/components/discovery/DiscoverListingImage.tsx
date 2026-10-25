import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { env } from '../../config/env';
import { colors } from '../../theme';
import { toAbsoluteListingImageUrl } from '../../utils/representativeImage';

type DiscoverListingImageProps = {
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  onError?: () => void;
};

function sourceKey(source: ImageSourcePropType): string {
  if (typeof source === 'number') {
    return `asset:${source}`;
  }
  if (Array.isArray(source)) {
    return source.map(item => ('uri' in item ? item.uri : '')).join('|');
  }
  if (source && typeof source === 'object' && 'uri' in source) {
    return source.uri ?? '';
  }
  return '';
}

function resolveSource(source: ImageSourcePropType): ImageSourcePropType {
  if (Array.isArray(source) || typeof source === 'number' || !source || !('uri' in source)) {
    return source;
  }
  const uri = source.uri?.trim();
  if (!uri) {
    return source;
  }
  return { ...source, uri: toAbsoluteListingImageUrl(uri, env.apiBaseUrl) };
}

function isRemoteSource(source: ImageSourcePropType): boolean {
  return typeof source === 'object' && source != null && !Array.isArray(source) && 'uri' in source;
}

/**
 * Cover image with a mint placeholder.
 * Android gives a percentage-sized Image a height of 0 when its parent is
 * absolutely positioned, which is how the listing cards fill their frame.
 * The bitmap uses the container's measured pixel size instead.
 */
export function DiscoverListingImage({
  source,
  style,
  accessibilityLabel,
  onError,
}: DiscoverListingImageProps) {
  const resolved = resolveSource(source);
  const key = sourceKey(resolved);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const failed = failedKey === key;
  const loaded = loadedKey === key;
  const ready = bounds.width > 0 && bounds.height > 0;

  useEffect(() => {
    setFailedKey(null);
    setLoadedKey(null);
  }, [key]);

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setBounds(current =>
      current.width === width && current.height === height ? current : { width, height },
    );
  }

  if (!key || failed) {
    return (
      <View
        style={[styles.fallback, style]}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <View style={[styles.wrap, style]} collapsable={false} onLayout={onLayout}>
      {ready ? (
        <Image
          source={resolved}
          style={{ width: bounds.width, height: bounds.height }}
          resizeMode="cover"
          accessibilityLabel={accessibilityLabel}
          onLoad={() => setLoadedKey(key)}
          onError={() => {
            setFailedKey(key);
            onError?.();
          }}
        />
      ) : null}
      {ready && !loaded && isRemoteSource(resolved) ? (
        <View style={styles.placeholder} pointerEvents="none">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.mintSubtle,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mintSubtle,
  },
  fallback: {
    backgroundColor: colors.mintSubtle,
  },
});
