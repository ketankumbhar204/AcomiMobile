import React, { useMemo, useState } from 'react';
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
import { Check, Pencil, CircleX } from 'lucide-react-native';
import type { PaymentRejectionReason, SpacePaymentResponse, SpaceType } from '../../api/types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { colors, radius, spacing, typography } from '../../theme';
import { formatPaymentAmount, formatPaymentSubmittedAt } from '../../utils/paymentHistory';
import { resolvePaymentReferenceDisplay } from '../../utils/paymentReference';
import { PaymentProofPreviewModal } from './PaymentProofPreviewModal';
import { PaymentReferenceLabel } from './PaymentReferenceLabel';
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

function memberInitial(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) {
    return '?';
  }
  return trimmed.charAt(0).toUpperCase();
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
  const paymentReference = resolvePaymentReferenceDisplay(payment);
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
  const initial = useMemo(() => memberInitial(payment.memberName), [payment.memberName]);

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
      <View style={styles.headerRow}>
        <View style={styles.avatar} accessibilityElementsHidden>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Pressable
          onPress={onOpenDetail}
          disabled={!onOpenDetail}
          style={styles.headerMain}
          accessibilityRole={onOpenDetail ? 'button' : undefined}
          accessibilityLabel={
            onOpenDetail ? t('paymentCollection.detail.openFromReview') : undefined
          }>
          <Text style={styles.memberName} numberOfLines={1}>
            {payment.memberName}
          </Text>
          {payment.targetLabel ? (
            <Text style={styles.target} numberOfLines={1}>
              {payment.targetLabel}
            </Text>
          ) : null}
          <Text style={styles.title} numberOfLines={2}>
            {titleDisplay}
          </Text>
        </Pressable>
        <PaymentStatusBadge status={payment.paymentStatus} style={styles.statusBadge} />
      </View>

      <Text style={styles.amount}>{formatPaymentAmount(payment.amount, payment.currencyCode)}</Text>
      <PaymentReferenceLabel source={payment} compact />

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
        <Text style={styles.detailsToggleLabel}>
          {detailsOpen
            ? t('paymentCollection.approval.hideDetails')
            : t('paymentCollection.approval.viewDetails')}
          {detailsOpen ? '' : ' ›'}
        </Text>
      </Pressable>

      {detailsOpen ? (
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('paymentCollection.approval.method')}</Text>
            <Text style={styles.detailValue}>{methodLabel}</Text>
          </View>
          {paymentReference ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {t('paymentCollection.detail.fields.paymentReference')}
              </Text>
              <Text style={[styles.detailValue, styles.detailValueReference]}>
                {paymentReference}
              </Text>
            </View>
          ) : null}
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
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 14,
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  memberName: {
    ...typography.bodyStrong,
    fontSize: 15,
  },
  target: {
    ...typography.caption,
    color: colors.muted,
  },
  title: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    flexShrink: 0,
    marginTop: 2,
  },
  amount: {
    ...typography.h3,
    fontSize: 22,
    lineHeight: 28,
    marginTop: spacing.sm,
  },
  metaLine: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  detailsToggle: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 32,
    justifyContent: 'center',
  },
  detailsTogglePressed: {
    opacity: 0.7,
  },
  detailsToggleLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  openDetailLink: {
    marginTop: spacing.xs,
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
    borderTopWidth: StyleSheet.hairlineWidth,
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
  detailValueReference: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontWeight: '700',
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
    backgroundColor: colors.lightGreen,
  },
  reasonText: { ...typography.body },
  rejectActions: { gap: spacing.sm, marginTop: spacing.md },
});
