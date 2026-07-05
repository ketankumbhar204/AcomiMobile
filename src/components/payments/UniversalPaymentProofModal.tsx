import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { UniversalPaymentMethod } from '../../api/types';
import { Button } from '../ui/Button';
import { colors, radius, spacing, typography } from '../../theme';
import { pickPaymentProofImage } from '../../utils/pickPaymentProofImage';

const PAYMENT_METHODS: UniversalPaymentMethod[] = [
  'UPI',
  'BANK_TRANSFER',
  'CASH',
  'CHEQUE',
  'OTHER',
];

export type UniversalPaymentProofPayload = {
  proofImageBase64: string;
  referenceNumber?: string;
  remarks?: string;
  paymentMethod?: UniversalPaymentMethod;
};

type UniversalPaymentProofModalProps = {
  visible: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: UniversalPaymentProofPayload) => void;
};

export function UniversalPaymentProofModal({
  visible,
  submitting = false,
  onClose,
  onSubmit,
}: UniversalPaymentProofModalProps) {
  const { t } = useTranslation();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [proofImageBase64, setProofImageBase64] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<UniversalPaymentMethod>('UPI');
  const [picking, setPicking] = useState(false);

  const reset = () => {
    setPreviewUri(null);
    setProofImageBase64(null);
    setReferenceNumber('');
    setRemarks('');
    setPaymentMethod('UPI');
    setPicking(false);
  };

  useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [visible]);

  const handleClose = () => {
    if (submitting) {
      return;
    }
    reset();
    onClose();
  };

  const handlePickImage = async () => {
    setPicking(true);
    try {
      const dataUri = await pickPaymentProofImage();
      if (dataUri) {
        setPreviewUri(dataUri);
        setProofImageBase64(dataUri);
      }
    } finally {
      setPicking(false);
    }
  };

  const handleSubmit = () => {
    if (!proofImageBase64 || submitting) {
      return;
    }
    onSubmit({
      proofImageBase64,
      referenceNumber: referenceNumber.trim() || undefined,
      remarks: remarks.trim() || undefined,
      paymentMethod,
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.sheet}>
            <Text style={styles.title}>{t('paymentCollection.proof.title')}</Text>
            <Text style={styles.hint}>{t('paymentCollection.proof.hint')}</Text>

            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="contain" />
            ) : (
              <Pressable
                style={styles.pickArea}
                onPress={() => void handlePickImage()}
                disabled={picking}>
                {picking ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Text style={styles.pickIcon}>📷</Text>
                    <Text style={styles.pickLabel}>{t('paymentCollection.proof.uploadScreenshot')}</Text>
                  </>
                )}
              </Pressable>
            )}

            {previewUri ? (
              <Pressable onPress={() => void handlePickImage()} disabled={picking || submitting}>
                <Text style={styles.changeLink}>{t('paymentCollection.proof.changeScreenshot')}</Text>
              </Pressable>
            ) : null}

            <Text style={styles.label}>{t('paymentCollection.proof.paymentMethod')}</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map(method => (
                <Pressable
                  key={method}
                  style={[styles.methodChip, paymentMethod === method && styles.methodChipActive]}
                  onPress={() => setPaymentMethod(method)}>
                  <Text
                    style={[
                      styles.methodChipText,
                      paymentMethod === method && styles.methodChipTextActive,
                    ]}>
                    {t(`paymentCollection.method.${method}`)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder={t('paymentCollection.proof.utrPlaceholder')}
              value={referenceNumber}
              onChangeText={setReferenceNumber}
              autoCapitalize="characters"
            />
            <TextInput
              style={[styles.input, styles.remarksInput]}
              placeholder={t('paymentCollection.proof.remarksPlaceholder')}
              value={remarks}
              onChangeText={setRemarks}
              multiline
            />

            <View style={styles.actions}>
              <Button
                label={t('paymentCollection.proof.submit')}
                onPress={handleSubmit}
                loading={submitting}
                disabled={!proofImageBase64 || submitting}
              />
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={handleClose}
                disabled={submitting}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { ...typography.h3 },
  hint: { ...typography.body, color: colors.muted, lineHeight: 22 },
  pickArea: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  pickIcon: { fontSize: 32 },
  pickLabel: { ...typography.bodyStrong, color: colors.primaryDark },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
  },
  changeLink: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  label: { ...typography.bodyStrong },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  methodChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  methodChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
  },
  methodChipText: {
    ...typography.caption,
    color: colors.muted,
  },
  methodChipTextActive: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    backgroundColor: colors.white,
  },
  remarksInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
});
