import { stickyBarChrome } from '../../../components/progressive/stickyBarStyles';
import { spacing } from '../../../theme';
import {
  paymentDetailContentGutter,
  paymentDetailHorizontalInset,
} from '../paymentDetailLayout';

describe('payment detail layout', () => {
  it('uses the same single gutter as the dashboard', () => {
    expect(paymentDetailHorizontalInset()).toBe(spacing.xxl);
  });

  it('does not stack screen padding on top of the content gutter', () => {
    const previousDoubleInset = spacing.xxl + spacing.lg;
    expect(paymentDetailHorizontalInset()).toBeLessThan(previousDoubleInset);
  });

  it('lines the action bar up with the detail content', () => {
    expect(stickyBarChrome.paddingHorizontal).toBe(paymentDetailContentGutter);
  });
});