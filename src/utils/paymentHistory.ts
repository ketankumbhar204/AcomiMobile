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

export function formatPaymentSubmittedAt(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) {
    return isoDateTime;
  }
  const datePart = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const timePart = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${datePart}, ${timePart}`;
}
