import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AccommodationStatus } from '../../api/types';
import {
  FilterCheckboxRow,
  FilterDrawerSection,
  ListFilterDrawer,
} from '../ui';
import { toggleSetValue } from '../../utils/filterCount';

export type BedStatusFilterState = Set<AccommodationStatus>;

const BED_STATUSES: AccommodationStatus[] = ['AVAILABLE', 'OCCUPIED'];

export function defaultBedStatusFilters(): BedStatusFilterState {
  return new Set();
}

export function countBedStatusFilters(selected: BedStatusFilterState): number {
  if (selected.size === 0 || selected.size >= BED_STATUSES.length) {
    return 0;
  }
  return 1;
}

type BedsFilterDrawerProps = {
  visible: boolean;
  applied: BedStatusFilterState;
  onClose: () => void;
  onApply: (statuses: BedStatusFilterState) => void;
};

export function BedsFilterDrawer({
  visible,
  applied,
  onClose,
  onApply,
}: BedsFilterDrawerProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<BedStatusFilterState>(applied);

  useEffect(() => {
    if (visible) {
      setDraft(new Set(applied));
    }
  }, [applied, visible]);

  return (
    <ListFilterDrawer
      visible={visible}
      onClose={onClose}
      onReset={() => setDraft(new Set())}
      onApply={() => {
        onApply(new Set(draft));
        onClose();
      }}>
      <FilterDrawerSection title={t('list.filters.status')}>
        {BED_STATUSES.map(status => (
          <FilterCheckboxRow
            key={status}
            label={t(`accommodation.status.${status}`)}
            checked={draft.has(status)}
            onToggle={() => setDraft(prev => toggleSetValue(prev, status))}
          />
        ))}
      </FilterDrawerSection>
    </ListFilterDrawer>
  );
}

/** Single status for API when one selected; ALL when none or both. */
export function bedStatusForApi(selected: BedStatusFilterState): AccommodationStatus | 'ALL' {
  if (selected.size === 1) {
    return [...selected][0];
  }
  return 'ALL';
}
