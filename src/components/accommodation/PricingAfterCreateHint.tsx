import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CircleDollarSign } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';

type PricingAfterCreateHintProps = {
  /** i18n key under accommodation.pricingHints.* */
  entityKey: 'unit' | 'room' | 'bed';
};

/**
 * Shown on create forms when rent/deposit are only available after save (edit).
 */
export function PricingAfterCreateHint({ entityKey }: PricingAfterCreateHintProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <View style={styles.iconWrap}>
        <CircleDollarSign size={18} color={colors.primaryDark} strokeWidth={2.2} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{t('accommodation.pricingHints.title')}</Text>
        <Text style={styles.body}>{t(`accommodation.pricingHints.${entityKey}`)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  title: { ...typography.bodyStrong, color: colors.primaryDark },
  body: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
});
