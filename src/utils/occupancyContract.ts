import type {
  ContractSnapshotInput,
  OccupancyChargeCode,
  OccupancyChargeLine,
  OccupancyResponse,
  TransferRentPolicy,
} from '../api/types';
import type { TargetCatalogDefaults } from './fetchTargetCatalogDefaults';
import type { SpaceFoodPolicy } from './fetchSpaceFoodPolicy';

export const OCCUPANCY_CHARGE_CODES: OccupancyChargeCode[] = [
  'PARKING',
  'LAUNDRY',
  'ELECTRICITY',
  'WIFI',
  'MAINTENANCE',
  'OTHER',
];

export const MAX_OTHER_CHARGES = 10;

export type ContractTermsFormValues = {
  rentSnapshot: string;
  depositSnapshot: string;
  foodEnabled: boolean;
  foodChargeSnapshot: string;
  otherCharges: OccupancyChargeLine[];
};

function parseAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

export function hasSeparateFoodChargePolicy(foodPolicy?: SpaceFoodPolicy): boolean {
  return (
    Boolean(foodPolicy) &&
    !foodPolicy!.foodIncludedInRent &&
    foodPolicy!.defaultFoodCharge != null &&
    foodPolicy!.defaultFoodCharge > 0
  );
}

export function isFoodBundledWithRent(
  values: ContractTermsFormValues,
  foodPolicy?: SpaceFoodPolicy,
): boolean {
  if (!values.foodEnabled) {
    return false;
  }
  if (foodPolicy?.foodIncludedInRent) {
    return true;
  }
  return !hasSeparateFoodChargePolicy(foodPolicy);
}

export function emptyContractTermsFormValues(
  catalog?: TargetCatalogDefaults,
  foodPolicy?: SpaceFoodPolicy,
): ContractTermsFormValues {
  return {
    rentSnapshot:
      catalog?.defaultRent != null && catalog.defaultRent > 0
        ? String(catalog.defaultRent)
        : '',
    depositSnapshot:
      catalog?.defaultDeposit != null && catalog.defaultDeposit > 0
        ? String(catalog.defaultDeposit)
        : '0',
    foodEnabled: true,
    foodChargeSnapshot: '',
    otherCharges: [],
  };
}

export function contractTermsFromOccupancy(
  occupancy: OccupancyResponse,
): ContractTermsFormValues {
  return {
    rentSnapshot:
      occupancy.rentSnapshot != null ? String(occupancy.rentSnapshot) : '',
    depositSnapshot:
      occupancy.depositSnapshot != null ? String(occupancy.depositSnapshot) : '0',
    foodEnabled: occupancy.foodIncludedInRent
      ? true
      : Boolean(occupancy.foodEnabled),
    foodChargeSnapshot:
      occupancy.foodIncludedInRent
        ? ''
        : occupancy.foodChargeSnapshot != null
          ? String(occupancy.foodChargeSnapshot)
          : '',
    otherCharges:
      occupancy.otherCharges?.map(charge => ({
        code: charge.code,
        label: charge.label,
        amount: charge.amount,
      })) ?? [],
  };
}

export function resolveContractFoodPolicy(
  spacePolicy: SpaceFoodPolicy,
  occupancy?: OccupancyResponse | null,
): SpaceFoodPolicy {
  if (occupancy?.foodIncludedInRent) {
    return { foodIncludedInRent: true, defaultFoodCharge: null };
  }
  return spacePolicy;
}

export function computeMonthlyRentFoodTotal(
  values: ContractTermsFormValues,
  foodPolicy?: SpaceFoodPolicy,
): number | null {
  const rent = parseAmount(values.rentSnapshot);
  if (rent == null) {
    return null;
  }

  if (foodPolicy?.foodIncludedInRent || isFoodBundledWithRent(values, foodPolicy)) {
    return rent;
  }

  if (!values.foodEnabled) {
    return rent;
  }

  const food =
    parseAmount(values.foodChargeSnapshot) ?? foodPolicy?.defaultFoodCharge ?? 0;
  return rent + food;
}

