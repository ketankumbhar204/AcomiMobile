import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FilterCheckboxRow,
  FilterDrawerDivider,
  FilterDrawerSection,
  FilterRadioRow,
  ListFilterDrawer,
} from '../ui';
import { toggleSetValue } from '../../utils/filterCount';
import { createdDateSortLabelKey } from '../../utils/listSort';
import {
  defaultSubscriptionHistoryFilters,
  SUBSCRIPTION_EVENT_TYPES,
  SUBSCRIPTION_HISTORY_SORT_OPTIONS,
  type SubscriptionEventTypeFilter,
  type SubscriptionHistoryFilterState,
  type SubscriptionMonthFilter,
} from '../../utils/subscriptionHistoryFilter';

type SubscriptionHistoryFilterDrawerProps = {
  visible: boolean;
  applied: SubscriptionHistoryFilterState;
  onClose: () => void;
  onApply: (filters: SubscriptionHistoryFilterState) => void;
};

export function SubscriptionHistoryFilterDrawer({
  visible,
  applied,
  onClose,
  onApply,
}: SubscriptionHistoryFilterDrawerProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<SubscriptionHistoryFilterState>(applied);

  useEffect(() => {
    if (visible) {
      setDraft({
        eventTypes: new Set(applied.eventTypes),
        months: new Set(applied.months),
        sort: applied.sort,
      });
    }
  }, [applied, visible]);

  const eventLabel = (type: SubscriptionEventTypeFilter) => {
    switch (type) {
      case 'created':
        return t('meals.subscription.filterDrawer.created');
      case 'added_meals':
        return t('meals.subscription.filterDrawer.addedMeals');
      case 'ended':
        return t('meals.subscription.filterDrawer.ended');
      default:
        return type;
    }
  };

  return (
    <ListFilterDrawer
      visible={visible}
      onClose={onClose}
      onReset={() => setDraft(defaultSubscriptionHistoryFilters())}
      onApply={() => {
        onApply({
          eventTypes: new Set(draft.eventTypes),
          months: new Set(draft.months),
          sort: draft.sort,
        });
        onClose();
      }}>
      <FilterDrawerSection title={t('meals.subscription.filterDrawer.eventType')}>
        {SUBSCRIPTION_EVENT_TYPES.map(type => (
          <FilterCheckboxRow
            key={type}
            label={eventLabel(type)}
            checked={draft.eventTypes.has(type)}
            onToggle={() =>
              setDraft(prev => ({
                ...prev,
                eventTypes: toggleSetValue(prev.eventTypes, type),
              }))
            }
          />
        ))}
      </FilterDrawerSection>

      <FilterDrawerDivider />

      <FilterDrawerSection title={t('meals.subscription.filterDrawer.month')}>
        <FilterCheckboxRow
          label={t('meals.subscription.filterDrawer.currentMonth')}
          checked={draft.months.has('current')}
          onToggle={() =>
            setDraft(prev => ({
              ...prev,
              months: toggleSetValue(prev.months, 'current'),
            }))
          }
        />
        <FilterCheckboxRow
          label={t('meals.subscription.filterDrawer.previousMonth')}
          checked={draft.months.has('previous')}
          onToggle={() =>
            setDraft(prev => ({
              ...prev,
              months: toggleSetValue(prev.months, 'previous'),
            }))
          }
        />
      </FilterDrawerSection>

      <FilterDrawerDivider />

      <FilterDrawerSection title={t('list.filters.sort')}>
        {SUBSCRIPTION_HISTORY_SORT_OPTIONS.map(option => (
          <FilterRadioRow
            key={option}
            label={t(createdDateSortLabelKey(option))}
            selected={draft.sort === option}
            onSelect={() => setDraft(prev => ({ ...prev, sort: option }))}
          />
        ))}
      </FilterDrawerSection>
    </ListFilterDrawer>
  );
}
