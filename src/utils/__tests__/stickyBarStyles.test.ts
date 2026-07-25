import { STICKY_BAR_PADDING_BOTTOM_BASE } from '../../components/progressive/stickyBarStyles';

describe('stickyBarStyles', () => {
  it('exposes a positive base bottom padding', () => {
    expect(STICKY_BAR_PADDING_BOTTOM_BASE).toBeGreaterThan(0);
  });
});
