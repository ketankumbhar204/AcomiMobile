/**
 * Human-readable payment reference for support / approval (not UTR, not DB UUID).
 * Backend should mint once at first submission (e.g. PAY-20260720-000123) and never regenerate.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PaymentReferenceSource = {
  paymentReference?: string | null;
  paymentBatchId?: string | null;
};

function isUuidLike(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/**
 * Prefer immutable `paymentReference` from the API.
 * Fall back to a human batch code (e.g. MP-…) when reference is not yet backfilled.
 * Never surface raw UUIDs.
 */
export function resolvePaymentReferenceDisplay(
  source: PaymentReferenceSource | null | undefined,
): string | null {
  if (!source) {
    return null;
  }
  const reference = source.paymentReference?.trim();
  if (reference && !isUuidLike(reference)) {
    return reference;
  }
  const batch = source.paymentBatchId?.trim();
  if (batch && !isUuidLike(batch)) {
    return batch;
  }
  return null;
}
