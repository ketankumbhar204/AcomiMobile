import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ProgressiveWorkflowFooter,
  type ProgressiveWorkflowPhase,
} from '../progressive';

export type ProgressiveMealPlanningPhase = 'select' | 'review_extras' | 'ready';

type ProgressiveMealPlanningFooterProps = {
  phase: ProgressiveMealPlanningPhase;
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
      progressLine={
        phase === 'review_extras'
          ? t('meals.planning.progressive.mealsSelectedNextExtras')
          : phase === 'ready'
            ? t('meals.planning.progressive.readyToSave')
            : undefined
      }
      continueEyebrow={t('meals.planning.progressive.nextStep')}
      continueTitle={t('meals.planning.progressive.reviewExtrasTitle')}
      continueHint={t('meals.planning.progressive.reviewExtrasHint')}
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
        label: t('meals.actions.saveDraft'),
        onPress: onSaveDraft,
        loading: saving,
        disabled: saveDisabled,
      }}
      primaryAction={{
        label: t('meals.actions.shareMeal'),
        onPress: onShareMeal,
        loading: saving,
        disabled: shareDisabled,
      }}
    />
  );
}
