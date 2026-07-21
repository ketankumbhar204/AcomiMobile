import React, { useState } from 'react';
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PaymentRejectionReason, SpacePaymentResponse, SpaceType } from '../../api/types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { colors, radius, spacing, typography } from '../../theme';
import { formatPaymentAmount, formatPaymentSubmittedAt } from '../../utils/paymentHistory';
import { PaymentProofPreviewModal } from './PaymentProofPreviewModal';
import { PaymentRequestUpdateModal } from './PaymentRequestUpdateModal';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { PaymentStatusCardFrame } from './PaymentStatusCardFrame';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const REJECTION_REASONS: PaymentRejectionReason[] = [
  'PAYMENT_AMOUNT_MISMATCH',
  'WRONG_SCREENSHOT',
  'INVALID_UTR',
  'OTHER',
];

const MESSAGE_COLLAPSE_CHARS = 120;

type PaymentApprovalCardProps = {
  payment: SpacePaymentResponse;
  reviewing?: boolean;
  showActions?: boolean;
  /** Drives payer wording: Customer on Mess, Tenant on PG/Hostel. */
  spaceType?: SpaceType;
  onApprove: () => void;
  onReject: (code: PaymentRejectionReason, reason?: string) => void;
  onRequestUpdate: (message: string) => void | Promise<void>;
  /** Opens the shared Payment Details screen (does not change review actions). */
  onOpenDetail?: () => void;
};

function payerMessageLabelKey(spaceType?: SpaceType): string {
  return spaceType === 'MESS'
    ? 'paymentCollection.approval.customerMessage'
    : 'paymentCollection.approval.tenantMessage';
}

/** Display-only: normalize title separators for the compact header. */
function compactPaymentTitle(title: string): string {
  return title.replace(/\s*[—–-]\s*/g, ' • ');
}

function animateLayout() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

