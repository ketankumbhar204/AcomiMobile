import { TextStyle } from 'react-native';
import { colors } from './colors';

export const fontFamily = {
  sans: 'Plus Jakarta Sans',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 32,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  tight: 20,
  normal: 24,
  relaxed: 28,
  loose: 34,
} as const;

export const typography = {
  display: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: lineHeight.loose,
  },
  h1: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: lineHeight.loose,
  },
  h2: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: lineHeight.relaxed,
  },
  h3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    lineHeight: lineHeight.normal,
  },
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
    lineHeight: lineHeight.normal,
  },
  bodyStrong: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    lineHeight: lineHeight.normal,
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
    lineHeight: lineHeight.tight,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primaryDark,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
} as const;
