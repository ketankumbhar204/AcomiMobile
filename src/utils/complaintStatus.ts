import type { ComplaintPriority, ComplaintStatus } from '../api/types';

export function getComplaintStatusColor(status: ComplaintStatus): string {
  switch (status) {
    case 'OPEN':
      return '#B45309';
    case 'IN_PROGRESS':
      return '#2563EB';
    case 'RESOLVED':
      return '#059669';
    case 'CLOSED':
      return '#64748B';
    case 'CANCELLED':
      return '#B91C1C';
    default:
      return '#64748B';
  }
}

export function getComplaintPriorityColor(priority: ComplaintPriority): string {
  switch (priority) {
    case 'LOW':
      return '#64748B';
    case 'MEDIUM':
      return '#2563EB';
    case 'HIGH':
      return '#B45309';
    case 'URGENT':
      return '#B91C1C';
    default:
      return '#64748B';
  }
}

/** Compact local date+time for complaint cards and detail. */
export function formatComplaintDateTime(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
