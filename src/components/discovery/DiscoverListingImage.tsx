import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { env } from '../../config/env';
import { colors } from '../../theme';
import { toAbsoluteListingImageUrl } from '../../utils/representativeImage';

type DiscoverListingImageProps = {
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
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
 * Cover image with a mint placeholder. The bitmap is pinned to the cover
 * bounds — percentage width/height inside an absolute parent collapses on Android.
 */
export function DiscoverListingImage({
  source,
  style,
  imageStyle,
  accessibilityLabel,
  onError,
}: DiscoverListingImageProps) {
  const resolved = resolveSource(source);
  const key = sourceKey(resolved);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const failed = failedKey === key;
  const loaded = loadedKey === key;

  useEffect(() => {
    setFailedKey(null);
    setLoadedKey(null);
  }, [key]);

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
    <View style={[styles.wrap, style]} collapsable={false}>
      {!loaded ? (
        <View style={styles.placeholder} pointerEvents="none">
          {isRemoteSource(resolved) ? (
            <ActivityIndicator color={colors.primary} />
          ) : null}
        </View>
      ) : null}
      <Image
        source={resolved}
        style={[styles.image, imageStyle]}
        resizeMode="cover"
        accessibilityLabel={accessibilityLabel}
        onLoad={() => setLoadedKey(key)}
        onError={() => {
          setFailedKey(key);
          onError?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.mintSubtle,
  },
  image: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mintSubtle,
  },
  fallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.mintSubtle,
  },
});
