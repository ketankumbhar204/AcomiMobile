import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { occupancyApi } from '../../api/occupancyApi';
import type {
  PaymentSettlementAction,
  ReservationCancellationPreviewPayment,
  ReservationPaymentSettlementDecision,
  UUID,
} from '../../api/types';
import { Button } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import { getOccupancyErrorMessage } from '../../utils/occupancyErrors';
import { resolveSettlementAmounts } from '../../utils/paymentRefundDisplay';

type DecisionState = {
  action: PaymentSettlementAction;
  refundAmount: string;
  reason: string;
};

type Props = {
  visible: boolean;
  spaceId: UUID;
  occupancyId: UUID | null;
  onClose: () => void;
  onCancelled: () => void;
};

function defaultAction(item: ReservationCancellationPreviewPayment): PaymentSettlementAction {
  if (item.allowedActions.includes('CANCEL_UNPAID')) {
    return 'CANCEL_UNPAID';
  }
  if (item.allowedActions.includes('FULL_REFUND')) {
    return 'FULL_REFUND';
  }
  return item.allowedActions[0] ?? 'RETAIN';
}

export function ReservationCancellationSettlementModal({
  visible,
  spaceId,
  occupancyId,
  onClose,
  onCancelled,
}: Props) {
  const { t } = useTranslation();

  const actionLabel = (action: PaymentSettlementAction) => {
    if (action === 'FULL_REFUND') {
      return t('payments.settle.fullRefund', { defaultValue: 'Full refund' });
    }
    if (action === 'PARTIAL_REFUND') {
      return t('payments.settle.partialRefund', { defaultValue: 'Partial refund' });
    }
    if (action === 'RETAIN') {
      return t('payments.settle.retain', { defaultValue: 'Retain amount' });
    }
    return t('payments.settle.cancelUnpaid', { defaultValue: 'Cancel unpaid' });
  };
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [payments, setPayments] = useState<ReservationCancellationPreviewPayment[]>([]);
  const [decisions, setDecisions] = useState<Record<string, DecisionState>>({});

  useEffect(() => {
    if (!visible || !occupancyId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    occupancyApi
      .previewReservationCancellation(spaceId, occupancyId)
      .then(preview => {
        if (cancelled) {
          return;
        }
        setPayments(preview.payments ?? []);
        const next: Record<string, DecisionState> = {};
        for (const item of preview.payments ?? []) {
          const action = defaultAction(item);
          next[item.paymentId] = {
            action,
            refundAmount: '',
            reason: '',
          };
        }
        setDecisions(next);
      })
      .catch(err => {
        if (!cancelled) {
          setError(getOccupancyErrorMessage(err, 'occupancy.errors.cancelReservation'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [occupancyId, spaceId, visible]);

  const collectedCount = useMemo(
    () => payments.filter(p => p.collected && (p.refundableAmount ?? 0) > 0).length,
    [payments],
  );

  const handleConfirm = async () => {
    if (!occupancyId) {
      return;
    }
    const settlements: ReservationPaymentSettlementDecision[] = [];
    for (const item of payments) {
      const decision = decisions[item.paymentId];
      if (!decision || !item.collected || !(item.refundableAmount > 0)) {
        continue;
      }
      if (!decision.reason.trim()) {
        setError(
          t('occupancy.cancelReservation.reasonRequired', {
            defaultValue: 'Enter a reason for each collected payment settlement.',
          }),
        );
        return;
      }
      if (decision.action === 'CANCEL_UNPAID') {
        continue;
      }
      const amounts = resolveSettlementAmounts(
        decision.action,
        item.refundableAmount,
        decision.refundAmount,
      );
      if (
        decision.action === 'PARTIAL_REFUND' &&
        (!(amounts.refundAmount > 0) || amounts.refundAmount > item.refundableAmount + 0.0001)
      ) {
        setError(
          t('occupancy.cancelReservation.refundAmountRequired', {
            defaultValue: 'Enter a valid refund amount.',
          }),
        );
        return;
      }
      settlements.push({
        paymentId: item.paymentId,
        action: decision.action,
        refundAmount: amounts.refundAmount > 0 ? amounts.refundAmount : null,
        retainedAmount: amounts.retainedAmount > 0 ? amounts.retainedAmount : null,
        reason: decision.reason.trim(),
      });
    }

    setSubmitting(true);
    setError(null);
    try {
      await occupancyApi.cancelReservation(spaceId, occupancyId, {
        remarks: remarks.trim() || undefined,
        settlements,
      });
      onCancelled();
      onClose();
    } catch (err) {
      setError(getOccupancyErrorMessage(err, 'occupancy.errors.cancelReservation'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={submitting ? undefined : onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {t('occupancy.cancelReservation.title', { defaultValue: 'Cancel reservation' })}
            </Text>
            <Pressable onPress={onClose} disabled={submitting} hitSlop={10}>
              <X size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : (
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <Text style={styles.hint}>
                {t('occupancy.cancelReservation.settlementHint', {
                  defaultValue:
                    'Unpaid obligations are cancelled automatically. Collected amounts need refund or retain.',
                })}
              </Text>
              <Text style={styles.hint}>
                {t('payments.settle.recordNotice', {
                  defaultValue:
                    'Recording a refund confirms money was already returned. ACOMI does not send a bank/UPI payout.',
                })}
              </Text>
              {payments.map(item => {
                const decision = decisions[item.paymentId];
                const needsSettlement = item.collected && (item.refundableAmount ?? 0) > 0;
                return (
                  <View key={item.paymentId} style={styles.card}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardMeta}>
                      ₹{Number(item.amount).toLocaleString('en-IN')} · {item.paymentStatus}
                      {item.collected
                        ? ` · refundable ₹${Number(item.refundableAmount).toLocaleString('en-IN')}`
                        : ''}
                    </Text>
                    {needsSettlement && decision ? (
                      <>
                        <View style={styles.actionsRow}>
                          {item.allowedActions
                            .filter(a => a !== 'CANCEL_UNPAID')
                            .map(action => (
                              <Pressable
                                key={action}
                                style={[
                                  styles.chip,
                                  decision.action === action ? styles.chipActive : null,
                                ]}
                                onPress={() =>
                                  setDecisions(prev => ({
                                    ...prev,
                                    [item.paymentId]: {
                                      ...decision,
                                      action,
                                      refundAmount: '',
                                    },
                                  }))
                                }>
                                <Text
                                  style={[
                                    styles.chipText,
                                    decision.action === action ? styles.chipTextActive : null,
                                  ]}>
                                  {actionLabel(action)}
                                </Text>
                              </Pressable>
                            ))}
                        </View>
                        {decision.action === 'PARTIAL_REFUND' ? (
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder={t('payments.settle.refundAmount', {
                              defaultValue: 'Refund amount',
                            })}
                            value={decision.refundAmount}
                            onChangeText={refundAmount =>
                              setDecisions(prev => ({
                                ...prev,
                                [item.paymentId]: { ...decision, refundAmount },
                              }))
                            }
                          />
                        ) : null}
                        {decision.action !== 'CANCEL_UNPAID' ? (
                          <View style={styles.breakdown}>
                            {(() => {
                              const amounts = resolveSettlementAmounts(
                                decision.action,
                                item.refundableAmount,
                                decision.refundAmount,
                              );
                              return (
                                <>
                                  <Text style={styles.cardMeta}>
                                    {t('payments.settle.refundNow', {
                                      defaultValue: 'Refund now: ₹{{amount}}',
                                      amount: amounts.refundAmount.toLocaleString('en-IN'),
                                    })}
                                  </Text>
                                  <Text style={styles.cardMeta}>
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
                                </>
                              );
                            })()}
                          </View>
                        ) : null}
                        <TextInput
                          style={styles.input}
                          placeholder={t('payments.settle.reason', { defaultValue: 'Reason' })}
                          value={decision.reason}
                          onChangeText={reason =>
                            setDecisions(prev => ({
                              ...prev,
                              [item.paymentId]: { ...decision, reason },
                            }))
                          }
                        />
                      </>
                    ) : (
                      <Text style={styles.cardMeta}>
                        {item.collected
                          ? t('occupancy.cancelReservation.alreadySettled', {
                              defaultValue: 'Already settled.',
                            })
                          : t('occupancy.cancelReservation.willCancelUnpaid', {
                              defaultValue: 'Will be cancelled (unpaid).',
                            })}
                      </Text>
                    )}
                  </View>
                );
              })}
              <TextInput
                style={[styles.input, styles.remarks]}
                placeholder={t('occupancy.cancelReservation.remarks', {
                  defaultValue: 'Cancellation remarks (optional)',
                })}
                value={remarks}
                onChangeText={setRemarks}
                multiline
              />
              {collectedCount > 0 ? (
                <Text style={styles.hint}>
                  {t('occupancy.cancelReservation.collectedCount', {
                    defaultValue: '{{count}} collected payment(s) require settlement.',
                    count: collectedCount,
                  })}
                </Text>
              ) : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </ScrollView>
          )}
          <View style={styles.footer}>
            <Button
              label={t('common.back', { defaultValue: 'Back' })}
              variant="secondary"
              onPress={onClose}
              disabled={submitting}
              style={styles.footerBtn}
            />
            <Button
              label={t('occupancy.actions.cancelReservation', {
                defaultValue: 'Cancel reservation',
              })}
              onPress={handleConfirm}
              loading={submitting}
              disabled={loading || submitting}
              style={styles.footerBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.section,
    borderTopRightRadius: radius.section,
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.h3, color: colors.textPrimary, flex: 1, paddingRight: spacing.sm },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  hint: { ...typography.caption, color: colors.textSecondary },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  cardMeta: { ...typography.caption, color: colors.textSecondary },
  breakdown: {
    gap: 2,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.input,
    padding: spacing.sm,
  },
  retainHint: { ...typography.caption, color: colors.muted },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textPrimary },
  chipTextActive: { color: colors.white },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  remarks: { minHeight: 72, textAlignVertical: 'top' },
  error: { ...typography.caption, color: colors.danger },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  footerBtn: { flex: 1 },
});