/** True when the monthly total line should read "rent + food" (separate food charge is active). */
export function monthlyTotalIncludesFoodFromForm(
  values: ContractTermsFormValues,
  foodPolicy?: SpaceFoodPolicy,
): boolean {
  if (!values.foodEnabled) {
    return false;
  }
  return hasSeparateFoodChargePolicy(foodPolicy);
}

export function monthlyTotalIncludesFoodFromOccupancy(
  occupancy: OccupancyResponse,
): boolean {
  if (occupancy.foodIncludedInRent) {
    return false;
  }
  return Boolean(occupancy.foodEnabled);
}

export function monthlyTotalLabelKey(includesFood: boolean): string {
  return includesFood
    ? 'occupancy.contract.monthlyTotalWithFood'
    : 'occupancy.contract.monthlyTotal';
}

export function validateContractTerms(
  values: ContractTermsFormValues,
  options: {
    rentRequired: boolean;
    catalogDefaultRent?: number | null;
    foodPolicy?: SpaceFoodPolicy;
  },
): string | null {
  const foodIncludedInRent = options.foodPolicy?.foodIncludedInRent ?? false;
  const rentEntered = parseAmount(values.rentSnapshot);
  const hasRent =
    rentEntered != null ||
    (options.catalogDefaultRent != null && options.catalogDefaultRent > 0);

  if (options.rentRequired && !hasRent) {
    return 'occupancy.contract.errors.rentRequired';
  }

  if (values.depositSnapshot.trim()) {
    const deposit = parseAmount(values.depositSnapshot);
    if (deposit == null) {
      return 'occupancy.contract.errors.depositInvalid';
    }
  }

  if (values.foodEnabled && !foodIncludedInRent) {
    const foodCharge = parseAmount(values.foodChargeSnapshot);
    if (foodCharge != null && foodCharge < 0) {
      return 'occupancy.contract.errors.foodChargeInvalid';
    }
  }

  if (values.otherCharges.length > MAX_OTHER_CHARGES) {
    return 'occupancy.contract.errors.tooManyCharges';
  }

  for (const charge of values.otherCharges) {
    const effectiveLabel =
      charge.code === 'OTHER'
        ? charge.label.trim()
        : charge.label.trim() || charge.code;
    if (charge.code === 'OTHER' && !effectiveLabel) {
      return 'occupancy.contract.errors.chargeLabelRequired';
    }
    if (!Number.isFinite(charge.amount) || charge.amount < 0) {
      return 'occupancy.contract.errors.chargeAmountInvalid';
    }
  }

  return null;
}

/** Resolve food charge for activation payloads: request → space default → 0. */
export function resolveSubmitFoodChargeSnapshot(
  values: ContractTermsFormValues,
  foodPolicy?: SpaceFoodPolicy,
): number {
  const parsed = parseAmount(values.foodChargeSnapshot);
  if (parsed != null) {
    return parsed;
  }
  if (foodPolicy?.defaultFoodCharge != null && foodPolicy.defaultFoodCharge > 0) {
    return foodPolicy.defaultFoodCharge;
  }
  return 0;
}

export function buildContractSnapshotPayload(
  values: ContractTermsFormValues,
  options?: {
    includeRent?: boolean;
    includeDeposit?: boolean;
    includeFood?: boolean;
    foodPolicy?: SpaceFoodPolicy;
  },
): ContractSnapshotInput {
  const includeRent = options?.includeRent !== false;
  const includeDeposit = options?.includeDeposit !== false;
  const includeFood = options?.includeFood !== false;

  const payload: ContractSnapshotInput = {};

  if (includeRent) {
    const rent = parseAmount(values.rentSnapshot);
    if (rent != null) {
      payload.rentSnapshot = rent;
    }
  }

  if (includeDeposit) {
    const deposit = parseAmount(values.depositSnapshot);
    payload.depositSnapshot = deposit ?? 0;
  }

  if (includeFood) {
    if (isFoodBundledWithRent(values, options?.foodPolicy)) {
      payload.foodEnabled = true;
      payload.foodChargeSnapshot = null;
      payload.foodIncludedInRent = true;
    } else if (values.foodEnabled) {
      payload.foodEnabled = true;
      payload.foodIncludedInRent = false;
      payload.foodChargeSnapshot = resolveSubmitFoodChargeSnapshot(values, options?.foodPolicy);
    } else {
      payload.foodEnabled = false;
      payload.foodIncludedInRent = false;
      payload.foodChargeSnapshot = null;
    }
  }

  if (values.otherCharges.length > 0) {
    payload.otherCharges = values.otherCharges.map(charge => ({
      code: charge.code,
      label: charge.label.trim(),
      amount: charge.amount,
    }));
  }

  return payload;
}

