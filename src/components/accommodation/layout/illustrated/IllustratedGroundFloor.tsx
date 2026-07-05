import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { getAccommodationSprite } from './spriteAssets';

export function IllustratedGroundFloor() {
  return (
    <View style={styles.ground}>
      <View style={styles.lobby}>
        <View style={styles.sofaLeft} />
        <Image
          source={getAccommodationSprite('entranceDoors')}
          style={styles.entrance}
          resizeMode="contain"
        />
        <View style={styles.sofaRight} />
      </View>
      <View style={styles.plants}>
        <Image source={getAccommodationSprite('plantPot')} style={styles.plant} resizeMode="contain" />
        <Image source={getAccommodationSprite('plantPot')} style={styles.plant} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ground: {
    backgroundColor: '#e8e4dc',
    borderTopWidth: 2,
    borderTopColor: '#333333',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 64,
  },
  lobby: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  sofaLeft: {
    width: 36,
    height: 20,
    backgroundColor: '#a67c52',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  entrance: {
    width: 56,
    height: 44,
  },
  sofaRight: {
    width: 48,
    height: 22,
    backgroundColor: '#555555',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  plants: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  plant: {
    width: 20,
    height: 22,
  },
});
