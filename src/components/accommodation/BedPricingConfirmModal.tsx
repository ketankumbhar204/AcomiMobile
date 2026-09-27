import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { Button } from '../ui/Button';
import type { PendingBedPricing } from '../../utils/bedPricingCommitController';
import { formatPricingMoney, moneyEquals } from '../../utils/commitBedPricing';

type BedPricingConfirmModalProps = {
  pending: PendingBedPricing | null;
  confirming: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export function BedPricingConfirmModal({
  pending,
  confirming,
  error,
  onConfirm,
  onClose,
}: BedPricingConfirmModalProps) {
  const { t } = useTranslation();
  const notSet = t('accommodation.pricingConfirm.notSet', { defaultValue: 'Not set' });
  const rentChanged = pending ? !moneyEquals(pending.currentRent, pending.defaultRent) : false;
  const depositChanged = pending
    ? !moneyEquals(pending.currentDeposit, pending.defaultDeposit)
    : false;
  const title =
    rentChanged && !depositChanged
      ? t('accommodation.pricingConfirm.titleRent', { defaultValue: 'Confirm Rent Update' })
      : depositChanged && !rentChanged
        ? t('accommodation.pricingConfirm.titleDeposit', {
            defaultValue: 'Confirm Deposit Update',
          })
        : t('accommodation.pricingConfirm.title', { defaultValue: 'Confirm Price Update' });
  const fieldLabel =
    rentChanged && !depositChanged
      ? t('accommodation.fields.rent')
      : depositChanged && !rentChanged
        ? t('accommodation.fields.deposit')
        : t('accommodation.pricingConfirm.price', { defaultValue: 'price' });

  return (
    <Modal
      visible={pending != null}
      transparent
      animationType="fade"
      onRequestClose={confirming ? undefined : onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen">
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropTap}
          onPress={confirming ? undefined : onClose}
          accessibilityRole="button"
        />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {pending ? (
            <>
              <Text style={styles.intro}>
                {t('accommodation.pricingConfirm.changingFor', {
                  defaultValue: 'You are changing the {{field}} for:',
                  field: fieldLabel,
                })}
              </Text>
              <Text style={styles.bedLabel}>{pending.bedLabel}</Text>
              <View style={styles.table}>
                <View style={styles.tableHead}>
                  <Text style={[styles.headCell, styles.headField]} />
                  <Text style={styles.headCell}>
                    {t('accommodation.pricingConfirm.current', { defaultValue: 'Current' })}
                  </Text>
                  <Text style={styles.headCell}>
                    {t('accommodation.pricingConfirm.next', { defaultValue: 'New' })}
                  </Text>
                </View>
                {rentChanged ? (
                  <View style={[styles.tableRow, styles.tableRowChanged]}>
                    <Text style={styles.rowLabel}>{t('accommodation.fields.rent')}</Text>
                    <Text style={styles.rowValue}>
                      {formatPricingMoney(pending.currentRent, notSet)}
                    </Text>
                    <Text style={[styles.rowValue, styles.rowValueChanged]}>
                      {formatPricingMoney(pending.defaultRent, notSet)}
                    </Text>
                  </View>
                ) : null}
                {depositChanged ? (
                  <View style={[styles.tableRow, styles.tableRowChanged]}>
                    <Text style={styles.rowLabel}>{t('accommodation.fields.deposit')}</Text>
                    <Text style={styles.rowValue}>
                      {formatPricingMoney(pending.currentDeposit, notSet)}
                    </Text>
                    <Text style={[styles.rowValue, styles.rowValueChanged]}>
                      {formatPricingMoney(pending.defaultDeposit, notSet)}
                    </Text>
                  </View>
                ) : null}
              </View>
              {pending.affectedBedCount != null ? (
                <Text style={styles.scope}>
                  {t('accommodation.pricingConfirm.affectedCount', {
                    count: pending.affectedBedCount,
                    defaultValue: 'This change will apply to {{count}} matching beds.',
                  })}
                </Text>
              ) : (
                <Text style={styles.scope}>
                  {t('accommodation.pricingConfirm.propagation', {
                    defaultValue:
                      'This will update this bed and fill matching empty beds in the building. Existing prices will not be overwritten.',
                  })}
                </Text>
              )}
              {pending.affectedLocations.length > 0 ? (
                <View style={styles.locations}>
                  <Text style={styles.locationsTitle}>
                    {t('accommodation.pricingConfirm.affectedLocations', {
                      defaultValue: 'Affected locations:',
                    })}
                  </Text>
                  {pending.affectedLocations.map(location => (
                    <Text key={location} style={styles.locationItem}>
                      {location}
                    </Text>
                  ))}
                </View>
              ) : null}
              <Text style={styles.continue}>
                {t('accommodation.pricingConfirm.continue', {
                  defaultValue: 'Do you want to continue?',
                })}
              </Text>
            </>
          ) : null}
          {error ? (
            <Text style={styles.error}>
              {error ||
                t('accommodation.pricingConfirm.updateFailed', {
                  defaultValue: 'Unable to update pricing. No changes were applied.',
                })}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={onClose}
              disabled={confirming}
              style={styles.actionButton}
            />
            <Button
              label={
                confirming
                  ? t('accommodation.pricingConfirm.confirming', {
                      defaultValue: 'Updating...',
                    })
                  : t('accommodation.pricingConfirm.confirm', {
                      defaultValue: 'Confirm Update',
                    })
              }
              onPress={onConfirm}
              loading={confirming}
              disabled={confirming}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    zIndex: 1,
    elevation: 8,
    ...shadows.md,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  intro: {
    ...typography.body,
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  bedLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  tableHead: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headCell: {
    ...typography.caption,
    color: colors.muted,
    flex: 1,
  },
  headField: {
    flex: 1.1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tableRowChanged: {
    backgroundColor: colors.lightGreen,
  },
  rowLabel: {
    ...typography.bodyStrong,
    flex: 1.1,
    color: colors.textPrimary,
  },
  rowValue: {
    ...typography.body,
    flex: 1,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  rowValueChanged: {
    fontWeight: '700',
    color: colors.primary,
  },
  scope: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  locations: {
    marginBottom: spacing.sm,
    gap: 2,
  },
  locationsTitle: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    marginBottom: 4,
  },
  locationItem: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  continue: {
    ...typography.body,
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  error: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