export function buildTransferContractPayload(
  rentPolicy: TransferRentPolicy,
  values: ContractTermsFormValues,
  foodPolicy?: SpaceFoodPolicy,
): Pick<
  ContractSnapshotInput,
  | 'rentSnapshot'
  | 'depositSnapshot'
  | 'foodEnabled'
  | 'foodChargeSnapshot'
  | 'foodIncludedInRent'
  | 'otherCharges'
> & { rentPolicy: TransferRentPolicy } {
  const foodIncludedInRent = foodPolicy?.foodIncludedInRent ?? false;

  if (rentPolicy === 'KEEP') {
    const bundledFood = isFoodBundledWithRent(values, foodPolicy);
    return {
      rentPolicy,
      foodEnabled: values.foodEnabled,
      foodIncludedInRent: bundledFood,
      foodChargeSnapshot:
        bundledFood || !values.foodEnabled
          ? null
          : resolveSubmitFoodChargeSnapshot(values, foodPolicy),
      otherCharges:
        values.otherCharges.length > 0
          ? values.otherCharges.map(charge => ({
              code: charge.code,
              label: charge.label.trim(),
              amount: charge.amount,
            }))
          : [],
    };
  }

  const snapshot = buildContractSnapshotPayload(values, {
    includeRent: rentPolicy === 'CUSTOM' || rentPolicy === 'APPLY_NEW',
    includeDeposit: true,
    includeFood: true,
    foodPolicy,
  });

  return {
    rentPolicy,
    ...snapshot,
  };
}

export function formatContractAmount(
  value?: number | null,
  notRecordedLabel = 'Not recorded',
): string {
  if (value == null) {
    return notRecordedLabel;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

export function computeOccupancyMonthlyTotal(
  occupancy: OccupancyResponse,
): number | null {
  if (occupancy.rentSnapshot == null) {
    return null;
  }

  if (occupancy.foodIncludedInRent) {
    return occupancy.rentSnapshot;
  }

  if (!occupancy.foodEnabled) {
    return occupancy.rentSnapshot;
  }

  return occupancy.rentSnapshot + (occupancy.foodChargeSnapshot ?? 0);
}

export function isOccupancyBillableInMonth(
  occupancy: OccupancyResponse,
  month: string,
): boolean {
  if (occupancy.status === 'RESERVED') {
    return false;
  }

  const [year, monthNum] = month.split('-').map(Number);
  const monthStart = `${month}-01`;
  const lastDay = new Date(year, monthNum, 0).getDate();
  const monthEnd = `${month}-${String(lastDay).padStart(2, '0')}`;

  const startDate = (occupancy.actualMoveInAt ?? occupancy.moveInDate)?.slice(0, 10);
  if (!startDate || startDate > monthEnd) {
    return false;
  }

  const vacatedDate = occupancy.vacatedAt?.slice(0, 10);
  if (vacatedDate && vacatedDate < monthStart) {
    return false;
  }

  return occupancy.status === 'ACTIVE' || occupancy.status === 'VACATED';
}

export function computeOccupancyMonthlyTotalForMonth(
  occupancy: OccupancyResponse,
  month: string,
): number | null {
  if (!isOccupancyBillableInMonth(occupancy, month)) {
    return null;
  }
  return computeOccupancyMonthlyTotal(occupancy);
}

export function hasContractSnapshot(occupancy: OccupancyResponse): boolean {
  return (
    occupancy.status === 'ACTIVE' &&
    (occupancy.rentSnapshot != null ||
      occupancy.depositSnapshot != null ||
      Boolean(occupancy.foodEnabled) ||
      Boolean(occupancy.foodIncludedInRent) ||
      (occupancy.otherCharges?.length ?? 0) > 0 ||
      occupancy.pricingLockedAt != null)
  );
}
