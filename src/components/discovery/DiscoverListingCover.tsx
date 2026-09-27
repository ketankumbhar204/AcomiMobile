import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { resolveListingCover } from '../../utils/representativeImage';
import { DiscoverListingImage } from './DiscoverListingImage';

type DiscoverListingCoverProps = {
  listingId?: string | null;
  spaceType?: string | null;
  listingImageUrl?: string | null;
  style?: StyleProp<ViewStyle>;
  accessibilityName?: string;
};

export function DiscoverListingCover({
  listingId,
  spaceType,
  listingImageUrl,
  style,
  accessibilityName,
}: DiscoverListingCoverProps) {
  const { t } = useTranslation();
  const cover = resolveListingCover({ listingId, spaceType, listingImageUrl });
  const categoryLabel = t(`spaces.findPlace.representativeCategory.${cover.category}`);
  const accessibilityLabel =
    cover.kind === 'representative'
      ? t('spaces.findPlace.representativeImageAria', { category: categoryLabel })
      : accessibilityName;

  return (
    <View style={[styles.wrap, style]}>
      <DiscoverListingImage
        source={cover.source}
        style={styles.fill}
        accessibilityLabel={accessibilityLabel}
      />
      {cover.kind === 'representative' ? (
        <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={styles.badgeText}>{t('spaces.findPlace.representativeImage')}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  badge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(15,23,42,0.72)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
