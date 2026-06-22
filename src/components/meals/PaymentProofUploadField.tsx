import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';
import { pickPaymentProofImage } from '../../utils/pickPaymentProofImage';

type PaymentProofUploadFieldProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
};

export function PaymentProofUploadField({
  value,
  onChange,
  disabled = false,
}: PaymentProofUploadFieldProps) {
  const { t } = useTranslation();
  const [picking, setPicking] = useState(false);

  const handlePick = async () => {
    if (disabled || picking) {
      return;
    }
    setPicking(true);
    try {
      const dataUri = await pickPaymentProofImage();
      if (dataUri) {
        onChange(dataUri);
      }
    } finally {
      setPicking(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('meals.poll.paymentProofTitle')}</Text>
      <Text style={styles.hint}>{t('meals.subscription.customer.paymentProofHint')}</Text>

      {value ? (
        <>
          <Image source={{ uri: value }} style={styles.preview} resizeMode="contain" />
          <Pressable onPress={() => void handlePick()} disabled={disabled || picking}>
            <Text style={styles.changeLink}>{t('meals.poll.changeScreenshot')}</Text>
          </Pressable>
          <Pressable onPress={() => onChange(null)} disabled={disabled}>
            <Text style={styles.removeLink}>{t('meals.subscription.customer.removeScreenshot')}</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          style={[styles.pickArea, disabled && styles.pickAreaDisabled]}
          onPress={() => void handlePick()}
          disabled={disabled || picking}>
          {picking ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Text style={styles.pickIcon}>📷</Text>
              <Text style={styles.pickLabel}>{t('meals.poll.uploadScreenshot')}</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  pickArea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  pickAreaDisabled: {
    opacity: 0.5,
  },
  pickIcon: {
    fontSize: 28,
  },
  pickLabel: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeLink: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  removeLink: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xxs,
  },
});
