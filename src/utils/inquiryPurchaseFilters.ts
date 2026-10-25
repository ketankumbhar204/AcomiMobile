import type { InquiryCreditPurchaseStatus } from '../api/inquiryCreditsApi';

export type InquiryPurchaseFilterRow = {
  id: string;
  userId: string;
  packageId: string;
  status: string;
  userFullName?: string | null;
  userMobileNumber?: string | null;
  utr?: string | null;
};

/** Status card tap: select that status, or clear back to All when it is already selected. */
export function nextInquiryPurchaseStatus(
  current: InquiryCreditPurchaseStatus | null,
  tapped: InquiryCreditPurchaseStatus,
): InquiryCreditPurchaseStatus | null {
  return current === tapped ? null : tapped;
}

/**
 * Status and search apply together. Counts must be computed from the unfiltered rows
 * (or the summary endpoint), not from this result.
 */
export function filterInquiryPurchases<T extends InquiryPurchaseFilterRow>(
  rows: readonly T[],
  status: InquiryCreditPurchaseStatus | null,
  search: string,
): T[] {
  const query = search.trim().toLowerCase();
  return rows.filter(row => {
    if (status != null && row.status !== status) {
      return false;
    }
    if (!query) {
      return true;
    }
    const haystack = [
      row.id,
      row.userId,
      row.userFullName,
      row.userMobileNumber,
      row.packageId,
      row.utr,
    ];
    return haystack.some(value => (value ?? '').toLowerCase().includes(query));
  });
}
