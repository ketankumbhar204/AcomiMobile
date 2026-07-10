import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PaymentRejectionReason, SpacePaymentResponse } from '../../api/types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { colors, radius, spacing, typography } from '../../theme';
import { formatPaymentAmount, formatPaymentSubmittedAt } from '../../utils/paymentHistory';
import { PaymentProofPreviewModal } from './PaymentProofPreviewModal';
import { PaymentRequestUpdateModal } from './PaymentRequestUpdateModal';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { PaymentStatusCardFrame } from './PaymentStatusCardFrame';

const REJECTION_REASONS: PaymentRejectionReason[] = [
  'PAYMENT_AMOUNT_MISMATCH',
  'WRONG_SCREENSHOT',
  'INVALID_UTR',
  'OTHER',
];

type PaymentApprovalCardProps = {
  payment: SpacePaymentResponse;
  reviewing?: boolean;
  showActions?: boolean;
  onApprove: () => void;
  onReject: (code: PaymentRejectionReason, reason?: string) => void;
  onRequestUpdate: (message: string) => void;
};

function CardDivider() {
  return <View style={styles.divider} />;
}

export function PaymentApprovalCard({
  payment,
  reviewing = false,
  showActions = true,
  onApprove,
  onReject,
  onRequestUpdate,
}: PaymentApprovalCardProps) {
  const { t } = useTranslation();
  const [rejectVisible, setRejectVisible] = useState(false);
  const [requestUpdateVisible, setRequestUpdateVisible] = useState(false);
  const [proofPreviewVisible, setProofPreviewVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<PaymentRejectionReason | null>(null);

  const methodLabel = payment.paymentMethod
    ? t(`paymentCollection.method.${payment.paymentMethod}`)
    : t('paymentCollection.approval.methodUnknown');
  const utrLabel = payment.referenceNumber?.trim() || t('paymentCollection.approval.utrMissing');
  const hasProofScreenshot = Boolean(payment.proofUrl);

  const handleRejectConfirm = () => {
    if (!selectedReason) {
      return;
    }
    const label = t(`paymentCollection.rejection.${selectedReason}`);
    onReject(selectedReason, label);
    setRejectVisible(false);
    setSelectedReason(null);
  };

  const handleRequestUpdateConfirm = (message: string) => {
    onRequestUpdate(message);
    setRequestUpdateVisible(false);
  };

  return (
    <PaymentStatusCardFrame status={payment.paymentStatus} style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.memberName} numberOfLines={1}>
          {payment.memberName}
        </Text>
        <PaymentStatusBadge status={payment.paymentStatus} />
      </View>
      {payment.targetLabel ? <Text style={styles.target}>{payment.targetLabel}</Text> : null}
      <Text style={styles.title}>{payment.title}</Text>
      <Text style={styles.amount}>{formatPaymentAmount(payment.amount, payment.currencyCode)}</Text>

      <Text style={styles.meta}>
        {t('paymentCollection.approval.method')}: {methodLabel}
      </Text>
      <Text style={styles.meta}>
        {t('paymentCollection.approval.utr')}: {utrLabel}
      </Text>
      <Text style={styles.meta}>
        {t('paymentCollection.approval.submitted')}: {formatPaymentSubmittedAt(payment.updatedAt)}
      </Text>

      {hasProofScreenshot ? (
        <>
          <CardDivider />
          <View style={styles.proofSection}>
            <Badge label={t('paymentCollection.approval.proofUploaded')} />
            <Text style={styles.proofHint}>{t('paymentCollection.approval.screenshotUploaded')}</Text>
            {payment.referenceNumber ? (
              <Text style={styles.proofMeta}>
                {t('paymentCollection.approval.utr')}: {payment.referenceNumber}
              </Text>
            ) : null}
            <Button
              label={t('paymentCollection.approval.viewScreenshot')}
              variant="secondary"
              onPress={() => setProofPreviewVisible(true)}
            />
          </View>
        </>
      ) : null}

      {payment.paymentStatus === 'UPDATE_REQUESTED' && payment.rejectionReason ? (
        <>
          <CardDivider />
          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>{t('paymentCollection.ownerRequest')}</Text>
            <Text style={styles.messageText}>{payment.rejectionReason}</Text>
          </View>
        </>
      ) : null}

      {payment.remarks ? (
        <>
          <CardDivider />
          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>{t('paymentCollection.approval.tenantMessage')}</Text>
            <Text style={styles.messageText}>{payment.remarks}</Text>
          </View>
        </>
      ) : null}

      {showActions ? (
        <>
          <CardDivider />
          <View style={styles.actions}>
            <Button label={t('paymentCollection.approval.approve')} onPress={onApprove} loading={reviewing} />
            <Pressable
              style={({ pressed }) => [
                styles.requestUpdateButton,
                pressed && !reviewing && styles.requestUpdatePressed,
                reviewing && styles.requestUpdateDisabled,
              ]}
              onPress={() => setRequestUpdateVisible(true)}
              disabled={reviewing}>
              <Text style={styles.requestUpdateLabel}>{t('paymentCollection.approval.requestUpdate')}</Text>
            </Pressable>
            <Button
              label={t('paymentCollection.approval.reject')}
              variant="secondary"
              onPress={() => setRejectVisible(true)}
              disabled={reviewing}
            />
          </View>
        </>
      ) : null}

      <PaymentProofPreviewModal
        visible={proofPreviewVisible}
        proofUrl={payment.proofUrl}
        onClose={() => setProofPreviewVisible(false)}
      />

      <PaymentRequestUpdateModal
        visible={requestUpdateVisible}
        reviewing={reviewing}
        onClose={() => setRequestUpdateVisible(false)}
        onConfirm={handleRequestUpdateConfirm}
      />

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
    </PaymentStatusCardFrame>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  memberName: { ...typography.bodyStrong, fontSize: 16, flex: 1, minWidth: 0, paddingRight: spacing.xs },
  target: { ...typography.caption, color: colors.muted, marginTop: spacing.xs },
  title: { ...typography.h3, marginTop: spacing.sm },
  amount: { ...typography.bodyStrong, fontSize: 20, marginTop: spacing.xs, marginBottom: spacing.md },
  meta: { ...typography.body, color: colors.muted, marginBottom: spacing.xs },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  proofSection: { gap: spacing.sm },
  proofHint: { ...typography.body, color: colors.muted },
  proofMeta: { ...typography.caption, color: colors.muted },
  messageBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  messageText: { ...typography.body, color: colors.textPrimary },
  actions: { gap: spacing.sm },
  requestUpdateButton: {
    minHeight: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: '#FDBA74',
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  requestUpdatePressed: { opacity: 0.85 },
  requestUpdateDisabled: { opacity: 0.5 },
  requestUpdateLabel: {
    ...typography.bodyStrong,
    color: '#C2410C',
  },
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
