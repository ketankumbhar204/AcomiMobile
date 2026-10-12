import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ProgressiveWorkflowFooter,
  type ProgressiveWorkflowPhase,
} from '../progressive';

export type ProgressiveMealPlanningPhase = 'select' | 'review_extras' | 'ready';

type ProgressiveMealPlanningFooterProps = {
  phase: ProgressiveMealPlanningPhase;
  /** Non-extra meals currently selected. Shown on step 1. */
  selectedCount?: number;
  saving?: boolean;
  canDeleteDraft?: boolean;
  saveDisabled?: boolean;
  shareDisabled?: boolean;
  onContinueToExtras: () => void;
  onSaveDraft: () => void;
  onShareMeal: () => void;
  onDeleteDraft?: () => void;
};

function toWorkflowPhase(phase: ProgressiveMealPlanningPhase): ProgressiveWorkflowPhase {
  if (phase === 'review_extras') {
    return 'continue';
  }
  if (phase === 'ready') {
    return 'ready';
  }
  return 'start';
}

/**
 * Mess meal planning progressive footer — thin wrapper over ProgressiveWorkflowFooter.
 */
export function ProgressiveMealPlanningFooter({
  phase,
  selectedCount = 0,
  saving = false,
  canDeleteDraft = false,
  saveDisabled = false,
  shareDisabled = false,
  onContinueToExtras,
  onSaveDraft,
  onShareMeal,
  onDeleteDraft,
}: ProgressiveMealPlanningFooterProps) {
  const { t } = useTranslation();
  const workflowPhase = toWorkflowPhase(phase);

  return (
    <ProgressiveWorkflowFooter
      phase={workflowPhase}
      showProgress={phase === 'review_extras' || phase === 'ready'}
      stepLabel={
        phase === 'review_extras'
          ? t('meals.planning.progressive.stepOf', { current: 1, total: 2 })
          : phase === 'ready'
            ? t('meals.planning.progressive.stepOf', { current: 2, total: 2 })
            : undefined
      }
      stepCurrent={phase === 'review_extras' ? 1 : phase === 'ready' ? 2 : undefined}
      stepTotal={phase === 'select' ? undefined : 2}
      progressLine={
        phase === 'review_extras'
          ? t('meals.planning.progressive.selectedMealsNextExtras', { count: selectedCount })
          : phase === 'ready'
            ? t('meals.planning.progressive.readyToSave')
            : undefined
      }
      continueLabel={t('meals.planning.progressive.continueToExtras')}
      continueA11yLabel={t('meals.planning.progressive.nextStepA11y')}
      onContinue={onContinueToExtras}
      destructiveLink={
        canDeleteDraft && onDeleteDraft
          ? {
              label: t('meals.actions.deleteDraft'),
              onPress: onDeleteDraft,
              disabled: saving,
            }
          : undefined
      }
      secondaryAction={{
        label: t('meals.actions.save'),
        onPress: onSaveDraft,
        loading: saving,
        disabled: saveDisabled,
      }}
      primaryAction={{
        label: t('meals.actions.share'),
        onPress: onShareMeal,
        loading: saving,
        disabled: shareDisabled,
      }}
      compact
    />
  );
}
