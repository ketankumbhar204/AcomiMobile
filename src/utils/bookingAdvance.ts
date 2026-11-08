/**
 * Reservation-only booking advance helpers.
 * Agreed rent = first-period commitment; advance is a portion of that rent (not extra).
 */

export type BookingAdvanceDraft = {
  firstPeriodRent: number | null | undefined;
  bookingAdvanceText: string;
  collected?: boolean;
};

export type BookingAdvanceSplit = {
  firstPeriodRent: number;
  bookingAdvance: number;
  remainingRent: number;
};

export function parseMoneyText(value: string | null | undefined): number | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount)) {
    return null;
  }
  return amount;
}

export function resolveBookingAdvanceSplit(
  draft: BookingAdvanceDraft,
): { split: BookingAdvanceSplit | null; errorKey: string | null } {
  const rent = draft.firstPeriodRent;
  const advanceRaw = parseMoneyText(draft.bookingAdvanceText);
  if (advanceRaw == null || advanceRaw === 0) {
    return { split: null, errorKey: null };
  }
  if (advanceRaw < 0) {
    return { split: null, errorKey: 'occupancy.bookingAdvance.errors.negative' };
  }
  if (rent == null || !Number.isFinite(rent) || rent <= 0) {
    return { split: null, errorKey: 'occupancy.bookingAdvance.errors.rentRequired' };
  }
  if (advanceRaw > rent) {
    return { split: null, errorKey: 'occupancy.bookingAdvance.errors.exceedsRent' };
  }
  return {
    split: {
      firstPeriodRent: rent,
      bookingAdvance: advanceRaw,
      remainingRent: Math.round((rent - advanceRaw) * 100) / 100,
    },
    errorKey: null,
  };
}
