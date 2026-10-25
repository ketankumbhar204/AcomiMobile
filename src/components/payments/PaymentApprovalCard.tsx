import React, { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import type { PaymentRejectionReason, SpacePaymentResponse, SpaceType } from '../../api/types';
import { usePaymentStayTrail } from '../../hooks/usePaymentStayTrail';
import { StayTrailLine } from '../member/ContactAndStayMeta';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { colors, radius, spacing, typography } from '../../theme';
import { formatPaymentAmount, formatPaymentSubmittedAt } from '../../utils/paymentHistory';
import { resolvePaymentReferenceDisplay } from '../../utils/paymentReference';
import { PaymentProofPreviewModal } from './PaymentProofPreviewModal';
import { PaymentReferenceLabel } from './PaymentReferenceLabel';
import { PaymentReviewActions } from './PaymentReviewActions';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { PaymentStatusCardFrame } from './PaymentStatusCardFrame';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const stayLabel = usePaymentStayTrail(payment.spaceId, payment);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [messageExpanded, setMessageExpanded] = useState(false);
  const [proofPreviewVisible, setProofPreviewVisible] = useState(false);

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
          <StayTrailLine label={stayLabel} textStyle={styles.target} numberOfLines={1} />
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
        <View style={styles.detailsToggleRow}>
          <Text style={styles.detailsToggleLabel}>
            {detailsOpen
              ? t('paymentCollection.approval.hideDetails')
              : t('paymentCollection.approval.viewDetails')}
          </Text>
          {detailsOpen ? (
            <ChevronDown size={14} color={colors.primaryDark} strokeWidth={2.4} />
          ) : (
            <ChevronRight size={14} color={colors.primaryDark} strokeWidth={2.4} />
          )}
        </View>
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
          <View style={styles.detailsToggleRow}>
            <Text style={styles.openDetailLinkText}>
              {t('paymentCollection.detail.openFromReview')}
            </Text>
            <ChevronRight size={14} color={colors.primaryDark} strokeWidth={2.4} />
          </View>
        </Pressable>
      ) : null}

      {showActions ? (
        <PaymentReviewActions
          reviewing={reviewing}
          onApprove={onApprove}
          onReject={onReject}
          onRequestUpdate={onRequestUpdate}
        />
      ) : null}

      <PaymentProofPreviewModal
        visible={proofPreviewVisible}
        proofUrl={payment.proofUrl}
        fileId={payment.proofFileId}
        onClose={() => setProofPreviewVisible(false)}
      />
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
  detailsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
});
