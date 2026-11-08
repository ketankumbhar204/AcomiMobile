export type StayChoice = 'MONTHLY' | 'SHORT' | 'OPEN_ENDED';

/** i18n key for the owner-facing stay-type label (UI only; API still uses SHORT / OPEN_ENDED). */
export function stayChoiceLabelKey(choice: StayChoice): string {
  if (choice === 'SHORT') {
    return 'occupancy.section.shortStayChoice';
  }
  if (choice === 'OPEN_ENDED') {
    return 'occupancy.section.openEndedStayChoice';
  }
  return 'occupancy.section.monthlyStayChoice';
}

/** Fallback English label when i18n is unavailable. */
export function stayChoiceDefaultLabel(choice: StayChoice): string {
  if (choice === 'SHORT') {
    return 'Daily';
  }
  if (choice === 'OPEN_ENDED') {
    return 'No Fixed Move-Out Date';
  }
  return 'Monthly';
}

type StayBody = {
  stayKind?: StayChoice | null;
  agreedTotal?: number | null;
  rentSnapshot?: number | null;
  expectedExitDate?: string | null;
  expectedCheckoutDate?: string | null;
};

/**
 * Short-stay nights under D-03 / half-open `[checkIn, checkout)`.
 * Example: 2026-11-01 → 2026-11-08 = 7 nights.
 */
export function shortStayNightCount(
  checkInYmd: string,
  checkoutYmd: string,
): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkInYmd) || !/^\d{4}-\d{2}-\d{2}$/.test(checkoutYmd)) {
    return null;
  }
  const checkIn = new Date(`${checkInYmd}T00:00:00`);
  const checkout = new Date(`${checkoutYmd}T00:00:00`);
  const nights = Math.round((checkout.getTime() - checkIn.getTime()) / 86_400_000);
  return nights > 0 ? nights : null;
}

/** Mirrors backend StayExtensionRules.crossesCalendarMonth (half-open checkout). */
export function shortStayCrossesCalendarMonth(
  checkInYmd: string,
  checkoutYmd: string,
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkInYmd) || !/^\d{4}-\d{2}-\d{2}$/.test(checkoutYmd)) {
    return false;
  }
  const checkIn = new Date(`${checkInYmd}T00:00:00`);
  const checkout = new Date(`${checkoutYmd}T00:00:00`);
  if (!(checkout.getTime() > checkIn.getTime())) {
    return false;
  }
  const lastNight = new Date(checkout);
  lastNight.setDate(lastNight.getDate() - 1);
  return (
    checkIn.getFullYear() !== lastNight.getFullYear() ||
    checkIn.getMonth() !== lastNight.getMonth()
  );
}

export function applyStayChoice<T extends StayBody>(
  body: T,
  input: {
    /**
     * Kept for call-site compatibility; ignored.
     * Stay kind is chosen per occupancy (not gated by space.shortStayEnabled).
     */
    enabled: boolean;
    choice: StayChoice;
    /** Legacy fixed stay total (only when dailyRent is omitted). */
    agreedTotal?: number | null;
    /** Owner-entered daily rent (₹/night) for Short Stay. */
    dailyRent?: number | null;
    /** When true, treat agreedTotal as daily rent (compat). */
    treatAgreedAsDaily?: boolean;
    expectedExitDate?: string | null;
    /** Check-in / move-in date (YYYY-MM-DD). Defaults to today for same-day allocate. */
    checkInDate?: string | null;
  },
): { body: T; errorKey: string | null } {
  // `enabled` is ignored. MONTHLY is explicit so Transfer does not inherit a prior SHORT kind.
  if (input.choice === 'MONTHLY') {
    return {
      body: {
        ...body,
        stayKind: 'MONTHLY',
        agreedTotal: undefined,
      },
      errorKey: null,
    };
  }
  if (input.choice === 'OPEN_ENDED') {
    return { body: { ...body, stayKind: 'OPEN_ENDED' }, errorKey: null };
  }
  // Prefer daily rate (rentSnapshot). Legacy callers may still pass agreedTotal only.
  const dailyRate =
    input.dailyRent != null && input.dailyRent > 0
      ? input.dailyRent
      : input.agreedTotal != null && input.agreedTotal > 0 && input.treatAgreedAsDaily
        ? input.agreedTotal
        : null;
  const checkout = input.expectedExitDate?.trim();
  if (!checkout) {
    return { body: null as unknown as T, errorKey: 'occupancy.section.expectedMoveOut' };
  }
  const checkIn =
    input.checkInDate?.trim() ||
    (() => {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    })();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkout) || checkout <= checkIn) {
    return { body: null as unknown as T, errorKey: 'occupancy.errors.codes.SHORT_STAY_SAME_DAY' };
  }
  if (shortStayCrossesCalendarMonth(checkIn, checkout)) {
    return {
      body: null as unknown as T,
      errorKey: 'occupancy.errors.codes.SHORT_STAY_CROSSES_MONTH',
    };
  }
  const nights = shortStayNightCount(checkIn, checkout);
  if (dailyRate != null && nights != null) {
    return {
      body: {
        ...body,
        stayKind: 'SHORT',
        rentSnapshot: dailyRate,
        agreedTotal: dailyRate * nights,
        expectedExitDate: checkout,
        expectedCheckoutDate: checkout,
      },
      errorKey: null,
    };
  }
  if (input.agreedTotal == null || input.agreedTotal <= 0) {
    return { body: null as unknown as T, errorKey: 'occupancy.contract.dailyRent' };
  }
  return {
    body: {
      ...body,
      stayKind: 'SHORT',
      agreedTotal: input.agreedTotal,
      rentSnapshot: undefined,
      expectedExitDate: checkout,
      expectedCheckoutDate: checkout,
    },
    errorKey: null,
  };
}

/**
 * When the owner changes stay type, drop values that belong to the previous kind
 * so monthly catalog rent cannot leak into Short Stay (or the reverse).
 */
export function pricingDefaultsForStayChoice(input: {
  choice: StayChoice;
  catalogRent?: number | null;
  catalogDeposit?: number | null;
}): {
  rentSnapshot: string;
  depositSnapshot: string;
  agreedTotal: string;
  clearExpectedExit: boolean;
} {
  const deposit =
    input.catalogDeposit != null && input.catalogDeposit > 0
      ? String(input.catalogDeposit)
      : '0';
  if (input.choice === 'SHORT') {
    return {
      rentSnapshot: '',
      depositSnapshot: deposit,
      agreedTotal: '',
      clearExpectedExit: true,
    };
  }
  if (input.choice === 'OPEN_ENDED') {
    // Daily rent is owner-entered; never prefill from monthly catalog rent.
    return {
      rentSnapshot: '',
      depositSnapshot: deposit,
      agreedTotal: '',
      clearExpectedExit: true,
    };
  }
  const rent =
    input.catalogRent != null && input.catalogRent > 0 ? String(input.catalogRent) : '';
  return {
    rentSnapshot: rent,
    depositSnapshot: deposit,
    agreedTotal: '',
    clearExpectedExit: false,
  };
}
