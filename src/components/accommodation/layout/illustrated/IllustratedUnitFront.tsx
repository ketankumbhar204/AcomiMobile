import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { AccommodationStatus } from '../../../../api/types';
import { typography } from '../../../../theme';
import { getAccommodationSprite } from './spriteAssets';
import { statusFacadeFill } from './layoutStatusUtils';

type IllustratedUnitFrontProps = {
  label: string;
  status: AccommodationStatus;
};

export function IllustratedUnitFront({ label, status }: IllustratedUnitFrontProps) {
  return (
    <View style={[styles.unit, { backgroundColor: statusFacadeFill(status) }]}>
      <View style={styles.numberPlate}>
        <Text style={styles.number} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Image
        source={getAccommodationSprite('doorFront')}
        style={styles.door}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  unit: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    minHeight: 72,
  },
  numberPlate: {
    position: 'absolute',
    top: 6,
    backgroundColor: '#333333',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    maxWidth: '90%',
  },
  number: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
  },
  door: {
    width: 28,
    height: 38,
  },
});
