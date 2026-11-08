import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ExtendOccupancyRequest } from '../../api/types';
import { Button, DateField, FormInput } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import { getOccupancyErrorMessage } from '../../utils/occupancyErrors';
import {
  buildReviseOpenEndedRentRequest,
  defaultRentEffectiveFromYmd,
  formatDailyRentDisplay,
  previousRateThroughYmd,
} from '../../utils/reviseOpenEndedRent';

type ReasonCode = '' | 'RENT_REVISION' | 'MUTUAL_AGREEMENT' | 'OTHER';

type ReviseOpenEndedRentModalProps = {
  visible: boolean;
  idempotencyKey: string;
  currentDailyRent: number | null | undefined;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (body: ExtendOccupancyRequest) => Promise<void>;
};

export function ReviseOpenEndedRentModal({
  visible,
  idempotencyKey,
  currentDailyRent,
  submitting = false,
  onClose,
  onSubmit,
}: ReviseOpenEndedRentModalProps) {
  const { t } = useTranslation();
  const [newDailyRent, setNewDailyRent] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [reasonCode, setReasonCode] = useState<ReasonCode>('');
  const [reasonOther, setReasonOther] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setNewDailyRent(
      currentDailyRent != null && !Number.isNaN(currentDailyRent)
        ? String(currentDailyRent)
        : '',
    );
    setEffectiveFrom(defaultRentEffectiveFromYmd());
    setReasonCode('');
    setReasonOther('');
    setError(null);
  }, [visible, idempotencyKey, currentDailyRent]);

  const preview = useMemo(() => {
    const through = previousRateThroughYmd(effectiveFrom);
    const nextAmount = Number(newDailyRent.trim());
    return {
      through,
      nextAmount: Number.isFinite(nextAmount) ? nextAmount : null,
    };
  }, [effectiveFrom, newDailyRent]);

  const missingCurrent = currentDailyRent == null || Number.isNaN(currentDailyRent);

  const submit = async () => {
    if (submitting) {
      return;
    }
    setError(null);
    try {
      const body = buildReviseOpenEndedRentRequest({
        currentDailyRent,
        newDailyRent,
        effectiveFrom,
        reasonCode,
        reasonOther,
        idempotencyKey,
      });
      await onSubmit({
        idempotencyKey: body.idempotencyKey,
        rentSnapshot: body.rentSnapshot,
        rentEffectiveMonth: body.rentEffectiveMonth,
        reason: body.reason,
      });
    } catch (caught) {
      if (caught instanceof Error) {
        if (caught.message === 'CURRENT_RENT_MISSING') {
          setError(
            t('occupancy.reviseRent.currentMissing', {
              defaultValue: 'Current daily rent is missing for this stay. Refresh and try again.',
            }),
          );
          return;
        }
        if (caught.message === 'RENT_UNCHANGED') {
          setError(
            t('occupancy.reviseRent.unchanged', {
              defaultValue: 'Enter a new daily rent that differs from the current rate.',
            }),
          );
          return;
        }
        if (caught.message === 'DATE_REQUIRED' || caught.message === 'AMOUNT') {
          setError(
            t('occupancy.reviseRent.invalid', {
              defaultValue: 'Enter a valid new daily rent and effective date.',
            }),
          );
          return;
        }
      }
      setError(getOccupancyErrorMessage(caught));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={submitting ? undefined : onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>
            {t('occupancy.actions.reviseOpenEnded', {
              defaultValue: 'Update Daily Rent',
            })}
          </Text>
          <Text style={styles.subtitle}>
            {t('occupancy.reviseRent.subtitle', {
              defaultValue:
                'Revise the daily rate for this No Fixed Move-Out Date stay. Stay type does not change.',
            })}
          </Text>

          {missingCurrent ? (
            <Text style={styles.error}>
              {t('occupancy.reviseRent.currentMissing', {
                defaultValue: 'Current daily rent is missing for this stay. Refresh and try again.',
              })}
            </Text>
          ) : (
            <>
              <Text style={styles.label}>
                {t('occupancy.reviseRent.currentDaily', { defaultValue: 'Current Daily Rent' })}
              </Text>
              <Text style={styles.readonly}>{formatDailyRentDisplay(currentDailyRent)}</Text>

              <FormInput
                label={t('occupancy.reviseRent.newDaily', { defaultValue: 'New Daily Rent' })}
                value={newDailyRent}
                onChangeText={setNewDailyRent}
                keyboardType="decimal-pad"
                editable={!submitting}
              />

              <DateField
                label={t('occupancy.reviseRent.effectiveFrom', { defaultValue: 'Effective From' })}
                value={effectiveFrom}
                onChange={setEffectiveFrom}
                allowPastDates={false}
              />

              <Text style={styles.label}>
                {t('occupancy.reviseRent.reason', { defaultValue: 'Reason for Change (optional)' })}
              </Text>
              <View style={styles.reasonRow}>
                {(
                  [
                    ['RENT_REVISION', 'Rent revision'],
                    ['MUTUAL_AGREEMENT', 'Mutual agreement'],
                    ['OTHER', 'Other'],
                  ] as const
                ).map(([code, label]) => (
                  <Pressable
                    key={code}
                    onPress={() => setReasonCode(prev => (prev === code ? '' : code))}
                    style={[styles.chip, reasonCode === code && styles.chipOn]}
                    disabled={submitting}>
                    <Text style={[styles.chipText, reasonCode === code && styles.chipTextOn]}>
                      {t(`occupancy.reviseRent.reason.${code}`, { defaultValue: label })}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {reasonCode === 'OTHER' ? (
                <FormInput
                  label={t('occupancy.reviseRent.reasonOther', {
                    defaultValue: 'Short explanation',
                  })}
                  value={reasonOther}
                  onChangeText={setReasonOther}
                  editable={!submitting}
                />
              ) : null}

              {preview.nextAmount != null && preview.through ? (
                <View style={styles.preview}>
                  <Text style={styles.previewTitle}>
                    {t('occupancy.reviseRent.previewTitle', { defaultValue: 'Confirmation summary' })}
                  </Text>
                  <Text style={styles.previewLine}>
                    {t('occupancy.reviseRent.previewCurrent', {
                      defaultValue: 'Current daily rent: {{amount}}',
                      amount: formatDailyRentDisplay(currentDailyRent),
                    })}
                  </Text>
                  <Text style={styles.previewLine}>
                    {t('occupancy.reviseRent.previewNew', {
                      defaultValue: 'New daily rent: {{amount}}',
                      amount: formatDailyRentDisplay(preview.nextAmount),
                    })}
                  </Text>
                  <Text style={styles.previewLine}>
                    {t('occupancy.reviseRent.previewEffective', {
                      defaultValue: 'Effective from: {{date}}',
                      date: effectiveFrom,
                    })}
                  </Text>
                  <Text style={styles.previewLine}>
                    {t('occupancy.reviseRent.previewPreviousThrough', {
                      defaultValue: 'Previous rate applies through: {{date}}',
                      date: preview.through,
                    })}
                  </Text>
                  <Text style={styles.previewNote}>
                    {t('occupancy.reviseRent.previewNote', {
                      defaultValue:
                        'Already generated or paid bills are not changed. Future days are not charged in advance.',
                    })}
                  </Text>
                </View>
              ) : null}
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button
              label={t('common.cancel')}
              variant="secondary"
              onPress={onClose}
              disabled={submitting}
              style={styles.btn}
            />
            <Button
              label={t('occupancy.actions.reviseOpenEnded', { defaultValue: 'Update Daily Rent' })}
              onPress={() => void submit()}
              loading={submitting}
              disabled={submitting || missingCurrent}
              style={styles.btn}
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
    backgroundColor: colors.overlayScrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
    maxHeight: '92%',
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  readonly: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  reasonRow: {
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
    backgroundColor: colors.background,
  },
  chipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.mintSubtle,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextOn: {
    color: colors.primaryDark,
  },
  preview: {
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 4,
  },
  previewTitle: {
    ...typography.bodyStrong,
    fontSize: 13,
    marginBottom: 2,
  },
  previewLine: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  previewNote: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 4,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
  },
});
