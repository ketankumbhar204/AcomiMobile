import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FormInput } from '../../../../components/ui';
import { colors, spacing, typography } from '../../../../theme';

type ReserveDatesStepProps = {
  moveInDate: string;
  expectedExitDate: string;
  remarks: string;
  displayPath?: string;
  onMoveInDateChange: (value: string) => void;
  onExpectedExitDateChange: (value: string) => void;
  onRemarksChange: (value: string) => void;
};

export function ReserveDatesStep({
  moveInDate,
  expectedExitDate,
  remarks,
  displayPath,
  onMoveInDateChange,
  onExpectedExitDateChange,
  onRemarksChange,
}: ReserveDatesStepProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('occupancyWizard.steps.reserveDates')}</Text>
      {displayPath ? <Text style={styles.path}>{displayPath}</Text> : null}
      <Text style={styles.hint}>{t('occupancyWizard.steps.reserveDatesHint')}</Text>

      <FormInput
        label={t('occupancy.section.moveInDate')}
        value={moveInDate}
        onChangeText={onMoveInDateChange}
        placeholder="YYYY-MM-DD"
      />
      <FormInput
        label={t('occupancy.fields.expectedExit')}
        value={expectedExitDate}
        onChangeText={onExpectedExitDateChange}
        placeholder="YYYY-MM-DD"
      />
      <FormInput
        label={t('occupancy.fields.remarks')}
        value={remarks}
        onChangeText={onRemarksChange}
        placeholder={t('occupancy.fields.remarksPlaceholder')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  title: { ...typography.h3, marginBottom: spacing.xs },
  path: { ...typography.caption, color: colors.muted, marginBottom: spacing.sm },
  hint: { ...typography.caption, color: colors.muted, marginBottom: spacing.md },
});
