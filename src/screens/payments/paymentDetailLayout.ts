import { pageContentGutter } from '../../theme';

/**
 * Page content uses one horizontal gutter (`pageContentGutter`, Rooms / Member Details).
 * Apply this on scroll content (and sticky bar chrome). Screen shell must use
 * explicit `paddingHorizontal/Vertical: 0` — RN `padding: 0` may not clear Screen defaults.
 */
export const paymentDetailScreenPadding = 0;
export const paymentDetailContentGutter = pageContentGutter;

export function paymentDetailHorizontalInset(): number {
  return paymentDetailScreenPadding + paymentDetailContentGutter;
}
