import type { LucideIcon } from 'lucide-react-native';
import {
  BedDouble,
  Building2,
  DoorOpen,
  Grid2x2,
  Layers,
} from 'lucide-react-native';
import { colors } from '../theme';

/**
 * Visual identity for accommodation hierarchy levels.
 * UI-only tokens — do not use for business logic.
 */
export type AccommodationHierarchyLevel =
  | 'building'
  | 'floor'
  | 'unit'
  | 'room'
  | 'bed';

export type AccommodationHierarchyAccent = {
  /** Primary accent (icons, chips, hero rings) */
  accent: string;
  /** Soft pastel fill for icon wells / heroes */
  soft: string;
  /** Border tint */
  border: string;
};

export const ACCOMMODATION_HIERARCHY: Record<
  AccommodationHierarchyLevel,
  AccommodationHierarchyAccent
> = {
  building: { accent: '#2563EB', soft: '#EFF6FF', border: '#BFDBFE' },
  floor: { accent: '#7C3AED', soft: '#F5F3FF', border: '#DDD6FE' },
  unit: { accent: '#EA580C', soft: '#FFF7ED', border: '#FED7AA' },
  room: { accent: '#16A34A', soft: colors.successTint, border: '#A7F3D0' },
  bed: { accent: '#0D9488', soft: colors.hover, border: '#99F6E4' },
};

export const ACCOMMODATION_HIERARCHY_ICON: Record<
  AccommodationHierarchyLevel,
  LucideIcon
> = {
  building: Building2,
  floor: Layers,
  unit: Grid2x2,
  room: DoorOpen,
  bed: BedDouble,
};

export function getAccommodationHierarchyAccent(
  level: AccommodationHierarchyLevel,
): AccommodationHierarchyAccent {
  return ACCOMMODATION_HIERARCHY[level];
}

export function getAccommodationHierarchyIcon(
  level: AccommodationHierarchyLevel,
): LucideIcon {
  return ACCOMMODATION_HIERARCHY_ICON[level];
}
