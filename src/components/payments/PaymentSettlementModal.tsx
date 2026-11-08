import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import type { PaymentSettlementAction, SpacePaymentResponse } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { remainingRefundableAmount } from '../../utils/paymentStatus';
import {
  formatPaymentListTitle,
  resolveSettlementAmounts,
} from '../../utils/paymentRefundDisplay';
import { Button } from '../ui';

type SettleAction = Exclude<PaymentSettlementAction, 'CANCEL_UNPAID'>;

export type PaymentSettlementSubmit = {
  action: SettleAction;
  refundAmount?: number | null;
  retainedAmount?: number | null;
  reason: string;
};

type Props = {
  visible: boolean;
  payment: SpacePaymentResponse | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (body: PaymentSettlementSubmit) => void;
};

const ACTIONS: SettleAction[] = ['FULL_REFUND', 'PARTIAL_REFUND', 'RETAIN'];

export function PaymentSettlementModal({
  visible,
  payment,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useTranslation();

  const actionLabel = (item: SettleAction) => {
    if (item === 'FULL_REFUND') {
      return t('payments.settle.fullRefund', { defaultValue: 'Full refund' });
    }
    if (item === 'PARTIAL_REFUND') {
      return t('payments.settle.partialRefund', { defaultValue: 'Partial refund' });
    }
    return t('payments.settle.retain', { defaultValue: 'Retain amount' });
  };
  const refundable = useMemo(
    () => (payment ? remainingRefundableAmount(payment) : 0),
    [payment],
  );
  const [action, setAction] = useState<SettleAction>('FULL_REFUND');
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const amounts = useMemo(
    () => resolveSettlementAmounts(action, refundable, refundAmount),
    [action, refundAmount, refundable],
  );

  useEffect(() => {
    if (!visible || !payment) {
      return;
    }
    setAction('FULL_REFUND');
    setRefundAmount('');
    setReason('');
    setError(null);
  }, [payment, visible]);

  const handleConfirm = () => {
    if (!payment) {
      return;
    }
    if (!reason.trim()) {
      setError(t('payments.settle.reasonRequired', { defaultValue: 'Reason is required' }));
      return;
    }
    if (action === 'PARTIAL_REFUND') {
      const raw = Number(refundAmount);
      if (!Number.isFinite(raw) || raw <= 0 || raw > refundable + 0.0001) {
        setError(
          t('payments.settle.invalidRefundAmount', {
            defaultValue:
              'Refund amount must be greater than 0 and within the remaining refundable amount',
          }),
        );
        return;
      }
    }
    if (amounts.refundAmount + amounts.retainedAmount > refundable + 0.0001) {
      setError(
        t('payments.settle.invalidRefundAmount', {
          defaultValue:
            'Refund amount must be greater than 0 and within the remaining refundable amount',
        }),
      );
      return;
    }
    if (amounts.refundAmount + amounts.retainedAmount <= 0) {
      setError(
        t('payments.settle.invalidRefundAmount', {
          defaultValue:
            'Refund amount must be greater than 0 and within the remaining refundable amount',
        }),
      );
      return;
    }
    setError(null);
    onSubmit({
      action,
      refundAmount: amounts.refundAmount > 0 ? amounts.refundAmount : null,
      retainedAmount: amounts.retainedAmount > 0 ? amounts.retainedAmount : null,
      reason: reason.trim(),
    });
  };

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
            <Text style={styles.title}>
              {t('payments.settle.title', { defaultValue: 'Settle collected payment' })}
            </Text>
            <Pressable
              onPress={onClose}
              disabled={loading}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', { defaultValue: 'Close' })}>
              <X size={18} color={colors.muted} strokeWidth={2.2} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {payment ? (
              <View style={styles.summary}>
                <Text style={styles.member}>{payment.memberName}</Text>
                <Text style={styles.line}>
                  {formatPaymentListTitle(payment)} · ₹
                  {Number(payment.amount).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.line}>
                  {t('payments.settle.collected', {
                    defaultValue: 'Collected: ₹{{amount}}',
                    amount: Number(payment.paidAmount ?? payment.amount).toLocaleString('en-IN'),
                  })}
                </Text>
                <Text style={styles.line}>
                  {t('payments.settle.alreadyRefunded', {
                    defaultValue: 'Already refunded: ₹{{amount}}',
                    amount: Number(payment.refundedAmount ?? 0).toLocaleString('en-IN'),
                  })}
                </Text>
                <Text style={styles.line}>
                  {t('payments.settle.remainingRefundable', {
                    defaultValue: 'Remaining refundable: ₹{{amount}}',
                    amount: refundable.toLocaleString('en-IN'),
                  })}
                </Text>
              </View>
            ) : null}

            <Text style={styles.notice}>
              {t('payments.settle.recordNotice', {
                defaultValue:
                  'This records a completed refund or retention in ACOMI after you confirm money was returned or kept. It does not send a bank/UPI payout.',
              })}
            </Text>

            <Text style={styles.label}>
              {t('payments.settle.action', { defaultValue: 'Action' })}
            </Text>
            <View style={styles.actionRow}>
              {ACTIONS.map(item => {
                const selected = action === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setAction(item);
                      setRefundAmount('');
                      setError(null);
                    }}
                    style={[styles.chip, selected ? styles.chipSelected : null]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}>
                    <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                      {actionLabel(item)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {action === 'PARTIAL_REFUND' ? (
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={refundAmount}
                onChangeText={setRefundAmount}
                placeholder={t('payments.settle.refundAmount', {
                  defaultValue: 'Refund amount',
                })}
                placeholderTextColor={colors.muted}
              />
            ) : null}

            <View style={styles.breakdown}>
              <Text style={styles.line}>
                {t('payments.settle.refundNow', {
                  defaultValue: 'Refund now: ₹{{amount}}',
                  amount: amounts.refundAmount.toLocaleString('en-IN'),
                })}
              </Text>
              <Text style={styles.line}>
                {t('payments.settle.retainedNow', {
                  defaultValue: 'Retained now: ₹{{amount}}',
                  amount: amounts.retainedAmount.toLocaleString('en-IN'),
                })}
              </Text>
              <Text style={styles.retainHint}>
                {t('payments.settle.retainedHint', {
                  defaultValue:
                    'Retained amount is money you keep (not returned). For partial refund it is calculated automatically.',
                })}
              </Text>
            </View>

            <TextInput
              style={[styles.input, styles.reasonInput]}
              value={reason}
              onChangeText={setReason}
              multiline
              placeholder={t('payments.settle.reason', { defaultValue: 'Reason' })}
              placeholderTextColor={colors.muted}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <Button
              label={t('common.back', { defaultValue: 'Back' })}
              variant="ghost"
              onPress={onClose}
              disabled={loading}
              style={styles.actionBtn}
            />
            <Button
              label={t('payments.settle.confirm', { defaultValue: 'Record settlement' })}
              onPress={handleConfirm}
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
    maxHeight: '88%',
    ...shadows.raised,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  summary: {
    gap: 2,
  },
  breakdown: {
    gap: 2,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.input,
    padding: spacing.sm,
  },
  retainHint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
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
  notice: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.input,
    padding: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  chipSelected: {
    borderColor: colors.teal,
    backgroundColor: '#ECFDF5',
  },
  chipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.teal,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  reasonInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
});

type CancelProps = {
  visible: boolean;
  payment: SpacePaymentResponse | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

export function PaymentCancelUnpaidModal({
  visible,
  payment,
  loading = false,
  onClose,
  onSubmit,
}: CancelProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setReason('');
    setRemarks('');
    setError(null);
  }, [visible]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError(t('payments.settle.reasonRequired', { defaultValue: 'Reason is required' }));
      return;
    }
    const remarksTrimmed = remarks.trim();
    onSubmit(
      remarksTrimmed ? `${reason.trim()} — ${remarksTrimmed}` : reason.trim(),
    );
  };

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
            <Text style={styles.title}>
              {t('payments.settle.cancelUnpaid', { defaultValue: 'Cancel payment' })}
            </Text>
            <Pressable
              onPress={onClose}
              disabled={loading}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', { defaultValue: 'Close' })}>
              <X size={18} color={colors.muted} strokeWidth={2.2} />
            </Pressable>
          </View>
          {payment ? (
            <Text style={styles.line}>
              {payment.title} · ₹{Number(payment.amount).toLocaleString('en-IN')}
            </Text>
          ) : null}
          <Text style={[styles.notice, { marginTop: spacing.sm }]}>
            {t('payments.settle.cancelConfirm', {
              defaultValue: 'Cancel this unpaid obligation? History is kept.',
            })}
          </Text>
          <TextInput
            style={[styles.input, { marginTop: spacing.sm }]}
            value={reason}
            onChangeText={setReason}
            placeholder={t('payments.settle.cancelReason', {
              defaultValue: 'Cancellation reason',
            })}
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={[styles.input, styles.reasonInput, { marginTop: spacing.sm }]}
            value={remarks}
            onChangeText={setRemarks}
            multiline
            placeholder={t('payments.settle.cancelRemarks', {
              defaultValue: 'Remarks (optional)',
            })}
            placeholderTextColor={colors.muted}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button
              label={t('common.back', { defaultValue: 'Back' })}
              variant="ghost"
              onPress={onClose}
              disabled={loading}
              style={styles.actionBtn}
            />
            <Button
              label={t('payments.settle.confirmCancel', {
                defaultValue: 'Confirm cancellation',
              })}
              onPress={handleConfirm}
              loading={loading}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
