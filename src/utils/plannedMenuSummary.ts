type PlannedEntryLike = {
  entryType?: 'COMBO' | 'ITEM' | 'PACKAGE' | string | null;
  comboId?: string | null;
  itemId?: string | null;
  itemIds?: string[] | null;
  packageItems?: Array<{ itemId?: string; name?: string }> | null;
};

export type PlannedMenuCounts = {
  combos: number;
  items: number;
  total: number;
};

function packageItemCount(option: PlannedEntryLike): number {
  if (option.packageItems?.length) {
    return option.packageItems.length;
  }
  if (option.itemIds?.length) {
    return option.itemIds.length;
  }
  return 1;
}

function inferEntryType(option: PlannedEntryLike): 'COMBO' | 'ITEM' | 'PACKAGE' {
  if (option.entryType === 'COMBO' || option.entryType === 'ITEM' || option.entryType === 'PACKAGE') {
    return option.entryType;
  }
  if (option.comboId) {
    return 'COMBO';
  }
  if (option.itemId) {
    return 'ITEM';
  }
  return 'PACKAGE';
}

export function countPlannedEntries(options: PlannedEntryLike[]): PlannedMenuCounts {
  let combos = 0;
  let items = 0;

  for (const option of options) {
    const entryType = inferEntryType(option);
    if (entryType === 'COMBO') {
      combos += 1;
      continue;
    }
    if (entryType === 'ITEM') {
      items += 1;
      continue;
    }
    if (packageItemCount(option) <= 1) {
      items += 1;
    } else {
      combos += 1;
    }
  }

  return { combos, items, total: combos + items };
}

export function plannedSummaryI18nKey(counts: Pick<PlannedMenuCounts, 'combos' | 'items'>): string {
  if (counts.items > 0 && counts.combos === 0) {
    return 'meals.menu.plannedSummaryItems';
  }
  if (counts.combos > 0 && counts.items === 0) {
    return 'meals.menu.plannedSummaryCombos';
  }
  return 'meals.menu.plannedSummaryMixed';
}

export function moreChoicesI18nKey(counts: Pick<PlannedMenuCounts, 'combos' | 'items'>): string {
  if (counts.items > 0 && counts.combos === 0) {
    return 'meals.menu.moreItems';
  }
  if (counts.combos > 0 && counts.items === 0) {
    return 'meals.menu.moreCombos';
  }
  return 'meals.menu.moreChoices';
}

export function showLessI18nKey(counts: Pick<PlannedMenuCounts, 'combos' | 'items'>): string {
  if (counts.items > 0 && counts.combos === 0) {
    return 'meals.menu.showLessItems';
  }
  if (counts.combos > 0 && counts.items === 0) {
    return 'meals.menu.showLessCombos';
  }
  return 'meals.menu.showLess';
}

export type PlannedEntryKind = 'combo' | 'item';

export function getPlannedEntryKind(option: PlannedEntryLike): PlannedEntryKind {
  const entryType = inferEntryType(option);
  if (entryType === 'COMBO') {
    return 'combo';
  }
  if (entryType === 'ITEM') {
    return 'item';
  }
  return packageItemCount(option) <= 1 ? 'item' : 'combo';
}

export function plannedEntryKindI18nKey(kind: PlannedEntryKind): string {
  return kind === 'combo' ? 'meals.menu.entryKindCombo' : 'meals.menu.entryKindItem';
}
