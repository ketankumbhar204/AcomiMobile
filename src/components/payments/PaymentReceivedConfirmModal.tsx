import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import type { SpacePaymentResponse } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatPaymentAmount } from '../../utils/paymentHistory';
import { usePaymentStayTrail } from '../../hooks/usePaymentStayTrail';
import { StayTrailLine } from '../member/ContactAndStayMeta';
import { Button } from '../ui';

type PaymentReceivedConfirmModalProps = {
  visible: boolean;
  payments: SpacePaymentResponse[];
  spaceName?: string | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function periodLabel(month?: string | null): string | null {
  if (!month) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function ConfirmStayLine({ payment }: { payment: SpacePaymentResponse }) {
  const trail = usePaymentStayTrail(payment.spaceId, payment);
  return <StayTrailLine label={trail} textStyle={styles.line} />;
}

export function PaymentReceivedConfirmModal({
  visible,
  payments,
  spaceName,
  loading = false,
  onClose,
  onConfirm,
}: PaymentReceivedConfirmModalProps) {
  const { t } = useTranslation();
  const primary = payments[0];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('paymentCollection.received.title')}</Text>
            <Pressable
              onPress={onClose}
              disabled={loading}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', { defaultValue: 'Close' })}>
              <X size={18} color={colors.muted} strokeWidth={2.2} />
            </Pressable>
          </View>

          {primary ? (
            <View style={styles.summary}>
              <Text style={styles.member}>{primary.memberName}</Text>
              {spaceName ? <Text style={styles.line}>{spaceName}</Text> : null}
              {payments.map(payment => {
                const outstanding = payment.outstandingAmount ?? payment.amount;
                const period = periodLabel(payment.month);
                return (
                  <View key={payment.paymentId}>
                    <Text style={styles.line}>{payment.title}</Text>
                    <ConfirmStayLine payment={payment} textStyle={styles.line} />
                    {period ? <Text style={styles.line}>{period}</Text> : null}
                    <Text style={styles.line}>
                      {formatPaymentAmount(outstanding, payment.currencyCode)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          <Text style={styles.body}>{t('paymentCollection.received.skipProof')}</Text>

          <View style={styles.actions}>
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={onClose}
              disabled={loading}
              style={styles.actionBtn}
            />
            <Button
              label={t('paymentCollection.received.confirm')}
              onPress={onConfirm}
              loading={loading}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.raised,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
  },
  summary: {
    gap: 2,
    marginBottom: spacing.md,
  },
  member: {
    ...typography.bodyStrong,
    fontSize: 16,
  },
  line: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  target: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  body: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
