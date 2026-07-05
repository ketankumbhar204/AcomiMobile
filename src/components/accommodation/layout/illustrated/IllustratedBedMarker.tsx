import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { AccommodationStatus } from '../../../../api/types';
import { colors, typography } from '../../../../theme';
import { StatusDot } from '../StatusDot';
import { getBedSpriteForStatus } from './spriteAssets';

type IllustratedBedMarkerProps = {
  label: string;
  status: AccommodationStatus;
};

/** Compact bed marker for room interior floor plans. */
export function IllustratedBedMarker({ label, status }: IllustratedBedMarkerProps) {
  return (
    <View style={styles.row}>
      <View style={styles.bedWrap}>
        <Image
          source={getBedSpriteForStatus(status)}
          style={styles.bedImg}
          resizeMode="contain"
        />
        <Text style={styles.letter}>{label}</Text>
      </View>
      <StatusDot status={status} size={9} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginVertical: 1,
  },
  bedWrap: {
    width: 36,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bedImg: {
    width: 36,
    height: 46,
    position: 'absolute',
  },
  letter: {
    ...typography.bodyStrong,
    fontSize: 11,
    color: colors.textPrimary,
    zIndex: 1,
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});
