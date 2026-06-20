export type ComboPrice = {
  price?: number | null;
  currencyCode?: string | null;
};

const INR_SYMBOL = '₹';

export function formatComboPrice(
  price?: number | null,
  currencyCode?: string | null,
): string | null {
  if (price == null || Number.isNaN(price)) {
    return null;
  }
  const normalized = Number(price);
  if (normalized <= 0) {
    return null;
  }
  const amount = Number.isInteger(normalized)
    ? String(normalized)
    : normalized.toFixed(2).replace(/\.?0+$/, '');
  const code = (currencyCode ?? 'INR').toUpperCase();
  if (code === 'INR') {
    return `${INR_SYMBOL}${amount}`;
  }
  return `${code} ${amount}`;
}

export function formatComboPriceLabel(
  name: string,
  price?: number | null,
  currencyCode?: string | null,
): string {
  const formatted = formatComboPrice(price, currencyCode ?? 'INR');
  return formatted ? `${name}     ${formatted}` : name;
}

/** Combo label with price suffix, e.g. "Dal Rice Combo ₹60". */
export function formatComboNameWithPrice(
  name: string,
  price?: number | null,
  currencyCode?: string | null,
): string {
  const formatted = formatComboPrice(price, currencyCode ?? 'INR');
  return formatted ? `${name} ${formatted}` : name;
}

export function hasComboPrice(price?: number | null): boolean {
  return price != null && !Number.isNaN(price) && price > 0;
}

export function parsePriceInput(text: string): number | null {
  const trimmed = text.trim().replace(INR_SYMBOL, '').replace(/,/g, '');
  if (!trimmed) {
    return null;
  }
  const value = Number(trimmed);
  if (Number.isNaN(value)) {
    return null;
  }
  return value;
}

export function validatePriceInput(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  const value = parsePriceInput(trimmed);
  if (value == null) {
    return 'invalid';
  }
  if (value <= 0) {
    return 'nonPositive';
  }
  return null;
}

export function resolveMenuOptionPrice(
  option: ComboPrice & { comboId?: string | null; entryType?: string },
  comboById?: Map<string, ComboPrice>,
): number | null {
  if (option.entryType === 'PACKAGE') {
    return option.price ?? null;
  }
  if (option.price != null) {
    return option.price;
  }
  if (option.comboId && comboById) {
    return comboById.get(option.comboId)?.price ?? null;
  }
  return null;
}

export function resolveMenuOptionCurrency(
  option: ComboPrice & { comboId?: string | null; entryType?: string; currencyCode?: string | null },
  comboById?: Map<string, ComboPrice & { currencyCode?: string | null }>,
): string {
  if (option.entryType === 'PACKAGE') {
    return option.currencyCode ?? 'INR';
  }
  if (option.comboId && comboById?.get(option.comboId)?.currencyCode) {
    return comboById.get(option.comboId)!.currencyCode ?? 'INR';
  }
  return option.currencyCode ?? 'INR';
}
