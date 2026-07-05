export function formatPaymentAmount(amount: number, currencyCode = 'INR'): string {
  if (currencyCode === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `${currencyCode} ${amount.toLocaleString()}`;
}

export function formatPaymentDueDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
