export type MealReviewIntent = 'save' | 'share' | 'reshare';

/** Missing or unknown intent keeps the existing share-sheet follow-up. */
export function resolveMealReviewIntent(value: unknown): MealReviewIntent {
  if (value === 'save' || value === 'share' || value === 'reshare') {
    return value;
  }
  return 'share';
}

/**
 * WhatsApp and the system share sheet run for Share and Reshare.
 * Save publishes through the poll and stops before external sharing.
 */
export function shouldOpenExternalShare(intent: MealReviewIntent): boolean {
  return intent === 'share' || intent === 'reshare';
}

/** Reshare sends the already published menu and does not open another poll. */
export function shouldPublishMenu(intent: MealReviewIntent): boolean {
  return intent !== 'reshare';
}
