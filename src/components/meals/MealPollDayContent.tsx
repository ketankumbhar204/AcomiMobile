import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealPollSlot, MealType, UUID } from '../../api/types';
import { Button } from '../ui';
import { colors, spacing, typography } from '../../theme';
import { formatMenuDate } from '../../utils/mealDates';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import { MealPollOptionRadio } from './MealPollOptionRadio';

type MealPollDayContentProps = {
  menuDate: string;
  loading: boolean;
  saving: boolean;
  openPolls: MealPollSlot[];
  selections: Partial<Record<MealType, UUID>>;
  showSummary: boolean;
  onSelect: (mealType: MealType, optionId: UUID) => void;
  onSave: () => void;
  onUpdateChoices: () => void;
  variant?: 'dashboard' | 'screen';
};

export function MealPollDayContent({
  menuDate,
  loading,
  saving,
  openPolls,
  selections,
  showSummary,
  onSelect,
  onSave,
  onUpdateChoices,
  variant = 'screen',
}: MealPollDayContentProps) {
  const { t, i18n } = useTranslation();
  const isDashboard = variant === 'dashboard';

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={styles.loader} />;
  }

  if (openPolls.length === 0) {
    return null;
  }

  const title = isDashboard ? t('dashboard.tomorrowMeals') : null;
  const dateLabel = formatMenuDate(menuDate, i18n.language);

  return (
    <View>
      {title ? <Text style={styles.dashboardTitle}>{title}</Text> : null}
      <Text style={isDashboard ? styles.dashboardDate : styles.screenDate}>{dateLabel}</Text>
      {!isDashboard ? (
        <Text style={styles.subtitle}>{t('meals.poll.responseHint')}</Text>
      ) : null}

      {showSummary
        ? openPolls.map(poll => {
            const selected = poll.options.find(option => option.id === poll.mySelectedOptionId);
            return (
              <View key={poll.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{t(mealTypeLabelKey(poll.mealType))}</Text>
                {selected ? (
                  <Text style={styles.summaryChoice}>✓ {selected.label}</Text>
                ) : (
                  <Text style={styles.summaryMissing}>{t('meals.poll.notSelected')}</Text>
                )}
              </View>
            );
          })
        : openPolls.map(poll => (
            <View key={poll.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{t(mealTypeLabelKey(poll.mealType))}</Text>
              {poll.options.map(option => (
                <MealPollOptionRadio
                  key={option.id}
                  option={option}
                  selected={selections[poll.mealType] === option.id}
                  onSelect={() => onSelect(poll.mealType, option.id)}
                />
              ))}
            </View>
          ))}

      <Button
        label={
          saving
            ? t('meals.poll.submitting')
            : showSummary
              ? t('meals.poll.updateChoices')
              : t('meals.poll.submit')
        }
        onPress={showSummary ? onUpdateChoices : () => void onSave()}
        disabled={saving}
        style={styles.submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: spacing.lg },
  dashboardTitle: { ...typography.h3, marginBottom: spacing.xs },
  dashboardDate: { ...typography.bodyStrong, fontSize: 18, marginBottom: spacing.md },
  screenDate: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.bodyStrong, fontSize: 18, marginBottom: spacing.sm },
  summaryChoice: { ...typography.bodyStrong, marginBottom: spacing.xs },
  summaryMissing: { ...typography.body, color: colors.muted, marginBottom: spacing.xs },
  submit: { marginTop: spacing.sm },
});
