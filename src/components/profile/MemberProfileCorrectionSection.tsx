import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, FormInput } from '../ui';
import { useMemberStore } from '../../store/memberStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { buildProfileCorrectionNote } from '../../utils/profileCorrection';
import { MemberSectionTitle } from '../member/MemberDetailRow';

type MemberProfileCorrectionSectionProps = {
  memberId: string;
  canRequest: boolean;
};

export function MemberProfileCorrectionSection({
  memberId,
  canRequest,
}: MemberProfileCorrectionSectionProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const loading = useMemberStore(state => state.loading);
  const addNote = useMemberStore(state => state.addNote);

  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!canRequest) {
    return null;
  }

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError(t('membership.profileCorrection.messageRequired'));
      return;
    }

    const created = await addNote(memberId, {
      note: buildProfileCorrectionNote(trimmed),
    });
    if (created) {
      showToast(t('membership.profileCorrection.successToast'));
      setMessage('');
      setError(null);
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <MemberSectionTitle title={t('membership.profileCorrection.heading')} />
      <Card style={styles.card}>
        <Text style={styles.description}>{t('membership.profileCorrection.description')}</Text>
        <Button
          label={t('membership.profileCorrection.sendRequest')}
          variant="secondary"
          onPress={() => {
            setMessage('');
            setError(null);
            setModalVisible(true);
          }}
        />
      </Card>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={event => event.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('membership.profileCorrection.modalTitle')}</Text>
            <Text style={styles.modalHint}>{t('membership.profileCorrection.modalHint')}</Text>
            <FormInput
              label={t('membership.profileCorrection.messageLabel')}
              value={message}
              onChangeText={setMessage}
              placeholder={t('membership.profileCorrection.messagePlaceholder')}
              multiline
              numberOfLines={4}
              style={styles.messageInput}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                label={t('membership.profileCorrection.sendRequest')}
                onPress={() => void handleSend()}
                loading={loading}
                disabled={loading}
                style={styles.modalButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.md,
  },
  modalTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  modalHint: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  messageInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
});
