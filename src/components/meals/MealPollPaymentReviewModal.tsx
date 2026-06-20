import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
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
  onApprove: (memberId: UUID) => void;
  onReject: (memberId: UUID) => void;
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

          <View style={styles.actions}>
            <Button
              label={t('meals.poll.approvePayment')}
              onPress={() => onApprove(memberId)}
              loading={reviewing}
              disabled={reviewing}
            />
            <Button
              label={t('meals.poll.rejectPayment')}
              variant="secondary"
              onPress={() => onReject(memberId)}
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
    height: 280,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
  },
  missing: { ...typography.body, color: colors.muted, fontStyle: 'italic' },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
});
