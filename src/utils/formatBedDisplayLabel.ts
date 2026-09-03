import type { TFunction } from 'i18next';

export function formatBedDisplayLabel(
  label: string | undefined | null,
  t: TFunction,
): string {
  const trimmed = label?.trim();
  if (!trimmed) {
    return t('occupancy.section.bed');
  }
  if (/^(bed|lower|middle|upper|top|bottom)\b/i.test(trimmed)) {
    return trimmed;
  }
  return t('accommodation.listItem.bed', { label: trimmed });
}
