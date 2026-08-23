/**
 * Acomi surface + brand color system.
 * Page uses a subtle light-green canvas; cards stay pure white.
 *
 * Hierarchy (shared with Web):
 *   primary  #25D366  — CTAs, selected chrome
 *   teal     #128C7E  — brand chrome / secondary
 *   tealDark #075E54  — header / mark accents
 */
export const colors = {
  // Brand
  primary: '#25D366',
  primaryHover: '#20BD5A',
  primaryActive: '#1AAE50',
  teal: '#128C7E',
  tealDark: '#075E54',
  primaryDark: '#128C7E',

  // Surfaces
  /** App / page background */
  background: '#F3FAF6',
  mintSubtle: '#EAF8F2',
  /** Secondary surface (wells, chips behind content) */
  surfaceSecondary: '#EDF8F2',
  /** Section background */
  section: '#EAF7F0',
  /** Card / elevated card background */
  surface: '#FFFFFF',
  white: '#FFFFFF',
  /** Hover surface */
  hover: '#F0FAF4',
  /** Selected surface */
  selected: '#E2F7EC',

  // Borders / dividers
  border: '#DCEFE3',
  divider: '#E6F2EA',

  // Semantic tints
  lightGreen: '#E8F8EF',
  successTint: '#E8F8EF',
  warningTint: '#FFF8E8',
  errorTint: '#FFF0F0',

  // Text + status
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  muted: '#94A3B8',
  success: '#059669',
  danger: '#DC2626',
  warning: '#D97706',
  info: '#2563EB',
} as const;
