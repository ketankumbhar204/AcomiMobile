import type { PaymentCategory, UniversalPaymentType } from '../api/types';

export const CHARGE_CATEGORY_IDS = [
  'RENT',
  'DEPOSIT',
  'MAINTENANCE',
  'UTILITY',
  'MEALS',
  'SERVICE',
  'PENALTY',
  'OTHER',
] as const;

export type ChargeCategoryId = (typeof CHARGE_CATEGORY_IDS)[number];

export interface ChargeTypeOption {
  id: string;
  paymentType: UniversalPaymentType;
  paymentCategory: PaymentCategory;
  custom?: boolean;
}

export const CHARGE_TYPES: Record<ChargeCategoryId, ChargeTypeOption[]> = {
  RENT: [
    { id: 'RENT', paymentType: 'RENT', paymentCategory: 'EXTRA' },
    { id: 'ADVANCE_RENT', paymentType: 'RENT', paymentCategory: 'ADVANCE' },
    { id: 'NOTICE_PERIOD', paymentType: 'RENT', paymentCategory: 'EXTRA' },
  ],
  DEPOSIT: [
    { id: 'SECURITY_DEPOSIT', paymentType: 'DEPOSIT', paymentCategory: 'SECURITY' },
    { id: 'DEPOSIT_ADJUSTMENT', paymentType: 'DEPOSIT', paymentCategory: 'EXTRA' },
  ],
  MAINTENANCE: [
    { id: 'MAINTENANCE', paymentType: 'MAINTENANCE', paymentCategory: 'EXTRA' },
    { id: 'REPAIR', paymentType: 'MAINTENANCE', paymentCategory: 'EXTRA' },
    { id: 'DAMAGE', paymentType: 'MAINTENANCE', paymentCategory: 'EXTRA' },
    { id: 'FURNITURE_DAMAGE', paymentType: 'MAINTENANCE', paymentCategory: 'EXTRA' },
    { id: 'EQUIPMENT_DAMAGE', paymentType: 'MAINTENANCE', paymentCategory: 'EXTRA' },
  ],
  UTILITY: [
    { id: 'ELECTRICITY', paymentType: 'UTILITY', paymentCategory: 'ELECTRICITY' },
    { id: 'WATER', paymentType: 'UTILITY', paymentCategory: 'WATER' },
    { id: 'GAS', paymentType: 'UTILITY', paymentCategory: 'GAS' },
    { id: 'INTERNET', paymentType: 'UTILITY', paymentCategory: 'INTERNET' },
    { id: 'OTHER_UTILITY', paymentType: 'UTILITY', paymentCategory: 'OTHER' },
  ],
  MEALS: [
    { id: 'MEAL_PLAN', paymentType: 'MEAL', paymentCategory: 'EXTRA' },
    { id: 'EXTRA_MEALS', paymentType: 'MEAL', paymentCategory: 'EXTRA' },
    { id: 'MEAL_ADJUSTMENT', paymentType: 'MEAL', paymentCategory: 'OTHER' },
    { id: 'OTHER_MEAL', paymentType: 'MEAL', paymentCategory: 'OTHER', custom: true },
  ],
  SERVICE: [
    { id: 'LAUNDRY', paymentType: 'SERVICE', paymentCategory: 'EXTRA' },
    { id: 'CLEANING', paymentType: 'SERVICE', paymentCategory: 'EXTRA' },
    { id: 'PARKING', paymentType: 'SERVICE', paymentCategory: 'EXTRA' },
    { id: 'KEY_REPLACEMENT', paymentType: 'SERVICE', paymentCategory: 'EXTRA' },
    { id: 'ACCESS_CARD', paymentType: 'SERVICE', paymentCategory: 'EXTRA' },
    { id: 'APPLIANCE', paymentType: 'SERVICE', paymentCategory: 'EXTRA' },
    { id: 'MOVE_IN', paymentType: 'SERVICE', paymentCategory: 'EXTRA' },
    { id: 'MOVE_OUT', paymentType: 'SERVICE', paymentCategory: 'EXTRA' },
    { id: 'ROOM_CHANGE', paymentType: 'SERVICE', paymentCategory: 'EXTRA' },
    { id: 'OTHER_SERVICE', paymentType: 'SERVICE', paymentCategory: 'OTHER', custom: true },
  ],
  PENALTY: [
    { id: 'LATE_FEE', paymentType: 'PENALTY', paymentCategory: 'EXTRA' },
    { id: 'FINE', paymentType: 'PENALTY', paymentCategory: 'EXTRA' },
    { id: 'OTHER_PENALTY', paymentType: 'PENALTY', paymentCategory: 'OTHER', custom: true },
  ],
  OTHER: [
    { id: 'MISCELLANEOUS', paymentType: 'OTHER', paymentCategory: 'OTHER' },
    { id: 'OTHER', paymentType: 'OTHER', paymentCategory: 'OTHER', custom: true },
  ],
};

export interface ManualChargeDraft {
  paymentType: UniversalPaymentType;
  paymentCategory: PaymentCategory;
  title: string;
  description?: string;
}

export function parsePositiveAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('-')) {
    return null;
  }
  const normalized = trimmed.replace(/,/g, '').replace(/[^\d.]/g, '');
  if (!normalized || normalized === '.') {
    return null;
  }
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return Math.round(amount * 100) / 100;
}

export function buildManualCharge(input: {
  category: ChargeCategoryId | '';
  typeId: string;
  typeLabel: string;
  customLabel: string;
  description: string;
}): ManualChargeDraft | null {
  if (!input.category) {
    return null;
  }
  const type = CHARGE_TYPES[input.category].find(option => option.id === input.typeId);
  if (!type) {
    return null;
  }
  const title = (type.custom ? input.customLabel : input.typeLabel).trim();
  if (!title) {
    return null;
  }
  const description = input.description.trim();
  return {
    paymentType: type.paymentType,
    paymentCategory: type.paymentCategory,
    title: title.slice(0, 200),
    description: description ? description.slice(0, 500) : undefined,
  };
}

export function isChargeablePaymentMember(member: { role: string; status: string }): boolean {
  return member.status === 'ACTIVE' && member.role !== 'OWNER' && member.role !== 'MANAGER';
}

export interface CatalogChargeType extends ChargeTypeOption {
  category: ChargeCategoryId;
}

/** Charge types in catalog order, each carrying the category it already belongs to. */
export function listCatalogChargeTypes(): CatalogChargeType[] {
  return CHARGE_CATEGORY_IDS.flatMap(category =>
    CHARGE_TYPES[category].map(option => ({ ...option, category })),
  );
}

export function findCatalogChargeType(typeId: string): CatalogChargeType | undefined {
  return listCatalogChargeTypes().find(option => option.id === typeId);
}

/** Ignore spaces and punctuation so "wifi" matches "Wi-Fi". */
export function normalizeChargeSearch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function chargeTypeMatchesQuery(label: string, query: string): boolean {
  const normalizedQuery = normalizeChargeSearch(query);
  if (!normalizedQuery) {
    return true;
  }
  return normalizeChargeSearch(label).includes(normalizedQuery);
}

export function memberMatchesPaymentSearch(
  member: { memberId: string; fullName: string; mobileNumber?: string | null },
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return [member.fullName, member.mobileNumber ?? '', member.memberId]
    .join(' ')
    .toLowerCase()
    .includes(normalized);
}
