import { addCalendarMonthsYmd, todayYmdLocal } from './extendStay';

export type ReviseOpenEndedRentDraft = {
  currentDailyRent: number | null | undefined;
  newDailyRent: string;
  effectiveFrom: string;
  reasonCode: '' | 'RENT_REVISION' | 'MUTUAL_AGREEMENT' | 'OTHER';
  reasonOther: string;
  idempotencyKey: string;
};

export type ReviseOpenEndedRentRequest = {
  idempotencyKey: string;
  rentSnapshot: number;
  rentEffectiveMonth: string;
  reason?: string;
};

/** Default effective-from: next calendar day (local). */
export function defaultRentEffectiveFromYmd(businessYmd?: string | null): string {
  const base =
    businessYmd && /^\d{4}-\d{2}-\d{2}$/.test(businessYmd.trim())
      ? businessYmd.trim()
      : todayYmdLocal();
  const match = base.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return todayYmdLocal();
  }
  const next = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + 1);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  const d = String(next.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Day before YYYY-MM-DD (for "previous rate applies through"). */
export function previousRateThroughYmd(effectiveFromYmd: string): string | null {
  const match = effectiveFromYmd.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const prev = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]) - 1);
  const y = prev.getFullYear();
  const m = String(prev.getMonth() + 1).padStart(2, '0');
  const d = String(prev.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDailyRentDisplay(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) {
    return '—';
  }
  return `₹${amount.toLocaleString('en-IN')}/day`;
}

export function buildReviseOpenEndedRentRequest(
  draft: ReviseOpenEndedRentDraft,
): ReviseOpenEndedRentRequest {
  if (draft.currentDailyRent == null || Number.isNaN(draft.currentDailyRent)) {
    throw new Error('CURRENT_RENT_MISSING');
  }
  const key = draft.idempotencyKey.trim();
  if (!key) {
    throw new Error('KEY_REQUIRED');
  }
  const effectiveFrom = draft.effectiveFrom.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
    throw new Error('DATE_REQUIRED');
  }
  const trimmed = draft.newDailyRent.trim();
  if (!trimmed) {
    throw new Error('AMOUNT');
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('AMOUNT');
  }
  if (amount === draft.currentDailyRent) {
    throw new Error('RENT_UNCHANGED');
  }

  let reason: string | undefined;
  if (draft.reasonCode === 'RENT_REVISION') {
    reason = 'Rent revision';
  } else if (draft.reasonCode === 'MUTUAL_AGREEMENT') {
    reason = 'Mutual agreement';
  } else if (draft.reasonCode === 'OTHER') {
    const other = draft.reasonOther.trim();
    reason = other ? `Other: ${other.slice(0, 200)}` : 'Other';
  }

  return {
    idempotencyKey: key,
    rentSnapshot: amount,
    rentEffectiveMonth: effectiveFrom,
    ...(reason ? { reason } : {}),
  };
}

/** @deprecated kept for local tests that need month math — prefer defaultRentEffectiveFromYmd */
export function nextMonthFirstYmd(fromYmd: string): string {
  return addCalendarMonthsYmd(fromYmd.slice(0, 8) + '01', 1);
}
