import type {
  MealPollPaymentChoice,
  MealPollPaymentStatus,
  MemberMealActivityDayDetail,
  MemberMealActivityDayPayment,
  MemberMealActivitySlotDetail,
  MemberMealActivitySlotStatus,
  MealType,
} from '../api/types';
import { normalizeActivityDate } from './memberMealActivityCalendar';

function normalizeDateTime(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day, hour = 0, minute = 0] = value;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return null;
}

function normalizeMealType(value: unknown): MealType {
  const raw = String(value ?? 'BREAKFAST').toUpperCase();
  if (raw === 'BREAKFAST' || raw === 'LUNCH' || raw === 'DINNER') {
    return raw;
  }
  return 'BREAKFAST';
}

function normalizeSlotStatus(value: unknown): MemberMealActivitySlotStatus {
  const raw = String(value ?? 'INACTIVE').toUpperCase();
  switch (raw) {
    case 'ACCEPTED':
    case 'PENDING':
    case 'SKIPPED':
    case 'NO_MENU':
      return raw;
    default:
      return 'INACTIVE';
  }
}

function normalizeSlot(raw: Record<string, unknown>): MemberMealActivitySlotDetail {
  const selections = Array.isArray(raw.selections) ? raw.selections : [];
  return {
    mealType: normalizeMealType(raw.mealType ?? raw.meal_type),
    status: normalizeSlotStatus(raw.status),
    menuPublished: Boolean(raw.menuPublished ?? raw.menu_published),
    pollStatus: (raw.pollStatus ?? raw.poll_status) as MemberMealActivitySlotDetail['pollStatus'],
    deliveryLocationName:
      (raw.deliveryLocationName as string | null | undefined) ??
      (raw.delivery_location_name as string | null | undefined) ??
      null,
    deliveryLocationDescription:
      (raw.deliveryLocationDescription as string | null | undefined) ??
      (raw.delivery_location_description as string | null | undefined) ??
      null,
    respondedAt: normalizeDateTime(raw.respondedAt ?? raw.responded_at),
    slotTotal:
      raw.slotTotal != null
        ? Number(raw.slotTotal)
        : raw.slot_total != null
          ? Number(raw.slot_total)
          : null,
    selections: selections.map((row: Record<string, unknown>) => ({
      label: String(row.label ?? ''),
      price: row.price != null ? Number(row.price) : null,
      currencyCode: (row.currencyCode as string | null | undefined) ?? (row.currency_code as string | null | undefined) ?? null,
      quantity: Number(row.quantity ?? 0),
      itemDetail:
        (row.itemDetail as string | null | undefined) ??
        (row.item_detail as string | null | undefined) ??
        null,
      lineTotal:
        row.lineTotal != null
          ? Number(row.lineTotal)
          : row.line_total != null
            ? Number(row.line_total)
            : null,
    })),
  };
}

