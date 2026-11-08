import { pageContentGutter } from '../../theme';

/**
 * Page content uses one horizontal gutter (`pageContentGutter`, Rooms reference).
 * The payment detail screen must not add the shared Screen padding on top of it.
 */
export const paymentDetailScreenPadding = 0;
export const paymentDetailContentGutter = pageContentGutter;

export function paymentDetailHorizontalInset(): number {
  return paymentDetailScreenPadding + paymentDetailContentGutter;
}
