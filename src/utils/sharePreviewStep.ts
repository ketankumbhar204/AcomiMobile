import type { ProgressiveWorkflowPhase } from '../components/progressive';

export const SHARE_PREVIEW_STEP_TOTAL = 3;

export type SharePreviewStep = 0 | 1 | 2 | 3;

export function resolveSharePreviewStep(input: {
  hasSlots: boolean;
  recipientsReviewed: boolean;
  messageReviewed: boolean;
}): { step: SharePreviewStep; phase: ProgressiveWorkflowPhase } {
  if (!input.hasSlots) {
    return { step: 0, phase: 'start' };
  }
  if (!input.recipientsReviewed) {
    return { step: 1, phase: 'continue' };
  }
  if (!input.messageReviewed) {
    return { step: 2, phase: 'continue' };
  }
  return { step: 3, phase: 'ready' };
}

/** Footer copy for the share-menu guided steps. Step 2 is recipients; step 3 is the message. */
export function sharePreviewFooterCopy(step: 1 | 2 | 3): {
  progressKey: string;
  titleKey?: string;
  hintKey?: string;
  continueKey?: string;
} {
  if (step === 1) {
    return {
      progressKey: 'progressiveWorkflow.sharePreview.progressSlotsNext',
      titleKey: 'progressiveWorkflow.sharePreview.selectRecipientsTitle',
      hintKey: 'progressiveWorkflow.sharePreview.selectRecipientsHint',
      continueKey: 'progressiveWorkflow.sharePreview.continueToRecipients',
    };
  }
  if (step === 2) {
    return {
      progressKey: 'progressiveWorkflow.sharePreview.progressRecipientsNext',
      titleKey: 'progressiveWorkflow.sharePreview.reviewMessageTitle',
      hintKey: 'progressiveWorkflow.sharePreview.reviewMessageHint',
      continueKey: 'progressiveWorkflow.sharePreview.continueToMessage',
    };
  }
  return {
    progressKey: 'progressiveWorkflow.sharePreview.progressReady',
  };
}
