import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, CircleX, Pencil } from 'lucide-react-native';
import type { PaymentRejectionReason } from '../../api/types';
import { Button } from '../ui/Button';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { PaymentRequestUpdateModal } from './PaymentRequestUpdateModal';

const REJECTION_REASONS: PaymentRejectionReason[] = [
  'PAYMENT_AMOUNT_MISMATCH',
  'WRONG_SCREENSHOT',
  'INVALID_UTR',
  'OTHER',
];

type PaymentReviewActionsProps = {
  reviewing?: boolean;
  onApprove: () => void;
  onReject: (code: PaymentRejectionReason, reason?: string) => void;
  onRequestUpdate: (message: string) => void | Promise<void>;
};

/** Approve, needs-update, and reject — the same actions as the Payments under-review queue. */
export function PaymentReviewActions({
  reviewing = false,
  onApprove,
  onReject,
  onRequestUpdate,
}: PaymentReviewActionsProps) {
  const { t } = useTranslation();
  const [rejectVisible, setRejectVisible] = useState(false);
  const [requestUpdateVisible, setRequestUpdateVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<PaymentRejectionReason | null>(null);

  const handleRejectConfirm = () => {
    if (!selectedReason) {
      return;
    }
    onReject(selectedReason, t(`paymentCollection.rejection.${selectedReason}`));
    setRejectVisible(false);
    setSelectedReason(null);
  };

  const handleRequestUpdateConfirm = async (message: string) => {
    await onRequestUpdate(message);
    setRequestUpdateVisible(false);
  };

  return (
    <>
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.approveButton,
            pressed && !reviewing && styles.actionPressed,
            reviewing && styles.actionDisabled,
          ]}
          onPress={onApprove}
          disabled={reviewing}
          accessibilityRole="button"
          accessibilityLabel={t('paymentCollection.approval.approve')}>
          <Check size={16} color={colors.white} strokeWidth={2.6} />
          <Text style={styles.approveLabel} numberOfLines={1}>
            {t('paymentCollection.approval.approve')}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.requestUpdateButton,
            pressed && !reviewing && styles.actionPressed,
            reviewing && styles.actionDisabled,
          ]}
          onPress={() => setRequestUpdateVisible(true)}
          disabled={reviewing}
          accessibilityRole="button"
          accessibilityLabel={t('paymentCollection.approval.needsUpdateAction')}>
          <Pencil size={15} color="#C2410C" strokeWidth={2.2} />
          <Text style={styles.requestUpdateLabel} numberOfLines={1}>
            {t('paymentCollection.approval.needsUpdateAction')}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.rejectButton,
            pressed && !reviewing && styles.actionPressed,
            reviewing && styles.actionDisabled,
          ]}
          onPress={() => setRejectVisible(true)}
          disabled={reviewing}
          accessibilityRole="button"
          accessibilityLabel={t('paymentCollection.approval.reject')}>
          <CircleX size={16} color="#DC2626" strokeWidth={2.2} />
          <Text style={styles.rejectLabel} numberOfLines={1}>
            {t('paymentCollection.approval.reject')}
          </Text>
        </Pressable>
      </View>

      <PaymentRequestUpdateModal
        visible={requestUpdateVisible}
        reviewing={reviewing}
        onClose={() => setRequestUpdateVisible(false)}
        onConfirm={handleRequestUpdateConfirm}
      />

      <Modal
        visible={rejectVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.rejectSheet}>
            <Text style={styles.rejectTitle}>{t('paymentCollection.rejection.title')}</Text>
            {REJECTION_REASONS.map(reason => (
              <Pressable
                key={reason}
                style={[styles.reasonRow, selectedReason === reason && styles.reasonRowActive]}
                onPress={() => setSelectedReason(reason)}>
                <Text style={styles.reasonText}>{t(`paymentCollection.rejection.${reason}`)}</Text>
              </Pressable>
            ))}
            <View style={styles.rejectActions}>
              <Button
                label={t('paymentCollection.approval.reject')}
                variant="secondary"
                onPress={handleRejectConfirm}
                disabled={!selectedReason || reviewing}
              />
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setRejectVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  approveButton: {
    flex: 1.15,
    minHeight: 44,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  approveLabel: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.white,
  },
  requestUpdateButton: {
    flex: 1.2,
    minHeight: 44,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: '#F97316',
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: spacing.xs,
  },
  requestUpdateLabel: {
    ...typography.bodyStrong,
    fontSize: 12,
    color: '#C2410C',
  },
  rejectButton: {
    flex: 0.9,
    minHeight: 44,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
  },
  rejectLabel: {
    ...typography.bodyStrong,
    fontSize: 12,
    color: '#DC2626',
  },
  actionPressed: { opacity: 0.88 },
  actionDisabled: { opacity: 0.5 },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  rejectSheet: {
    ...shadows.raised,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  rejectTitle: { ...typography.h3, marginBottom: spacing.sm },
  reasonRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
  },
  reasonRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  reasonText: { ...typography.body },
  rejectActions: { gap: spacing.sm, marginTop: spacing.md },
});
