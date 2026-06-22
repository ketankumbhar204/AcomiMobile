import React, { useEffect, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { UUID } from '../../api/types';
import { Button } from '../ui/Button';
import { colors, radius, spacing, typography } from '../../theme';

type MealPollPaymentReviewModalProps = {
  visible: boolean;
  memberName: string;
  memberId: UUID;
  proofImageUrl?: string | null;
  reviewing?: boolean;
  onClose: () => void;
  onApprove: (memberId: UUID, approvalRemarks?: string) => void;
  onReject: (memberId: UUID, rejectionReason?: string) => void;
};

export function MealPollPaymentReviewModal({
  visible,
  memberName,
  memberId,
  proofImageUrl,
  reviewing = false,
  onClose,
  onApprove,
  onReject,
}: MealPollPaymentReviewModalProps) {
  const { t } = useTranslation();
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (visible) {
      setApprovalRemarks('');
      setRejectionReason('');
    }
  }, [visible, memberId]);

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('meals.poll.reviewPaymentTitle')}</Text>
          <Text style={styles.memberName}>{memberName}</Text>
          <Text style={styles.hint}>{t('meals.poll.reviewPaymentHint')}</Text>

          {proofImageUrl ? (
            <Image source={{ uri: proofImageUrl }} style={styles.preview} resizeMode="contain" />
          ) : (
            <Text style={styles.missing}>{t('meals.poll.noProofImage')}</Text>
          )}

          <TextInput
            style={styles.input}
            placeholder={t('meals.poll.approvalRemarksPlaceholder')}
            value={approvalRemarks}
            onChangeText={setApprovalRemarks}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder={t('meals.poll.rejectionReasonPlaceholder')}
            value={rejectionReason}
            onChangeText={setRejectionReason}
            multiline
          />

          <View style={styles.actions}>
            <Button
              label={t('meals.poll.approvePayment')}
              onPress={() => onApprove(memberId, approvalRemarks.trim() || undefined)}
              loading={reviewing}
              disabled={reviewing}
            />
            <Button
              label={t('meals.poll.rejectPayment')}
              variant="secondary"
              onPress={() => onReject(memberId, rejectionReason.trim() || undefined)}
              disabled={reviewing}
            />
            <Button label={t('common.cancel')} variant="ghost" onPress={onClose} disabled={reviewing} />
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
  memberName: { ...typography.bodyStrong, fontSize: 16 },
  hint: { ...typography.body, color: colors.muted, lineHeight: 22 },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
  },
  missing: { ...typography.body, color: colors.muted, fontStyle: 'italic' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
    textAlignVertical: 'top',
    ...typography.body,
    backgroundColor: colors.white,
  },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
});
