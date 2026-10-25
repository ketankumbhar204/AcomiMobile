export function formatPaymentAmount(amount: number, currencyCode = 'INR'): string {
  const code = (currencyCode || 'INR').toUpperCase();
  const whole = Math.round(amount).toLocaleString('en-IN');
  if (code === 'INR') {
    return `₹${whole}`;
  }
  return `${code} ${whole}`;
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
