import type { AccommodationStatus } from '../../../../api/types';
import { getAccommodationStatusColor } from '../../../../utils/accommodationStatus';

/** Synthesize per-slot status dots when only aggregate counts are available. */
export function synthesizeStatusDots(params: {
  total: number;
  occupied?: number;
  available?: number;
  reserved?: number;
  maintenance?: number;
  maxDots?: number;
}): AccommodationStatus[] {
  const {
    total,
    occupied = 0,
    available = 0,
    reserved = 0,
    maintenance = 0,
    maxDots = 10,
  } = params;

  if (total <= 0) {
    return [];
  }

  const dots: AccommodationStatus[] = [];
  let remaining = Math.min(total, maxDots);

  const push = (status: AccommodationStatus, count: number) => {
    const n = Math.min(count, remaining);
    for (let i = 0; i < n; i++) {
      dots.push(status);
    }
    remaining -= n;
  };

  push('OCCUPIED', occupied);
  push('RESERVED', reserved);
  push('MAINTENANCE', maintenance);
  push('AVAILABLE', available);

  while (dots.length < Math.min(total, maxDots)) {
    dots.push('AVAILABLE');
  }

  return dots.slice(0, maxDots);
}

export function statusTintColor(status?: AccommodationStatus | null, alpha = '33'): string {
  if (!status) {
    return '#e2e8f033';
  }
  return `${getAccommodationStatusColor(status)}${alpha}`;
}

export function statusBorderColor(status?: AccommodationStatus | null): string {
  if (!status) {
    return '#94a3b8';
  }
  return getAccommodationStatusColor(status);
}

/** Pastel facade wall fill per status (reference elevation style). */
export function statusFacadeFill(status: AccommodationStatus): string {
  switch (status) {
    case 'OCCUPIED':
      return '#e8b4b4';
    case 'RESERVED':
      return '#f5e6a8';
    case 'MAINTENANCE':
    case 'BLOCKED':
      return '#d1d5db';
    default:
      return '#b8dcc8';
  }
}
