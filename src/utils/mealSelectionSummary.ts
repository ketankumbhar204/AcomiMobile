import type {
  MealDeliveryLocation,
  MealPollSlot,
  MealType,
  MemberMealActivityDay,
  MemberMealActivityDayDetail,
  MemberMealActivityMonth,
  MemberMealActivitySlot,
  MemberMealActivitySlotDetail,
  UUID,
} from '../api/types';
import { MEAL_TYPES } from './mealLabels';

export type MealSummaryLineItem = {
  label: string;
  quantity: number;
  /** Unit price of the combo/item (when known). */
  unitPrice?: number | null;
  /** line total = unit × quantity (when known). */
  lineAmount?: number | null;
  currencyCode?: string | null;
};

export type MealSummarySection = {
  mealType: MealType;
  /** ISO date when summarizing a multi-day (monthly) bill. */
  date?: string;
  items: MealSummaryLineItem[];
  subtotal?: number | null;
  currencyCode?: string | null;
  /** Optional delivery location label for this meal (Mess). */
  deliveryLocationName?: string | null;
};

export type MealSelectionSummaryModel = {
  sections: MealSummarySection[];
  totalPlates: number;
  totalAmount: number;
  currencyCode: string;
  selectedMealTypes: MealType[];
};

function sumLineAmounts(items: MealSummaryLineItem[]): number {
  return items.reduce((sum, item) => {
    if (item.lineAmount != null) {
      return sum + Number(item.lineAmount);
    }
    return sum;
  }, 0);
}

