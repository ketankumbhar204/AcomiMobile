import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, FormInput } from '../ui';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { isMoveInDateInFuture } from '../../utils/occupancyRules';

export type MoveInFormValues = {
  expectedExitDate?: string;
  agreementSigned: boolean;
  allowEarlyMoveIn: boolean;
  remarks?: string;
};

type MoveInModalProps = {
  visible: boolean;
  moveInDate?: string | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (values: MoveInFormValues) => void;
};

export function MoveInModal({
  visible,
  moveInDate,
  loading = false,
  onClose,
  onConfirm,
}: MoveInModalProps) {
  const { t } = useTranslation();
  const [expectedExitDate, setExpectedExitDate] = useState('');
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [allowEarlyMoveIn, setAllowEarlyMoveIn] = useState(false);
  const [remarks, setRemarks] = useState('');

  const needsEarlyMoveIn = isMoveInDateInFuture(moveInDate);

  function handleDismiss() {
    setExpectedExitDate('');
    setAgreementSigned(false);
    setAllowEarlyMoveIn(false);
    setRemarks('');
    onClose();
  }

  function handleConfirm() {
    onConfirm({
      expectedExitDate: expectedExitDate.trim() || undefined,
      agreementSigned,
      allowEarlyMoveIn: needsEarlyMoveIn ? allowEarlyMoveIn : false,
      remarks: remarks.trim() || undefined,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
          <Text style={styles.title}>{t('occupancy.moveIn.title')}</Text>
          {moveInDate ? (
            <Text style={styles.subtitle}>
              {t('occupancy.section.moveInDate')}: {moveInDate}
            </Text>
          ) : null}

          {needsEarlyMoveIn ? (
            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <Text style={styles.switchLabel}>{t('occupancy.moveIn.allowEarly')}</Text>
                <Text style={styles.switchHint}>{t('occupancy.moveIn.allowEarlyHint')}</Text>
              </View>
              <Switch
                value={allowEarlyMoveIn}
                onValueChange={setAllowEarlyMoveIn}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          ) : null}

          <FormInput
            label={t('occupancy.fields.expectedExit')}
            value={expectedExitDate}
            onChangeText={setExpectedExitDate}
            placeholder="YYYY-MM-DD"
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('occupancy.fields.agreementSigned')}</Text>
            <Switch
              value={agreementSigned}
              onValueChange={setAgreementSigned}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <FormInput
            label={t('occupancy.fields.remarks')}
            value={remarks}
            onChangeText={setRemarks}
            placeholder={t('occupancy.fields.remarksPlaceholder')}
          />

          <View style={styles.comingSoonBlock}>
            <Text style={styles.comingSoonTitle}>{t('occupancy.picker.financialTerms')}</Text>
            <Text style={styles.comingSoonItem}>· {t('occupancy.picker.rent')}</Text>
            <Text style={styles.comingSoonItem}>· {t('occupancy.picker.deposit')}</Text>
            <Text style={styles.comingSoonItem}>· {t('occupancy.picker.foodCharges')}</Text>
            <Text style={styles.comingSoonHint}>{t('occupancy.picker.comingSoonHint')}</Text>
          </View>

          <View style={styles.actions}>
            <Button
              label={t('occupancy.actions.moveIn')}
              onPress={handleConfirm}
              loading={loading}
              disabled={loading || (needsEarlyMoveIn && !allowEarlyMoveIn)}
              style={styles.actionBtn}
            />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={handleDismiss}
              disabled={loading}
              style={styles.actionBtn}
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.md,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  switchCopy: {
    flex: 1,
  },
  switchLabel: {
    ...typography.bodyStrong,
  },
  switchHint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  comingSoonBlock: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  comingSoonTitle: {
    ...typography.bodyStrong,
  },
  comingSoonItem: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  comingSoonHint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
});
