import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Circle } from 'lucide-react-native';
import { Button } from '../ui';
import type { SetupStepId, SpaceSetupProgress } from '../../utils/spaceSetupProgress';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type DashboardSetupProgressCardProps = {
  progress: SpaceSetupProgress;
  onContinue: () => void;
};

function stepLabelKey(id: SetupStepId): string {
  switch (id) {
    case 'spaceCreated':
      return 'dashboard.setup.steps.spaceCreated';
    case 'createBuilding':
      return 'dashboard.setup.steps.createBuilding';
    case 'addFloors':
      return 'dashboard.setup.steps.addFloors';
    case 'addRooms':
      return 'dashboard.setup.steps.addRooms';
    case 'addBeds':
      return 'dashboard.setup.steps.addBeds';
    case 'addMembers':
      return 'dashboard.setup.steps.addMembers';
    case 'configureMeals':
      return 'dashboard.setup.steps.configureMeals';
    default:
      return 'dashboard.setup.steps.spaceCreated';
  }
}

function nextActionLabelKey(id: SetupStepId | null): string {
  if (id == null) {
    return 'dashboard.setup.continue';
  }
  if (id === 'createBuilding' || id === 'addFloors' || id === 'addRooms' || id === 'addBeds') {
    return 'dashboard.setup.startSetup';
  }
  if (id === 'addMembers') {
    return 'dashboard.setup.addMembers';
  }
  if (id === 'configureMeals') {
    return 'dashboard.setup.configureMeals';
  }
  return 'dashboard.setup.continue';
}

/** Progressive setup checklist for first-time owners (Design A). */
export function DashboardSetupProgressCard({
  progress,
  onContinue,
}: DashboardSetupProgressCardProps) {
  const { t } = useTranslation();

  const nextHint = useMemo(() => {
    if (!progress.nextStepId) {
      return null;
    }
    return t(`dashboard.setup.nextHint.${progress.nextStepId}`);
  }, [progress.nextStepId, t]);

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.eyebrow}>{t('dashboard.setup.eyebrow')}</Text>
      <Text style={styles.title}>{t('dashboard.setup.title')}</Text>
      {nextHint ? <Text style={styles.hint}>{nextHint}</Text> : null}

      <View style={styles.list}>
        {progress.steps.map(step => {
          const done = step.done;
          return (
            <View key={step.id} style={styles.row}>
              <View
                style={[styles.iconWrap, done ? styles.iconDone : styles.iconTodo]}
                accessibilityElementsHidden>
                {done ? (
                  <Check size={14} color={colors.white} strokeWidth={3} />
                ) : (
                  <Circle size={14} color={colors.muted} strokeWidth={2.2} />
                )}
              </View>
              <Text style={[styles.stepLabel, done && styles.stepLabelDone]} numberOfLines={1}>
                {t(stepLabelKey(step.id))}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.remaining}>
        {t('dashboard.setup.percentRemaining', { percent: progress.percentRemaining })}
      </Text>

      <Button
        label={t(nextActionLabelKey(progress.nextStepId))}
        onPress={onContinue}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.section,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    ...shadows.sm,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: 2,
  },
  title: {
    ...typography.h3,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDone: {
    backgroundColor: colors.primary,
  },
  iconTodo: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  stepLabelDone: {
    color: colors.muted,
  },
  remaining: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  cta: {
    marginTop: spacing.xxs,
  },
});
