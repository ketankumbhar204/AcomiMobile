/** Indian grouping for payment amounts, including a real zero. Null means the amount is unknown. */
export function formatPaymentAmount(
  amount: number | null | undefined,
  currencyCode = 'INR',
): string | null {
  if (amount == null || Number.isNaN(Number(amount))) {
    return null;
  }
  const value = Number(amount);
  if (value < 0) {
    return null;
  }
  const code = (currencyCode || 'INR').toUpperCase();
  const text = formatIndianGrouped(value);
  if (code === 'INR') {
    return `₹${text}`;
  }
  return `${code} ${text}`;
}

function formatIndianGrouped(value: number): string {
  // Display only. Stored amounts are unchanged; the list shows whole rupees.
  return groupIndianDigits(String(Math.round(value)));
}

function groupIndianDigits(whole: string): string {
  if (whole.length <= 3) {
    return whole;
  }
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}
