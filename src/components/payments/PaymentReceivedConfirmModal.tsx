import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import type { SpacePaymentResponse } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatPaymentAmount } from '../../utils/paymentHistory';
import { Button } from '../ui';

type PaymentReceivedConfirmModalProps = {
  visible: boolean;
  payments: SpacePaymentResponse[];
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function PaymentReceivedConfirmModal({
  visible,
  payments,
  loading = false,
  onClose,
  onConfirm,
}: PaymentReceivedConfirmModalProps) {
  const { t } = useTranslation();
  const primary = payments[0];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
              {payments.map(payment => (
                <Text key={payment.paymentId} style={styles.line}>
                  {payment.title}
                  {' · '}
                  {formatPaymentAmount(payment.amount, payment.currencyCode)}
                </Text>
              ))}
              {primary.targetLabel ? (
                <Text style={styles.target}>{primary.targetLabel}</Text>
              ) : null}
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.md,
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