function sumQuantities(items: MealSummaryLineItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Build summary from open/display poll slots (dashboard customer card). */
export function buildMealSummaryFromPolls(
  polls: MealPollSlot[],
  multiQuantity: boolean,
): MealSelectionSummaryModel {
  const byType = new Map(polls.map(poll => [poll.mealType, poll]));
  const sections: MealSummarySection[] = [];
  let totalPlates = 0;
  let totalAmount = 0;
  let currencyCode = 'INR';
  const selectedMealTypes: MealType[] = [];

  for (const mealType of MEAL_TYPES) {
    const poll = byType.get(mealType);
    if (!poll) {
      continue;
    }

    const items: MealSummaryLineItem[] = [];
    if (multiQuantity) {
      for (const selection of poll.mySelections ?? []) {
        if (selection.quantity <= 0) {
          continue;
        }
        const option = poll.options.find(row => row.id === selection.optionId);
        if (!option || option.optionType !== 'MENU_ENTRY') {
          continue;
        }
        const unit = option.price != null ? Number(option.price) : 0;
        items.push({
          label: option.label,
          quantity: selection.quantity,
          unitPrice: option.price != null ? Number(option.price) : null,
          lineAmount: unit * selection.quantity,
          currencyCode: option.currencyCode ?? 'INR',
        });
        if (option.currencyCode) {
          currencyCode = option.currencyCode;
        }
      }
    } else if (poll.mySelectedOptionId) {
      const option = poll.options.find(row => row.id === poll.mySelectedOptionId);
      if (option) {
        items.push({
          label: option.label,
          quantity: 1,
          unitPrice: option.price != null ? Number(option.price) : null,
          lineAmount: option.price != null ? Number(option.price) : null,
          currencyCode: option.currencyCode ?? 'INR',
        });
        if (option.currencyCode) {
          currencyCode = option.currencyCode;
        }
      }
    }

    const subtotal = items.length > 0 ? sumLineAmounts(items) : null;
    const plates = sumQuantities(items);
    totalPlates += plates;
    totalAmount += subtotal ?? 0;
    if (items.length > 0) {
      selectedMealTypes.push(mealType);
    }

    sections.push({
      mealType,
      items,
      subtotal,
      currencyCode,
    });
  }

  return {
    sections,
    totalPlates,
    totalAmount,
    currencyCode,
    selectedMealTypes,
  };
}

/**
 * Build a meal summary from the customer's in-progress draft selections
 * (before save / on the Review & Payment step).
 */
export function buildMealSummaryFromDraftSelections(
  polls: MealPollSlot[],
  multiQuantity: boolean,
  selections: Partial<Record<MealType, UUID>>,
  quantitySelections: Partial<Record<MealType, Record<UUID, number>>>,
  deliverySelections?: Partial<Record<MealType, UUID>>,
  deliveryLocations?: MealDeliveryLocation[],
): MealSelectionSummaryModel {
  const byType = new Map(polls.map(poll => [poll.mealType, poll]));
  const locationById = new Map((deliveryLocations ?? []).map(loc => [loc.id, loc]));
  const sections: MealSummarySection[] = [];
  let totalPlates = 0;
  let totalAmount = 0;
  let currencyCode = 'INR';
  const selectedMealTypes: MealType[] = [];

  for (const mealType of MEAL_TYPES) {
    const poll = byType.get(mealType);
    if (!poll) {
      continue;
    }

    const items: MealSummaryLineItem[] = [];
    if (multiQuantity) {
      const qtyMap = quantitySelections[mealType] ?? {};
      for (const option of poll.options) {
        if (option.optionType !== 'MENU_ENTRY') {
          continue;
        }
        const quantity = qtyMap[option.id] ?? 0;
        if (quantity <= 0) {
          continue;
        }
        const unit = option.price != null ? Number(option.price) : 0;
        items.push({
          label: option.label,
          quantity,
          unitPrice: option.price != null ? Number(option.price) : null,
          lineAmount: unit * quantity,
          currencyCode: option.currencyCode ?? 'INR',
        });
        if (option.currencyCode) {
          currencyCode = option.currencyCode;
        }
      }
    } else {
      const selectedId = selections[mealType];
      const option = selectedId
        ? poll.options.find(row => row.id === selectedId)
        : undefined;
      if (option) {
        items.push({
          label: option.label,
          quantity: 1,
          unitPrice: option.price != null ? Number(option.price) : null,
          lineAmount: option.price != null ? Number(option.price) : null,
          currencyCode: option.currencyCode ?? 'INR',
        });
        if (option.currencyCode) {
          currencyCode = option.currencyCode;
        }
      }
    }

    const subtotal = items.length > 0 ? sumLineAmounts(items) : null;
    const plates = sumQuantities(items);
    totalPlates += plates;
    totalAmount += subtotal ?? 0;
    if (items.length > 0) {
      selectedMealTypes.push(mealType);
    }

    const deliveryId = deliverySelections?.[mealType];
    const deliveryLocationName =
      items.length > 0 && deliveryId
        ? locationById.get(deliveryId)?.name ?? null
        : null;

    sections.push({
      mealType,
      items,
      subtotal,
      currencyCode,
      deliveryLocationName,
    });
  }

  return {
    sections,
    totalPlates,
    totalAmount,
    currencyCode,
    selectedMealTypes,
  };
}

/** Parse "Chicken Thali, Dal Rice Combo × 2" style labels from month activity. */
function parseSelectionLabelParts(
  selectionLabel: string | null | undefined,
  fallbackQuantity: number,
  slotAmount: number | null,
  currencyCode: string,
): MealSummaryLineItem[] {
  const raw = (selectionLabel ?? '').trim();
  if (!raw) {
    return [
      {
        label: 'Selection',
        quantity: fallbackQuantity > 0 ? fallbackQuantity : 1,
        lineAmount: slotAmount,
        currencyCode,
      },
    ];
  }

  const parts = raw.split(',').map(part => part.trim()).filter(Boolean);
  if (parts.length <= 1) {
    const match = raw.match(/^(.*?)(?:\s*[×x]\s*(\d+))?$/i);
    const label = (match?.[1] ?? raw).trim() || raw;
    const quantity = match?.[2] ? Number(match[2]) : fallbackQuantity > 0 ? fallbackQuantity : 1;
    return [
      {
        label,
        quantity,
        lineAmount: slotAmount,
        currencyCode,
      },
    ];
  }

  return parts.map(part => {
    const match = part.match(/^(.*?)(?:\s*[×x]\s*(\d+))?$/i);
    const label = (match?.[1] ?? part).trim() || part;
    const quantity = match?.[2] ? Number(match[2]) : 1;
    return {
      label,
      quantity,
      lineAmount: null,
      currencyCode,
    };
  });
}

function slotToSection(dayDate: string, slot: MemberMealActivitySlot): MealSummarySection | null {
  if (slot.status !== 'ACCEPTED') {
    return {
      mealType: slot.mealType,
      date: dayDate,
      items: [],
      subtotal: null,
      currencyCode: slot.currencyCode ?? 'INR',
    };
  }

  const quantity = slot.quantity != null && slot.quantity > 0 ? Number(slot.quantity) : 1;
  const currencyCode = slot.currencyCode ?? 'INR';
  const slotAmount = slot.slotAmount != null ? Number(slot.slotAmount) : null;
  const items = parseSelectionLabelParts(slot.selectionLabel, quantity, slotAmount, currencyCode);

  return {
    mealType: slot.mealType,
    date: dayDate,
    items,
    subtotal: slotAmount,
    currencyCode,
  };
}

/** Month activity → payment meal summary (existing API, no new endpoints). */
export function buildMealSummaryFromActivityMonth(
  activity: MemberMealActivityMonth | null | undefined,
): MealSelectionSummaryModel | null {
  if (!activity?.days?.length) {
    return null;
  }

  const sections: MealSummarySection[] = [];
  let totalPlates = 0;
  let totalAmount = 0;
  let currencyCode = activity.summary.currencyCode ?? 'INR';
  const selectedMealTypes = new Set<MealType>();

  const days = [...activity.days].sort((a, b) => a.date.localeCompare(b.date));
  for (const day of days) {
    const dayTotal = day.dayTotal != null ? Number(day.dayTotal) : 0;
    const hasAccepted = day.slots.some(slot => slot.status === 'ACCEPTED');
    if (!hasAccepted && dayTotal <= 0) {
      continue;
    }

    for (const mealType of MEAL_TYPES) {
      const slot = day.slots.find(row => row.mealType === mealType);
      if (!slot) {
        continue;
      }
      if (slot.status !== 'ACCEPTED' && slot.status !== 'SKIPPED' && slot.status !== 'PENDING') {
        // Still show NO_MENU / INACTIVE only when day has other activity? Skip empty noise.
        if (slot.status === 'NO_MENU' || slot.status === 'INACTIVE') {
          continue;
        }
      }

      const section = slotToSection(day.date, slot);
      if (!section) {
        continue;
      }
      // Include Not Selected (PENDING/SKIPPED with no items) only for days that otherwise have charges
      if (section.items.length === 0 && dayTotal <= 0 && !hasAccepted) {
        continue;
      }
      if (section.items.length === 0 && slot.status !== 'ACCEPTED') {
        // Show Not Selected for published-but-skipped meals on active days
        if (slot.status === 'SKIPPED' || slot.status === 'PENDING') {
          sections.push(section);
        }
        continue;
      }
      if (section.items.length > 0) {
        selectedMealTypes.add(mealType);
        totalPlates += sumQuantities(section.items);
        totalAmount += section.subtotal ?? 0;
        if (section.currencyCode) {
          currencyCode = section.currencyCode;
        }
      }
      sections.push(section);
    }
  }

  if (sections.length === 0) {
    return null;
  }

  // Prefer payment/activity month totals when present
  const summaryAmount =
    activity.summary.amountGenerated != null
      ? Number(activity.summary.amountGenerated)
      : totalAmount;
  const summaryPlates =
    activity.summary.acceptedMeals != null ? Number(activity.summary.acceptedMeals) : totalPlates;

  return {
    sections,
    totalPlates: summaryPlates > 0 ? summaryPlates : totalPlates,
    totalAmount: summaryAmount > 0 ? summaryAmount : totalAmount,
    currencyCode,
    selectedMealTypes: [...selectedMealTypes],
  };
}

export function mealTypesCompactLabel(
  mealTypes: MealType[],
  labelFor: (mealType: MealType) => string,
): string {
  return mealTypes.map(labelFor).join(' • ');
}

/**
 * Payment-centric label for a meal ledger row.
 * Billing period is shown separately — do not embed the month in this title.
 */
export function displayMealPaymentTitle(
  paymentTitle: string,
  _monthKey?: string,
  _formatMonth?: (monthKey: string) => string,
): string {
  const trimmed = paymentTitle.trim();
  if (
    /^meals?\s*[—–-]/i.test(trimmed) ||
    /^meal\s+charges\b/i.test(trimmed) ||
    /^meal\s+payment\b/i.test(trimmed) ||
    /^meals?\s*$/i.test(trimmed)
  ) {
    return 'Meal Payment';
  }
  return paymentTitle;
}

/** Distinct calendar days present in a meal selection summary. */
export function countMealSummaryDays(model: MealSelectionSummaryModel | null | undefined): number {
  if (!model?.sections.length) {
    return 0;
  }
  const dates = new Set(
    model.sections.map(section => section.date).filter((date): date is string => Boolean(date)),
  );
  return dates.size > 0 ? dates.size : 1;
}

/** Sum of section subtotals / line amounts for one day's meal sections. */
export function sumMealDaySections(sections: MealSummarySection[]): number {
  return sections.reduce((sum, section) => {
    if (section.subtotal != null) {
      return sum + Number(section.subtotal);
    }
    return sum + sumLineAmounts(section.items);
  }, 0);
}

/**
 * Ensure Breakfast / Lunch / Dinner rows exist for display (empty → Not Selected).
 * Display-only — does not change totals.
 */
export function ensureDayMealSections(
  sections: MealSummarySection[],
  date: string | null,
): MealSummarySection[] {
  const currencyCode = sections.find(s => s.currencyCode)?.currencyCode ?? 'INR';
  return MEAL_TYPES.map(mealType => {
    const existing = sections.find(section => section.mealType === mealType);
    if (existing) {
      return existing;
    }
    return {
      mealType,
      date: date ?? undefined,
      items: [],
      subtotal: null,
      currencyCode,
    };
  });
}

export function mealPaymentListSubtitle(
  model: MealSelectionSummaryModel,
  platesLabel: (count: number) => string,
  mealTypeLabel: (mealType: MealType) => string,
): string {
  const parts: string[] = [];
  if (model.totalPlates > 0) {
    parts.push(platesLabel(model.totalPlates));
  }
  const meals = mealTypesCompactLabel(model.selectedMealTypes, mealTypeLabel);
  if (meals) {
    parts.push(meals);
  }
  return parts.join(' · ');
}

export function activityDaysWithCharges(days: MemberMealActivityDay[]): MemberMealActivityDay[] {
  return days.filter(day => {
    const total = day.dayTotal != null ? Number(day.dayTotal) : 0;
    return total > 0 || day.slots.some(slot => slot.status === 'ACCEPTED');
  });
}

function slotDetailToSection(
  dayDate: string,
  slot: MemberMealActivitySlotDetail,
): MealSummarySection {
  const currencyCode =
    slot.selections.find(row => row.currencyCode)?.currencyCode ??
    'INR';

  if (slot.status !== 'ACCEPTED') {
    return {
      mealType: slot.mealType,
      date: dayDate,
      items: [],
      subtotal: null,
      currencyCode,
    };
  }

  const items: MealSummaryLineItem[] = slot.selections
    .filter(selection => selection.quantity > 0 && Boolean(selection.label?.trim()))
    .map(selection => {
      const unitPrice = selection.price != null ? Number(selection.price) : null;
      const lineAmount =
        selection.lineTotal != null
          ? Number(selection.lineTotal)
          : unitPrice != null
            ? unitPrice * selection.quantity
            : null;
      return {
        label: selection.label.trim(),
        quantity: selection.quantity,
        unitPrice,
        lineAmount,
        currencyCode: selection.currencyCode ?? currencyCode,
      };
    });

  const subtotal =
    slot.slotTotal != null
      ? Number(slot.slotTotal)
      : items.length > 0
        ? sumLineAmounts(items)
        : null;

  return {
    mealType: slot.mealType,
    date: dayDate,
    items,
    subtotal,
    currencyCode,
  };
}

/**
 * Prefer day-detail payloads (per-item price + lineTotal) over month rollups
 * when building payment breakdowns.
 */
export function buildMealSummaryFromDayDetails(
  dayDetails: MemberMealActivityDayDetail[] | null | undefined,
  fallbackMonth?: MemberMealActivityMonth | null,
): MealSelectionSummaryModel | null {
  if (!dayDetails?.length) {
    return buildMealSummaryFromActivityMonth(fallbackMonth);
  }

  const sections: MealSummarySection[] = [];
  let totalPlates = 0;
  let totalAmount = 0;
  let currencyCode = fallbackMonth?.summary.currencyCode ?? 'INR';
  const selectedMealTypes = new Set<MealType>();

  const sorted = [...dayDetails].sort((a, b) => a.date.localeCompare(b.date));
  for (const day of sorted) {
    const dayTotal = day.dayTotal != null ? Number(day.dayTotal) : 0;
    const hasAccepted = day.slots.some(slot => slot.status === 'ACCEPTED');
    if (!hasAccepted && dayTotal <= 0) {
      continue;
    }

    for (const mealType of MEAL_TYPES) {
      const slot = day.slots.find(row => row.mealType === mealType);
      if (!slot) {
        continue;
      }
      if (slot.status === 'NO_MENU' || slot.status === 'INACTIVE') {
        continue;
      }

      const section = slotDetailToSection(day.date, slot);
      if (section.items.length === 0 && slot.status !== 'ACCEPTED') {
        if (slot.status === 'SKIPPED' || slot.status === 'PENDING') {
          sections.push(section);
        }
        continue;
      }
      if (section.items.length > 0) {
        selectedMealTypes.add(mealType);
        totalPlates += sumQuantities(section.items);
        totalAmount += section.subtotal ?? sumLineAmounts(section.items);
        if (section.currencyCode) {
          currencyCode = section.currencyCode;
        }
      }
      sections.push(section);
    }
  }

  if (sections.length === 0) {
    return buildMealSummaryFromActivityMonth(fallbackMonth);
  }

  const summaryAmount =
    fallbackMonth?.summary.amountGenerated != null
      ? Number(fallbackMonth.summary.amountGenerated)
      : totalAmount;
  const summaryPlates =
    fallbackMonth?.summary.acceptedMeals != null
      ? Number(fallbackMonth.summary.acceptedMeals)
      : totalPlates;

  return {
    sections,
    totalPlates: summaryPlates > 0 ? summaryPlates : totalPlates,
    totalAmount: summaryAmount > 0 ? summaryAmount : totalAmount,
    currencyCode,
    selectedMealTypes: [...selectedMealTypes],
  };
}