export function PaymentApprovalCard({
  payment,
  reviewing = false,
  showActions = true,
  spaceType,
  onApprove,
  onReject,
  onRequestUpdate,
  onOpenDetail,
}: PaymentApprovalCardProps) {
  const { t } = useTranslation();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [messageExpanded, setMessageExpanded] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [requestUpdateVisible, setRequestUpdateVisible] = useState(false);
  const [proofPreviewVisible, setProofPreviewVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<PaymentRejectionReason | null>(null);

  const methodLabel = payment.paymentMethod
    ? t(`paymentCollection.method.${payment.paymentMethod}`)
    : t('paymentCollection.approval.methodUnknown');
  const utrValue = payment.referenceNumber?.trim() || null;
  const hasProofScreenshot = Boolean(payment.proofUrl);
  const payerMessageLabel = t(payerMessageLabelKey(spaceType));
  const submittedLabel = formatPaymentSubmittedAt(payment.updatedAt);
  const titleDisplay = compactPaymentTitle(payment.title);
  const remarks = payment.remarks?.trim() || '';
  const remarksLong = remarks.length > MESSAGE_COLLAPSE_CHARS;
  const remarksDisplay =
    remarksLong && !messageExpanded
      ? `${remarks.slice(0, MESSAGE_COLLAPSE_CHARS).trimEnd()}…`
      : remarks;
  const ownerRequest =
    payment.paymentStatus === 'UPDATE_REQUESTED' && payment.rejectionReason
      ? payment.rejectionReason
      : null;

  const toggleDetails = () => {
    animateLayout();
    setDetailsOpen(open => !open);
  };

  const handleRejectConfirm = () => {
    if (!selectedReason) {
      return;
    }
    const label = t(`paymentCollection.rejection.${selectedReason}`);
    onReject(selectedReason, label);
    setRejectVisible(false);
    setSelectedReason(null);
  };

  const handleRequestUpdateConfirm = async (message: string) => {
    await onRequestUpdate(message);
    setRequestUpdateVisible(false);
  };

  return (
    <PaymentStatusCardFrame status={payment.paymentStatus} style={styles.card}>
      <Pressable
        onPress={onOpenDetail}
        disabled={!onOpenDetail}
        accessibilityRole={onOpenDetail ? 'button' : undefined}
        accessibilityLabel={
          onOpenDetail ? t('paymentCollection.detail.openFromReview') : undefined
        }>
        <Text style={styles.memberName} numberOfLines={1}>
          {payment.memberName}
        </Text>
      </Pressable>
      {payment.targetLabel ? (
        <Text style={styles.target} numberOfLines={1}>
          {payment.targetLabel}
        </Text>
      ) : null}
      <Text style={styles.title} numberOfLines={2}>
        {titleDisplay}
      </Text>

      <View style={styles.amountRow}>
        <Text style={styles.amount}>{formatPaymentAmount(payment.amount, payment.currencyCode)}</Text>
        <PaymentStatusBadge status={payment.paymentStatus} />
      </View>

      <Text style={styles.metaLine} numberOfLines={1}>
        {methodLabel}
        {' • '}
        {t('paymentCollection.approval.submitted')} {submittedLabel}
      </Text>

      <Pressable
        onPress={toggleDetails}
        style={({ pressed }) => [styles.detailsToggle, pressed && styles.detailsTogglePressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: detailsOpen }}
        accessibilityLabel={
          detailsOpen
            ? t('paymentCollection.approval.hideDetails')
            : t('paymentCollection.approval.viewDetails')
        }>
        <Text style={styles.detailsChevron}>{detailsOpen ? '▲' : '▼'}</Text>
        <Text style={styles.detailsToggleLabel}>
          {detailsOpen
            ? t('paymentCollection.approval.hideDetails')
            : t('paymentCollection.approval.viewDetails')}
        </Text>
      </Pressable>

      {detailsOpen ? (
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('paymentCollection.approval.method')}</Text>
            <Text style={styles.detailValue}>{methodLabel}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('paymentCollection.approval.utr')}</Text>
            <Text style={styles.detailValue}>
              {utrValue || t('paymentCollection.approval.utrMissing')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('paymentCollection.approval.submitted')}</Text>
            <Text style={styles.detailValue}>{submittedLabel}</Text>
          </View>

          {ownerRequest ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageLabel}>{t('paymentCollection.ownerRequest')}</Text>
              <Text style={styles.messageText}>{ownerRequest}</Text>
            </View>
          ) : null}

          {remarks ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageLabel}>{payerMessageLabel}</Text>
              <Text style={styles.messageText}>{remarksDisplay}</Text>
              {remarksLong ? (
                <Pressable
                  onPress={() => {
                    animateLayout();
                    setMessageExpanded(open => !open);
                  }}
                  hitSlop={8}
                  accessibilityRole="button">
                  <Text style={styles.showMoreLabel}>
                    {messageExpanded
                      ? t('paymentCollection.approval.showLess')
                      : t('paymentCollection.approval.showMore')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {hasProofScreenshot ? (
            <View style={styles.proofSection}>
              <Badge label={t('paymentCollection.approval.proofUploaded')} />
              <Text style={styles.proofHint}>{t('paymentCollection.approval.screenshotUploaded')}</Text>
              <Button
                label={t('paymentCollection.approval.viewScreenshot')}
                variant="secondary"
                onPress={() => setProofPreviewVisible(true)}
                style={styles.proofButton}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {onOpenDetail ? (
        <Pressable
          onPress={onOpenDetail}
          style={({ pressed }) => [styles.openDetailLink, pressed && styles.detailsTogglePressed]}
          accessibilityRole="button"
          accessibilityLabel={t('paymentCollection.detail.openFromReview')}>
          <Text style={styles.openDetailLinkText}>
            {t('paymentCollection.detail.openFromReview')} ›
          </Text>
        </Pressable>
      ) : null}

      {showActions ? (
        <View style={styles.actionsRow}>
          <Button
            label={t('paymentCollection.approval.approve')}
            onPress={onApprove}
            loading={reviewing}
            style={styles.actionButton}
          />
          <Pressable
            style={({ pressed }) => [
              styles.requestUpdateButton,
              pressed && !reviewing && styles.requestUpdatePressed,
              reviewing && styles.requestUpdateDisabled,
            ]}
            onPress={() => setRequestUpdateVisible(true)}
            disabled={reviewing}
            accessibilityRole="button"
            accessibilityLabel={t('paymentCollection.approval.needsUpdateAction')}>
            <Text style={styles.requestUpdateLabel} numberOfLines={1}>
              {t('paymentCollection.approval.needsUpdateAction')}
            </Text>
          </Pressable>
          <Button
            label={t('paymentCollection.approval.reject')}
            variant="secondary"
            onPress={() => setRejectVisible(true)}
            disabled={reviewing}
            style={styles.actionButton}
          />
        </View>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  memberName: {
    ...typography.bodyStrong,
    fontSize: 15,
  },
  target: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  amount: {
    ...typography.bodyStrong,
    fontSize: 22,
    flexShrink: 1,
  },
  metaLine: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 36,
  },
  detailsTogglePressed: {
    opacity: 0.7,
  },
  detailsChevron: {
    ...typography.caption,
    color: colors.primaryDark,
    fontSize: 11,
  },
  detailsToggleLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  openDetailLink: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  openDetailLinkText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  detailsSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  detailValue: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  messageBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  messageLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  messageText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  showMoreLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  proofSection: {
    gap: spacing.xs,
  },
  proofHint: {
    ...typography.caption,
    color: colors.muted,
  },
  proofButton: {
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  requestUpdateButton: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    minHeight: 44,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: '#FDBA74',
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  requestUpdatePressed: { opacity: 0.85 },
  requestUpdateDisabled: { opacity: 0.5 },
  requestUpdateLabel: {
    ...typography.bodyStrong,
    fontSize: 13,
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
