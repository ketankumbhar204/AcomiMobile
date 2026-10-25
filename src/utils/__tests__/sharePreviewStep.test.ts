import {
  resolveSharePreviewStep,
  sharePreviewFooterCopy,
  SHARE_PREVIEW_STEP_TOTAL,
} from '../sharePreviewStep';

describe('share menu steps', () => {
  it('starts on meals and continues to recipients, then the message', () => {
    const step1 = resolveSharePreviewStep({
      hasSlots: true,
      recipientsReviewed: false,
      messageReviewed: false,
    });
    expect(step1).toEqual({ step: 1, phase: 'continue' });
    expect(sharePreviewFooterCopy(1).continueKey).toBe(
      'progressiveWorkflow.sharePreview.continueToRecipients',
    );
    expect(sharePreviewFooterCopy(1).titleKey).toBe(
      'progressiveWorkflow.sharePreview.selectRecipientsTitle',
    );

    const step2 = resolveSharePreviewStep({
      hasSlots: true,
      recipientsReviewed: true,
      messageReviewed: false,
    });
    expect(step2).toEqual({ step: 2, phase: 'continue' });
    expect(step2.step).toBe(2);
    expect(SHARE_PREVIEW_STEP_TOTAL).toBe(3);
    expect(sharePreviewFooterCopy(2).continueKey).toBe(
      'progressiveWorkflow.sharePreview.continueToMessage',
    );
    expect(sharePreviewFooterCopy(2).titleKey).toBe(
      'progressiveWorkflow.sharePreview.reviewMessageTitle',
    );
    expect(sharePreviewFooterCopy(2).progressKey).toBe(
      'progressiveWorkflow.sharePreview.progressRecipientsNext',
    );

    const step3 = resolveSharePreviewStep({
      hasSlots: true,
      recipientsReviewed: true,
      messageReviewed: true,
    });
    expect(step3).toEqual({ step: 3, phase: 'ready' });
    expect(sharePreviewFooterCopy(3).continueKey).toBeUndefined();
    expect(sharePreviewFooterCopy(3).progressKey).toBe(
      'progressiveWorkflow.sharePreview.progressReady',
    );
  });

  it('stays on the first step until a meal is selected', () => {
    expect(
      resolveSharePreviewStep({
        hasSlots: false,
        recipientsReviewed: false,
        messageReviewed: false,
      }),
    ).toEqual({ step: 0, phase: 'start' });
  });
});
