import { TextStyle } from 'react-native';
import { colors } from './colors';

export const fontFamily = {
  sans: 'Inter',
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
    fontFamily: fontFamily.sans,
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: lineHeight.loose,
  },
  h1: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: lineHeight.loose,
  },
  h2: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: lineHeight.relaxed,
  },
  h3: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    lineHeight: lineHeight.normal,
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
    lineHeight: lineHeight.normal,
  },
  bodyStrong: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    lineHeight: lineHeight.normal,
  },
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
    lineHeight: lineHeight.tight,
  },
  label: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
  eyebrow: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primaryDark,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
} as const;
