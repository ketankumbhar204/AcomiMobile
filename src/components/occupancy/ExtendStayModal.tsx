import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ExtendOccupancyRequest } from '../../api/types';
import { Button, DateField, FormInput } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import { getOccupancyErrorMessage } from '../../utils/occupancyErrors';
import { buildExtendStayRequest } from '../../utils/extendStay';
import { shortStayCrossesCalendarMonth } from '../../utils/shortStay';

type ExtendStayModalProps = {
  visible: boolean;
  idempotencyKey: string;
  submitting?: boolean;
  /** When SHORT, additional amount is allowed; monthly/open-ended reject a charge. */
  stayKind?: 'MONTHLY' | 'SHORT' | 'OPEN_ENDED' | null;
  /** Stay move-in / start date (YYYY-MM-DD) for cross-month extension precheck. */
  moveInDate?: string | null;
  /** `renewal` presets +1 month and labels the D-15 rent-from-month fields. */
  variant?: 'extend' | 'renewal';
  /** Prefill for new planned end (YYYY-MM-DD). */
  initialExpectedExitDate?: string;
  onClose: () => void;
  onSubmit: (body: ExtendOccupancyRequest) => Promise<void>;
};

export function ExtendStayModal({
  visible,
  idempotencyKey,
  submitting = false,
  stayKind = null,
  moveInDate = null,
  variant = 'extend',
  initialExpectedExitDate = '',
  onClose,
  onSubmit,
}: ExtendStayModalProps) {
  const { t } = useTranslation();
  const [expectedExitDate, setExpectedExitDate] = useState('');
  const [additionalAmount, setAdditionalAmount] = useState('');
  const [rentSnapshot, setRentSnapshot] = useState('');
  const [rentEffectiveMonth, setRentEffectiveMonth] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isRenewal = variant === 'renewal';
  const isOpenEnded = stayKind === 'OPEN_ENDED';
  const renewLabel = isOpenEnded
    ? t('occupancy.actions.renewOpenEnded', { defaultValue: 'Open-ended renewal' })
    : t('occupancy.actions.renewMonthly', { defaultValue: 'Monthly renewal' });

  useEffect(() => {
    if (!visible) {
      return;
    }
    setExpectedExitDate(initialExpectedExitDate);
    setAdditionalAmount('');
    setRentSnapshot('');
    setRentEffectiveMonth('');
    setError(null);
  }, [visible, idempotencyKey, initialExpectedExitDate]);

  const submit = async () => {
    if (submitting) {
      return;
    }
    setError(null);
    try {
      const body = buildExtendStayRequest({
        expectedExitDate,
        additionalAmount,
        rentSnapshot,
        rentEffectiveMonth,
        idempotencyKey,
      });
      const isShort = stayKind === 'SHORT';
      if (
        !isShort &&
        body.additionalAmount != null &&
        body.additionalAmount > 0
      ) {
        setError(
          t('occupancy.errors.codes.EXTENSION_AMOUNT', {
            defaultValue:
              'Monthly and open-ended stays do not take an extension charge. Leave the additional amount empty.',
          }),
        );
        return;
      }
      const start = moveInDate?.trim();
      if (
        isShort &&
        start &&
        shortStayCrossesCalendarMonth(start, body.expectedExitDate)
      ) {
        setError(
          t('occupancy.errors.codes.EXTENSION_CROSSES_MONTH', {
            defaultValue:
              'A short-stay extension cannot cover nights in more than one calendar month.',
          }),
        );
        return;
      }
      await onSubmit(body);
    } catch (caught) {
      if (caught instanceof Error && caught.message === 'RENT_FIELDS') {
        setError(
          t('occupancy.extend.rentFields', {
            defaultValue: isOpenEnded
              ? 'A new daily rent needs the month it starts.'
              : 'A new monthly rent needs the month it starts.',
          }),
        );
        return;
      }
      if (
        caught instanceof Error &&
        (caught.message === 'DATE_REQUIRED' || caught.message === 'AMOUNT')
      ) {
        setError(
          t('occupancy.extend.invalid', {
            defaultValue: 'Enter a planned end date and an amount that is zero or greater.',
          }),
        );
        return;
      }
      setError(getOccupancyErrorMessage(caught, 'occupancy.extend.failed'));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={submitting ? undefined : onClose}>
      <Pressable style={styles.backdrop} onPress={submitting ? undefined : onClose}>
        <Pressable style={styles.card} onPress={event => event.stopPropagation()}>
          <Text style={styles.title}>
            {isRenewal ? renewLabel : t('occupancy.actions.extend', { defaultValue: 'Extend stay' })}
          </Text>
          {isRenewal ? (
            <Text style={styles.hint}>
              {isOpenEnded
                ? t('occupancy.extend.renewalHintOpenEnded', {
                    defaultValue:
                      'Extend the open-ended stay on the same occupancy. Optional new daily rent applies from the month you choose. Rent is billed after the billing period closes.',
                  })
                : t('occupancy.extend.renewalHint', {
                    defaultValue:
                      'Extend for one month on the same occupancy. Optional new rent applies from the month you choose (D-15).',
                  })}
            </Text>
          ) : null}
          <DateField
            label={
              isRenewal
                ? t('occupancy.extend.newBillingEnd', { defaultValue: 'New planned end / billing date' })
                : t('occupancy.extend.newEnd', { defaultValue: 'New planned end' })
            }
            value={expectedExitDate}
            onChange={setExpectedExitDate}
          />
          {!isRenewal ? (
            <FormInput
              label={t('occupancy.extend.amount', { defaultValue: 'Additional amount' })}
              value={additionalAmount}
              onChangeText={setAdditionalAmount}
              keyboardType="decimal-pad"
              hint={t('occupancy.extend.amountHelp', {
                defaultValue:
                  'Leave empty for a date-only change. A short stay uses this as one extension charge.',
              })}
              editable={!submitting}
            />
          ) : null}
          <FormInput
            label={
              isOpenEnded
                ? t('occupancy.extend.rentDaily', { defaultValue: 'New daily rent' })
                : t('occupancy.extend.rent', { defaultValue: 'New monthly rent' })
            }
            value={rentSnapshot}
            onChangeText={setRentSnapshot}
            keyboardType="decimal-pad"
            hint={
              isRenewal
                ? t('occupancy.extend.rentOptionalHelp', {
                    defaultValue: 'Optional. Leave empty to keep the current rent.',
                  })
                : undefined
            }
            editable={!submitting}
          />
          <FormInput
            label={t('occupancy.extend.effectiveMonth', { defaultValue: 'Rent starts in' })}
            value={rentEffectiveMonth}
            onChangeText={setRentEffectiveMonth}
            placeholder="YYYY-MM"
            editable={!submitting}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button
              label={t('common.cancel', { defaultValue: 'Cancel' })}
              variant="secondary"
              onPress={onClose}
              disabled={submitting}
            />
            <Button
              label={
                isRenewal ? renewLabel : t('occupancy.actions.extend', { defaultValue: 'Extend stay' })
              }
              onPress={() => void submit()}
              loading={submitting}
              disabled={submitting || !expectedExitDate}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
