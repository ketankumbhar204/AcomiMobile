import type { TFunction } from 'i18next';
import { formatBedDisplayLabel } from './formatBedDisplayLabel';
import type { OccupancyHierarchyContext } from '../components/occupancy/HierarchyBreadcrumbCard';

/**
 * Primary inventory title for wizard summaries / review.
 * Never shows a bare bed letter ("A") — uses "Bed A".
 * Prefixed Room / Unit when the raw name lacks a type word.
 */
export function formatOccupancyInventoryTitle(
  context: OccupancyHierarchyContext,
  t: TFunction,
): string {
  if (context.bedName?.trim()) {
    return formatBedDisplayLabel(context.bedName, t);
  }
  if (context.roomName?.trim()) {
    return withTypePrefix(context.roomName, /^(room)\b/i, t('occupancy.section.room'));
  }
  if (context.unitName?.trim()) {
    return withTypePrefix(
      context.unitName,
      /^(unit|apartment|flat|apt\.?)\b/i,
      t('occupancy.section.unit'),
    );
  }
  if (context.buildingName?.trim()) {
    return context.buildingName.trim();
  }
  if (context.spaceName?.trim()) {
    return context.spaceName.trim();
  }
  return '—';
}

/** Hierarchy path under the primary title (excludes the primary leaf when redundant). */
export function formatOccupancyInventoryPath(context: OccupancyHierarchyContext): string {
  const parts = [
    context.spaceName,
    context.buildingName,
    context.floorName,
    context.unitName,
    context.roomName,
  ]
    .map(part => part?.trim())
    .filter((part): part is string => Boolean(part));

  if (!context.bedName?.trim() && parts.length > 0) {
    // Title already shows room or unit — drop that leaf from the path.
    return parts.slice(0, -1).join(' · ');
  }
  return parts.join(' · ');
}

function withTypePrefix(raw: string, alreadyPrefixed: RegExp, prefix: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return prefix;
  }
  if (alreadyPrefixed.test(trimmed)) {
    return trimmed;
  }
  return `${prefix} ${trimmed}`;
}
