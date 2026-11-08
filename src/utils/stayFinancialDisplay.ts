import type { OccupancyResponse } from '../api/types';
import { formatContractAmount } from './occupancyContract';
import { shortStayNightCount } from './shortStay';

export type StayKind = 'MONTHLY' | 'SHORT' | 'OPEN_ENDED';

export type StayFinancialRow = {
  key: string;
  /** i18n key preferred; callers may use label as fallback display. */
  labelKey: string;
  labelDefault: string;
  value: string;
  emphasize?: boolean;
};

export type StayFinancialPresentation = {
  stayKind: StayKind;
  stayTypeLabelKey: string;
  stayTypeLabelDefault: string;
  rentUnit: 'month' | 'night' | 'day';
  rows: StayFinancialRow[];
};

function resolveStayKind(occupancy: Pick<OccupancyResponse, 'stayKind' | 'pricingBasis'>): StayKind {
  if (occupancy.stayKind === 'SHORT' || occupancy.stayKind === 'OPEN_ENDED') {
    return occupancy.stayKind;
  }
  if (occupancy.stayKind === 'MONTHLY') {
    return 'MONTHLY';
  }
  // Legacy SHORT fixed-total often has pricingBasis FIXED_TOTAL without stayKind.
  if (occupancy.pricingBasis === 'DAILY_RATE') {
    return 'OPEN_ENDED';
  }
  if (occupancy.pricingBasis === 'FIXED_TOTAL') {
    return 'SHORT';
  }
  return 'MONTHLY';
}

function exitYmd(occupancy: OccupancyResponse): string | null {
  const raw = occupancy.expectedCheckoutDate ?? occupancy.expectedExitDate ?? null;
  return raw?.slice(0, 10) ?? null;
}

function checkInYmd(occupancy: OccupancyResponse): string | null {
  const raw = occupancy.actualMoveInAt ?? occupancy.moveInDate ?? null;
  return raw?.slice(0, 10) ?? null;
}

function foodYesNo(occupancy: OccupancyResponse): StayFinancialRow {
  const included =
    Boolean(occupancy.foodIncludedInRent) || Boolean(occupancy.foodEnabled);
  return {
    key: 'food',
    labelKey: 'occupancy.contract.foodIncluded',
    labelDefault: 'Food included',
    value: included ? 'yes' : 'no',
  };
}

/**
 * Stay-type-aware contract presentation for Member Details, Deposit tab,
 * bed occupant panels, transfer/vacate — does not change billing math.
 */
