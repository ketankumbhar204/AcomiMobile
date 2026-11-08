export type ExtendStayDraft = {
  expectedExitDate: string;
  additionalAmount: string;
  rentSnapshot: string;
  rentEffectiveMonth: string;
  idempotencyKey: string;
};

export type ExtendStayRequest = {
  expectedExitDate: string;
  idempotencyKey: string;
  additionalAmount?: number;
  rentSnapshot?: number;
  rentEffectiveMonth?: string;
};

export function createExtensionIdempotencyKey(): string {
  return `ext-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function todayYmdLocal(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Advance a YYYY-MM-DD by whole calendar months (for monthly renewal preset). */
export function addCalendarMonthsYmd(ymd: string, months: number): string {
  const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return ymd;
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const next = new Date(year, monthIndex + months, day);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  const d = String(next.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function defaultMonthlyRenewalEndDate(
  expectedExitDate?: string | null,
): string {
  const base =
    expectedExitDate && /^\d{4}-\d{2}-\d{2}$/.test(expectedExitDate.trim())
      ? expectedExitDate.trim()
      : todayYmdLocal();
  return addCalendarMonthsYmd(base, 1);
}

export function buildExtendStayRequest(draft: ExtendStayDraft): ExtendStayRequest {
  const expectedExitDate = draft.expectedExitDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expectedExitDate)) {
    throw new Error('DATE_REQUIRED');
  }
  const key = draft.idempotencyKey.trim();
  if (!key) {
    throw new Error('KEY_REQUIRED');
  }
  const additionalAmount = parseAmount(draft.additionalAmount);
  const rentSnapshot = parseAmount(draft.rentSnapshot);
  const month = draft.rentEffectiveMonth.trim();
  const hasMonth = month.length > 0;
  if ((rentSnapshot == null) !== !hasMonth) {
    throw new Error('RENT_FIELDS');
  }
  return {
    expectedExitDate,
    idempotencyKey: key,
    ...(additionalAmount != null ? { additionalAmount } : {}),
    ...(rentSnapshot != null ? { rentSnapshot } : {}),
    ...(hasMonth ? { rentEffectiveMonth: month.length === 7 ? `${month}-01` : month } : {}),
  };
}

function parseAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('AMOUNT');
  }
  return amount;
}
