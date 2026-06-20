import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { colors, radius, spacing, typography } from '../../theme';
import { pickPaymentProofImage } from '../../utils/pickPaymentProofImage';

type MealPollPaymentProofModalProps = {
  visible: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (proofImageBase64: string) => void;
};

export function MealPollPaymentProofModal({
  visible,
  submitting = false,
  onClose,
  onSubmit,
}: MealPollPaymentProofModalProps) {
  const { t } = useTranslation();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [proofImageBase64, setProofImageBase64] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const reset = () => {
    setPreviewUri(null);
    setProofImageBase64(null);
    setPicking(false);
  };

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
    onSubmit(proofImageBase64);
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('meals.poll.paymentProofTitle')}</Text>
          <Text style={styles.hint}>{t('meals.poll.paymentProofHint')}</Text>

          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="contain" />
          ) : (
            <Pressable style={styles.pickArea} onPress={() => void handlePickImage()} disabled={picking}>
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

          {previewUri ? (
            <Pressable onPress={() => void handlePickImage()} disabled={picking || submitting}>
              <Text style={styles.changeLink}>{t('meals.poll.changeScreenshot')}</Text>
            </Pressable>
          ) : null}

          <View style={styles.actions}>
            <Button
              label={t('meals.poll.submitProof')}
              onPress={handleSubmit}
              loading={submitting}
              disabled={!proofImageBase64 || submitting}
            />
            <Button label={t('common.cancel')} variant="ghost" onPress={handleClose} disabled={submitting} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
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
  actions: { gap: spacing.sm, marginTop: spacing.xs },
});
