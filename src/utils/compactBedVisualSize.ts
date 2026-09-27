/** Compact bed-detail visual well. Keeps the image area in the 90–140dp range. */
export function compactBedVisualSize(windowWidth: number): number {
  return Math.round(Math.min(140, Math.max(90, windowWidth * 0.26)));
}
