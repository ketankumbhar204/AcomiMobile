import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme';

/** Header mark + wordmark matching the onboarding Figma chrome. */
export function OnboardingBrandHeader() {
  const { t } = useTranslation();

  return (
    <View style={styles.row} accessibilityRole="header">
      <Image
        source={require('../../assets/brand/icon-light.png')}
        style={styles.mark}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Text style={styles.wordmark}>{t('common.appName')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#000000',
  },
  wordmark: {
    color: colors.teal,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
    includeFontPadding: false,
  },
});