export function buildStayFinancialPresentation(
  occupancy: OccupancyResponse,
  options?: { notRecorded?: string },
): StayFinancialPresentation {
  const notRecorded = options?.notRecorded ?? 'Not recorded';
  const stayKind = resolveStayKind(occupancy);
  const deposit = formatContractAmount(occupancy.depositSnapshot ?? 0, notRecorded);

  if (stayKind === 'SHORT') {
    const checkIn = checkInYmd(occupancy);
    const checkout = exitYmd(occupancy);
    const nights =
      checkIn && checkout ? shortStayNightCount(checkIn, checkout) : null;
    const daily =
      occupancy.rentSnapshot != null && occupancy.rentSnapshot > 0
        ? occupancy.rentSnapshot
        : occupancy.agreedTotal != null && nights != null && nights > 0
          ? occupancy.agreedTotal / nights
          : null;
    const stayRent =
      occupancy.agreedTotal != null && occupancy.agreedTotal > 0
        ? occupancy.agreedTotal
        : daily != null && nights != null
          ? daily * nights
          : null;
    const rows: StayFinancialRow[] = [
      {
        key: 'dailyRent',
        labelKey: 'occupancy.contract.dailyRentPerNight',
        labelDefault: 'Daily rent (per night)',
        value:
          daily != null
            ? `${formatContractAmount(daily, notRecorded)} / night`
            : notRecorded,
      },
    ];
    if (nights != null) {
      rows.push({
        key: 'duration',
        labelKey: 'occupancy.section.duration',
        labelDefault: 'Duration',
        value: `${nights} nights`,
      });
    }
    rows.push({
      key: 'stayRent',
      labelKey: 'occupancy.contract.stayRent',
      labelDefault: 'Total stay rent',
      value: formatContractAmount(stayRent, notRecorded),
    });
    rows.push(foodYesNo(occupancy));
    rows.push({
      key: 'deposit',
      labelKey: 'occupancy.contract.deposit',
      labelDefault: 'Security deposit (one-time)',
      value: deposit,
    });
    if (stayRent != null) {
      const payable = stayRent + Math.max(0, occupancy.depositSnapshot ?? 0);
      rows.push({
        key: 'totalPayable',
        labelKey: 'occupancy.contract.totalPayableAtMoveIn',
        labelDefault: 'Total payable at move-in',
        value: formatContractAmount(payable, notRecorded),
        emphasize: true,
      });
    }
    return {
      stayKind,
      stayTypeLabelKey: 'occupancy.section.shortStayChoice',
      stayTypeLabelDefault: 'Daily',
      rentUnit: 'night',
      rows,
    };
  }

  if (stayKind === 'OPEN_ENDED') {
    const rows: StayFinancialRow[] = [
      {
        key: 'dailyRent',
        labelKey: 'occupancy.contract.dailyRent',
        labelDefault: 'Daily rent',
        value:
          occupancy.rentSnapshot != null
            ? `${formatContractAmount(occupancy.rentSnapshot, notRecorded)} / day`
            : notRecorded,
      },
    ];
    if (occupancy.rentEffectiveMonth) {
      rows.push({
        key: 'rentEffectiveFrom',
        labelKey: 'occupancy.reviseRent.effectiveFrom',
        labelDefault: 'Rate effective from',
        value: occupancy.rentEffectiveMonth,
      });
    }
    if (occupancy.priorRentSnapshot != null) {
      rows.push({
        key: 'priorDailyRent',
        labelKey: 'occupancy.reviseRent.priorDaily',
        labelDefault: 'Previous daily rent',
        value: `${formatContractAmount(occupancy.priorRentSnapshot, notRecorded)} / day`,
      });
    }
    rows.push(foodYesNo(occupancy), {
      key: 'deposit',
      labelKey: 'occupancy.contract.deposit',
      labelDefault: 'Security deposit (one-time)',
      value: deposit,
    });
    return {
      stayKind,
      stayTypeLabelKey: 'occupancy.section.openEndedStayChoice',
      stayTypeLabelDefault: 'No Fixed Move-Out Date',
      rentUnit: 'day',
      rows,
    };
  }

  // MONTHLY
  const rent = formatContractAmount(occupancy.rentSnapshot, notRecorded);
  let monthlyTotal: number | null = occupancy.rentSnapshot ?? null;
  if (
    monthlyTotal != null &&
    occupancy.foodEnabled &&
    !occupancy.foodIncludedInRent
  ) {
    monthlyTotal += occupancy.foodChargeSnapshot ?? 0;
  }
  const rows: StayFinancialRow[] = [
    {
      key: 'monthlyRent',
      labelKey: 'occupancy.contract.rent',
      labelDefault: 'Monthly rent',
      value: rent,
    },
    foodYesNo(occupancy),
    {
      key: 'deposit',
      labelKey: 'occupancy.contract.deposit',
      labelDefault: 'Security deposit (one-time)',
      value: deposit,
    },
  ];
  if (monthlyTotal != null) {
    rows.push({
      key: 'monthlyTotal',
      labelKey:
        occupancy.foodEnabled && !occupancy.foodIncludedInRent
          ? 'occupancy.contract.monthlyTotalWithFood'
          : 'occupancy.contract.monthlyTotal',
      labelDefault:
        occupancy.foodEnabled && !occupancy.foodIncludedInRent
          ? 'Monthly total (rent + food)'
          : 'Monthly total',
      value: formatContractAmount(monthlyTotal, notRecorded),
      emphasize: true,
    });
  }
  return {
    stayKind,
    stayTypeLabelKey: 'occupancy.section.monthlyStayChoice',
    stayTypeLabelDefault: 'Monthly',
    rentUnit: 'month',
    rows,
  };
}

/** Compact rate for inventory cards when occupancy pricing is shown. */
export function formatOccupancyRentRate(
  occupancy: Pick<OccupancyResponse, 'stayKind' | 'pricingBasis' | 'rentSnapshot' | 'agreedTotal'>,
  notRecorded = 'Not recorded',
): { labelKey: string; labelDefault: string; value: string } {
  const stayKind = resolveStayKind(occupancy);
  if (stayKind === 'SHORT') {
    const daily = occupancy.rentSnapshot;
    return {
      labelKey: 'occupancy.contract.dailyRentPerNight',
      labelDefault: 'Daily rent (per night)',
      value:
        daily != null
          ? `${formatContractAmount(daily, notRecorded)} / night`
          : occupancy.agreedTotal != null
            ? formatContractAmount(occupancy.agreedTotal, notRecorded)
            : notRecorded,
    };
  }
  if (stayKind === 'OPEN_ENDED') {
    return {
      labelKey: 'occupancy.contract.dailyRent',
      labelDefault: 'Daily rent',
      value:
        occupancy.rentSnapshot != null
          ? `${formatContractAmount(occupancy.rentSnapshot, notRecorded)} / day`
          : notRecorded,
    };
  }
  return {
    labelKey: 'occupancy.contract.rent',
    labelDefault: 'Monthly rent',
    value: formatContractAmount(occupancy.rentSnapshot, notRecorded),
  };
}

export function resolveOccupancyStayKind(
  occupancy: Pick<OccupancyResponse, 'stayKind' | 'pricingBasis'>,
): StayKind {
  return resolveStayKind(occupancy);
}
