export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
} as const;

/**
 * Standard page-level left/right content margin.
 * Reference: Rooms (`AccommodationHomeScreen`) uses `spacing.lg` (16).
 * Prefer this over inventing per-screen horizontal padding values.
 */
export const pageContentGutter = spacing.lg;
