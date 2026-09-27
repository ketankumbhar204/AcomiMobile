import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../theme';

type DiscoverListingImageProps = {
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

/**
 * Cover image with mint fallback — mirrors public website ListingImage.
 */
export function DiscoverListingImage({
  source,
  style,
  imageStyle,
  accessibilityLabel,
}: DiscoverListingImageProps) {
  const [failed, setFailed] = useState(false);

  if (!source || failed) {
    return (
      <View
        style={[styles.fallback, style]}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <Image
        source={source}
        style={[styles.image, imageStyle]}
        resizeMode="cover"
        accessibilityLabel={accessibilityLabel}
        onError={() => setFailed(true)}
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
    width: '100%',
    height: '100%',
  },
  fallback: {
    backgroundColor: colors.mintSubtle,
  },
});
