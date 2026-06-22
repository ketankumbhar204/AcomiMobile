import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MemberPaymentStatus } from '../../api/types';
import {
  FilterCheckboxRow,
  FilterDrawerDivider,
  FilterDrawerSection,
  FilterRadioRow,
  ListFilterDrawer,
} from '../ui';
import { toggleSetValue } from '../../utils/filterCount';
import {
  defaultPaymentListFilters,
  PAYMENT_STATUSES,
  type PaymentListFilterState,
  type PaymentSortOption,
} from '../../utils/paymentLedger';

type PaymentsFilterDrawerProps = {
  visible: boolean;
  applied: PaymentListFilterState;
  onClose: () => void;
  onApply: (filters: PaymentListFilterState) => void;
};

export function PaymentsFilterDrawer({
  visible,
  applied,
  onClose,
  onApply,
}: PaymentsFilterDrawerProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<PaymentListFilterState>(applied);

  useEffect(() => {
    if (visible) {
      setDraft({
        statuses: new Set(applied.statuses),
        sort: applied.sort,
      });
    }
  }, [applied.sort, applied.statuses, visible]);

  const sortOptions: { id: PaymentSortOption; label: string }[] = [
    { id: 'due_desc', label: t('list.sort.dueAmount') },
    { id: 'name_asc', label: t('list.sort.nameAsc') },
    { id: 'name_desc', label: t('list.sort.nameDesc') },
  ];

  const statusLabel = (status: MemberPaymentStatus) => {
    switch (status) {
      case 'PAID':
        return t('payments.filterDrawer.paid');
      case 'PENDING':
        return t('payments.filterDrawer.pending');
      case 'PARTIAL':
        return t('payments.filterDrawer.partial');
      default:
        return status;
    }
  };

  return (
    <ListFilterDrawer
      visible={visible}
      onClose={onClose}
      onReset={() => setDraft(defaultPaymentListFilters())}
      onApply={() => {
        onApply({
          statuses: new Set(draft.statuses),
          sort: draft.sort,
          preset: null,
        });
        onClose();
      }}>
      <FilterDrawerSection title={t('payments.filterDrawer.statusSection')}>
        {PAYMENT_STATUSES.map(status => (
          <FilterCheckboxRow
            key={status}
            label={statusLabel(status)}
            checked={draft.statuses.has(status)}
            onToggle={() =>
              setDraft(prev => ({
                ...prev,
                statuses: toggleSetValue(prev.statuses, status),
              }))
            }
          />
        ))}
      </FilterDrawerSection>

      <FilterDrawerDivider />

      <FilterDrawerSection title={t('list.filters.sort')}>
        {sortOptions.map(option => (
          <FilterRadioRow
            key={option.id}
            label={option.label}
            selected={draft.sort === option.id}
            onSelect={() => setDraft(prev => ({ ...prev, sort: option.id }))}
          />
        ))}
      </FilterDrawerSection>
    </ListFilterDrawer>
  );
}
