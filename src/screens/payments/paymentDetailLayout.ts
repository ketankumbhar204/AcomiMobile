import { spacing } from '../../theme';

/**
 * Dashboard uses one horizontal gutter (`spacing.xxl`).
 * The payment detail screen must not add the shared Screen padding on top of it.
 */
export const paymentDetailScreenPadding = 0;
export const paymentDetailContentGutter = spacing.xxl;

export function paymentDetailHorizontalInset(): number {
  return paymentDetailScreenPadding + paymentDetailContentGutter;
}
