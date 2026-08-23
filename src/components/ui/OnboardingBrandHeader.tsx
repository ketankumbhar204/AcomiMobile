import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme';

/** Header mark + wordmark matching the onboarding Figma chrome. */
export function OnboardingBrandHeader() {
  const { t } = useTranslation();

  return (
    <View style={styles.row} accessibilityRole="header">
      <View style={styles.mark}>
        <Text style={styles.markLetter}>A</Text>
      </View>
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
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    includeFontPadding: false,
  },
  wordmark: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
    includeFontPadding: false,
  },
});
