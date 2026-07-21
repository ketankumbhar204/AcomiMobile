export type ComboIncludeItem = {
  name: string;
  quantity?: number | null;
};

/** Normalize stored/API quantity; missing → 1. */
export function normalizeComboItemQuantity(quantity?: number | null): number {
  if (quantity == null || !Number.isFinite(quantity) || quantity < 1) {
    return 1;
  }
  return Math.floor(quantity);
}

/** Single include line: "Rice" or "3 Chapati". */
export function formatComboIncludeLine(name: string, quantity?: number | null): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '';
  }
  const qty = normalizeComboItemQuantity(quantity);
  return qty > 1 ? `${qty} ${trimmed}` : trimmed;
}

export function formatComboIncludeLines(items: ComboIncludeItem[]): string[] {
  return items
    .map(item => formatComboIncludeLine(item.name, item.quantity))
    .filter(Boolean);
}

/** Compact: "3 Chapati · Rice · Dal" */
export function formatComboIncludesCompact(
  items: ComboIncludeItem[],
  separator = ' · ',
): string {
  return formatComboIncludeLines(items).join(separator);
}

export function buildItemQuantitiesPayload(
  itemIds: string[],
  quantities: Record<string, number>,
): Array<{ itemId: string; quantity: number }> {
  return itemIds.map(itemId => ({
    itemId,
    quantity: normalizeComboItemQuantity(quantities[itemId]),
  }));
}

/** Keep quantity map aligned with selected ids (default 1 for new). */
export function syncItemQuantities(
  prev: Record<string, number>,
  selectedIds: string[],
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const id of selectedIds) {
    next[id] = normalizeComboItemQuantity(prev[id]);
  }
  return next;
}
