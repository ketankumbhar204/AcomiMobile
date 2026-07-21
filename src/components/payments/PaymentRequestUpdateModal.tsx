import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { colors, radius, spacing, typography } from '../../theme';

type PaymentRequestUpdateModalProps = {
  visible: boolean;
  reviewing?: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void | Promise<void>;
};

export function PaymentRequestUpdateModal({
  visible,
  reviewing = false,
  onClose,
  onConfirm,
}: PaymentRequestUpdateModalProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  const handleConfirm = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }
    void Promise.resolve(onConfirm(trimmed)).then(() => {
      setMessage('');
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('paymentCollection.requestUpdate.title')}</Text>
          <Text style={styles.hint}>{t('paymentCollection.requestUpdate.hint')}</Text>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder={t('paymentCollection.requestUpdate.placeholder')}
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            editable={!reviewing}
          />
          <View style={styles.actions}>
            <Button
              label={t('paymentCollection.approval.requestUpdate')}
              onPress={handleConfirm}
              loading={reviewing}
              disabled={!message.trim()}
              style={styles.requestButton}
            />
            <Button label={t('common.cancel')} variant="ghost" onPress={handleClose} disabled={reviewing} />
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
    gap: spacing.sm,
  },
  title: { ...typography.h3 },
  hint: { ...typography.body, color: colors.muted, marginBottom: spacing.sm },
  input: {
    ...typography.body,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  requestButton: {
    backgroundColor: '#EA580C',
  },
});
