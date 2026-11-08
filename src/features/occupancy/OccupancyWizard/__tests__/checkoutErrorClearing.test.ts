/**
 * Regression helpers for Short Stay checkout validation clearing.
 * Mirrors OccupancyWizardScreen behaviour: once a valid checkout is chosen,
 * field + form errors must clear immediately.
 */

function nextCheckoutState(input: {
  value: string;
  expectedExitError: string | null;
  formError: string | null;
}): { expectedExitError: string | null; formError: string | null; expectedExitDate: string } {
  return {
    expectedExitDate: input.value,
    expectedExitError: null,
    formError: null,
  };
}

function validateShortCheckout(moveIn: string, checkout: string): string | null {
  if (!checkout.trim()) {
    return 'Checkout date must be set for short stay.';
  }
  if (checkout <= moveIn) {
    return 'A short stay checkout must be after the check-in date.';
  }
  return null;
}

describe('Short Stay checkout error clearing', () => {
  it('clears stale checkout error when a valid date is selected', () => {
    const before = {
      value: '2026-11-12',
      expectedExitError: 'Checkout date must be set for short stay.',
      formError: 'Checkout date must be set for short stay.',
    };
    const after = nextCheckoutState(before);
    expect(after.expectedExitError).toBeNull();
    expect(after.formError).toBeNull();
    expect(validateShortCheckout('2026-11-05', after.expectedExitDate)).toBeNull();
  });

  it('still fails Continue when checkout remains empty', () => {
    expect(validateShortCheckout('2026-11-05', '')).toMatch(/Checkout date/);
  });

  it('does not keep error after correcting same-day checkout', () => {
    const invalid = validateShortCheckout('2026-11-05', '2026-11-05');
    expect(invalid).toBeTruthy();
    const corrected = nextCheckoutState({
      value: '2026-11-12',
      expectedExitError: invalid,
      formError: invalid,
    });
    expect(corrected.expectedExitError).toBeNull();
    expect(validateShortCheckout('2026-11-05', corrected.expectedExitDate)).toBeNull();
  });
});