/** Normalize day-detail API payload (dates, numbers, nested arrays). */
export function normalizeMemberMealActivityDayDetail(raw: Record<string, unknown>): MemberMealActivityDayDetail {
  const date = normalizeActivityDate(raw.date) ?? String(raw.date ?? '');
  const slots = (Array.isArray(raw.slots) ? raw.slots : []).map(row =>
    normalizeSlot(row as Record<string, unknown>),
  );
  const dailyCharges = (Array.isArray(raw.dailyCharges) ? raw.dailyCharges : Array.isArray(raw.daily_charges) ? raw.daily_charges : []).map(
    (charge: Record<string, unknown>) => ({
      mealType: normalizeMealType(charge.mealType ?? charge.meal_type),
      amount: charge.amount != null ? Number(charge.amount) : null,
      currencyCode:
        (charge.currencyCode as string | null | undefined) ??
        (charge.currency_code as string | null | undefined) ??
        null,
    }),
  );

  const paymentRaw = (raw.payment ?? null) as Record<string, unknown> | null;
  const payment = paymentRaw
    ? {
        id: (paymentRaw.id as string | null | undefined) ?? null,
        pollDate: normalizeActivityDate(paymentRaw.pollDate ?? paymentRaw.poll_date),
        paymentChoice: (paymentRaw.paymentChoice ??
          paymentRaw.payment_choice ??
          null) as MealPollPaymentChoice | null,
        paymentStatus: (paymentRaw.paymentStatus ??
          paymentRaw.payment_status ??
          null) as MealPollPaymentStatus | null,
        chargedAmount:
          paymentRaw.chargedAmount != null
            ? Number(paymentRaw.chargedAmount)
            : paymentRaw.charged_amount != null
              ? Number(paymentRaw.charged_amount)
              : null,
        paymentBatchId:
          (paymentRaw.paymentBatchId as string | null | undefined) ??
          (paymentRaw.payment_batch_id as string | null | undefined) ??
          null,
        proofImageUrl:
          (paymentRaw.proofImageUrl as string | null | undefined) ??
          (paymentRaw.proof_image_url as string | null | undefined) ??
          null,
        referenceNumber:
          (paymentRaw.referenceNumber as string | null | undefined) ??
          (paymentRaw.reference_number as string | null | undefined) ??
          null,
        remarks: (paymentRaw.remarks as string | null | undefined) ?? null,
        paymentMethod:
          (paymentRaw.paymentMethod as MemberMealActivityDayPayment['paymentMethod']) ??
          (paymentRaw.payment_method as MemberMealActivityDayPayment['paymentMethod']) ??
          null,
        rejectionReason:
          (paymentRaw.rejectionReason as string | null | undefined) ??
          (paymentRaw.rejection_reason as string | null | undefined) ??
          null,
        proofSubmittedAt: normalizeDateTime(
          paymentRaw.proofSubmittedAt ?? paymentRaw.proof_submitted_at,
        ),
        proofReviewedAt: normalizeDateTime(
          paymentRaw.proofReviewedAt ?? paymentRaw.proof_reviewed_at,
        ),
        prepaidOverflowAmount:
          paymentRaw.prepaidOverflowAmount != null
            ? Number(paymentRaw.prepaidOverflowAmount)
            : paymentRaw.prepaid_overflow_amount != null
              ? Number(paymentRaw.prepaid_overflow_amount)
              : null,
        prepaidDebitedAmount:
          paymentRaw.prepaidDebitedAmount != null
            ? Number(paymentRaw.prepaidDebitedAmount)
            : paymentRaw.prepaid_debited_amount != null
              ? Number(paymentRaw.prepaid_debited_amount)
              : null,
        prepaidOverflowPayment: Boolean(
          paymentRaw.prepaidOverflowPayment ?? paymentRaw.prepaid_overflow_payment,
        ),
      }
    : null;
  const computedHasActivity =
    Boolean(payment) ||
    dailyCharges.length > 0 ||
    slots.some(slot => slot.status !== 'INACTIVE');

  return {
    date,
    memberName: (raw.memberName as string | null | undefined) ?? (raw.member_name as string | null | undefined) ?? null,
    hasActivity: raw.hasActivity === false || raw.has_activity === false ? computedHasActivity : Boolean(raw.hasActivity ?? raw.has_activity ?? computedHasActivity),
    responseSubmittedAt: normalizeDateTime(raw.responseSubmittedAt ?? raw.response_submitted_at),
    dayTotal: raw.dayTotal != null ? Number(raw.dayTotal) : raw.day_total != null ? Number(raw.day_total) : null,
    currencyCode: (raw.currencyCode as string | null | undefined) ?? (raw.currency_code as string | null | undefined) ?? null,
    payment,
    subscription: (raw.subscription ?? null) as MemberMealActivityDayDetail['subscription'],
    notes: (raw.notes as string | null | undefined) ?? null,
    dailyCharges,
    slots,
  };
}

export function dayDetailHasActivity(detail: MemberMealActivityDayDetail): boolean {
  if (detail.hasActivity === true) {
    return true;
  }
  return (
    Boolean(detail.payment) ||
    (detail.dailyCharges?.length ?? 0) > 0 ||
    detail.slots.some(slot => slot.status !== 'INACTIVE')
  );
}

export function formatPlateCount(count: number, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (count === 1) {
    return t('meals.activity.daySheet.plate_one', { count: 1 });
  }
  return t('meals.activity.daySheet.plate_other', { count });
}
