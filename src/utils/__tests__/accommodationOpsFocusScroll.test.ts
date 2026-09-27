import { shouldAutoScrollToOpsResults } from '../accommodationOpsFocusScroll';

describe('shouldAutoScrollToOpsResults', () => {
  it('scrolls on first vacant selection', () => {
    expect(shouldAutoScrollToOpsResults(null, 'VACANT')).toBe(true);
  });

  it('scrolls when switching occupied after vacant', () => {
    expect(shouldAutoScrollToOpsResults('VACANT', 'OCCUPIED')).toBe(true);
  });

  it('scrolls when selecting move-ins', () => {
    expect(shouldAutoScrollToOpsResults(null, 'MOVE_INS_THIS_MONTH')).toBe(true);
  });

  it('does not scroll when clearing the filter', () => {
    expect(shouldAutoScrollToOpsResults('VACANT', null)).toBe(false);
  });

  it('does not scroll for pending payments', () => {
    expect(shouldAutoScrollToOpsResults(null, 'PENDING_PAYMENTS')).toBe(false);
    expect(shouldAutoScrollToOpsResults('VACANT', 'PENDING_PAYMENTS')).toBe(false);
  });
});
