import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type PaymentReminderComposerProps = {
  visible: boolean;
  memberName: string;
  phone: string | null;
  message: string;
  notice: string;
  submitting: boolean;
  onChangeMessage: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function PaymentReminderComposer({
  visible,
  memberName,
  phone,
  message,
  notice,
  submitting,
  onChangeMessage,
  onCancel,
  onConfirm,
}: PaymentReminderComposerProps) {
  const { t } = useTranslation();
  const canConfirm = Boolean(message.trim()) && !submitting;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
          <Text style={styles.title}>
            {t('paymentCollection.reminder.composeTitle', { defaultValue: 'Send reminder' })}
          </Text>
          <Text style={styles.name}>{memberName}</Text>
          <TextInput
            value={message}
            onChangeText={onChangeMessage}
            multiline
            editable={!submitting}
            textAlignVertical="top"
            accessibilityLabel={t('spaces.findPlace.photoRequestMessage', { defaultValue: 'Message' })}
            style={styles.input}
          />
          {phone ? (
            <Text selectable style={styles.phone}>
              +{phone}
            </Text>
          ) : (
            <Text style={styles.notice}>
              {t('paymentCollection.reminder.whatsAppUnavailable', {
                defaultValue:
                  'This number can’t be opened in WhatsApp. You can still save the in-app reminder.',
              })}
            </Text>
          )}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={submitting}
              style={styles.cancel}
              accessibilityRole="button">
              <Text style={styles.cancelText}>{t('common.cancel', { defaultValue: 'Cancel' })}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={!canConfirm}
              style={[styles.confirm, !canConfirm && styles.confirmDisabled]}
              accessibilityRole="button">
              <Text style={styles.confirmText}>
                {t('paymentCollection.reminder.send', { defaultValue: 'Send reminder' })}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlayScrim },
  sheet: {
    ...shadows.raised,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  name: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  notice: { ...typography.caption, color: colors.textSecondary },
  phone: { ...typography.caption, color: colors.textSecondary },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  cancel: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  cancelText: { ...typography.body, fontWeight: '600', color: colors.textSecondary },
  confirm: {
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  confirmDisabled: { opacity: 0.5 },
  confirmText: { ...typography.body, fontWeight: '700', color: colors.white },
});
