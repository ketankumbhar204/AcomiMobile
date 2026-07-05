import React, { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PaymentRejectionReason, SpacePaymentResponse } from '../../api/types';
import { Button } from '../ui/Button';
import { colors, radius, spacing, typography } from '../../theme';
import { formatPaymentAmount } from '../../utils/paymentHistory';

const REJECTION_REASONS: PaymentRejectionReason[] = [
  'PAYMENT_AMOUNT_MISMATCH',
  'WRONG_SCREENSHOT',
  'INVALID_UTR',
  'OTHER',
];

type PaymentApprovalCardProps = {
  payment: SpacePaymentResponse;
  reviewing?: boolean;
  onApprove: () => void;
  onReject: (code: PaymentRejectionReason, reason?: string) => void;
};

export function PaymentApprovalCard({
  payment,
  reviewing = false,
  onApprove,
  onReject,
}: PaymentApprovalCardProps) {
  const { t } = useTranslation();
  const [rejectVisible, setRejectVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<PaymentRejectionReason | null>(null);

  const handleRejectConfirm = () => {
    if (!selectedReason) {
      return;
    }
    const label = t(`paymentCollection.rejection.${selectedReason}`);
    onReject(selectedReason, label);
    setRejectVisible(false);
    setSelectedReason(null);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.memberName}>{payment.memberName}</Text>
      {payment.targetLabel ? <Text style={styles.target}>{payment.targetLabel}</Text> : null}
      <Text style={styles.title}>{payment.title}</Text>
      <Text style={styles.amount}>{formatPaymentAmount(payment.amount, payment.currencyCode)}</Text>

      {payment.proofUrl ? (
        <Image source={{ uri: payment.proofUrl }} style={styles.preview} resizeMode="contain" />
      ) : null}

      {payment.referenceNumber ? (
        <Text style={styles.meta}>
          {t('paymentCollection.approval.utr')}: {payment.referenceNumber}
        </Text>
      ) : null}
      {payment.paymentMethod ? (
        <Text style={styles.meta}>
          {t('paymentCollection.approval.method')}: {t(`paymentCollection.method.${payment.paymentMethod}`)}
        </Text>
      ) : null}
      {payment.remarks ? <Text style={styles.meta}>{payment.remarks}</Text> : null}

      <View style={styles.actions}>
        <Button label={t('paymentCollection.approval.approve')} onPress={onApprove} loading={reviewing} />
        <Button
          label={t('paymentCollection.approval.reject')}
          variant="secondary"
          onPress={() => setRejectVisible(true)}
          disabled={reviewing}
        />
      </View>

      <Modal visible={rejectVisible} transparent animationType="fade" onRequestClose={() => setRejectVisible(false)}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberName: { ...typography.bodyStrong, fontSize: 16 },
  target: { ...typography.caption, color: colors.muted, marginTop: spacing.xs },
  title: { ...typography.h3, marginTop: spacing.sm },
  amount: { ...typography.bodyStrong, fontSize: 20, marginTop: spacing.xs, marginBottom: spacing.md },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  meta: { ...typography.body, color: colors.muted, marginBottom: spacing.xs },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  rejectSheet: {
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
    backgroundColor: '#EEF2FF',
  },
  reasonText: { ...typography.body },
  rejectActions: { gap: spacing.sm, marginTop: spacing.md },
});
