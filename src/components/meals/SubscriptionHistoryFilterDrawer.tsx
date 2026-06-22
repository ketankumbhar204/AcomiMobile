import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FilterCheckboxRow,
  FilterDrawerDivider,
  FilterDrawerSection,
  ListFilterDrawer,
} from '../ui';
import { toggleSetValue } from '../../utils/filterCount';
import {
  SUBSCRIPTION_EVENT_TYPES,
  type SubscriptionEventTypeFilter,
  type SubscriptionMonthFilter,
} from '../../utils/subscriptionHistoryFilter';

type SubscriptionHistoryFilterDrawerProps = {
  visible: boolean;
  appliedEventTypes: Set<SubscriptionEventTypeFilter>;
  appliedMonths: Set<SubscriptionMonthFilter>;
  onClose: () => void;
  onApply: (
    eventTypes: Set<SubscriptionEventTypeFilter>,
    months: Set<SubscriptionMonthFilter>,
  ) => void;
};

export function SubscriptionHistoryFilterDrawer({
  visible,
  appliedEventTypes,
  appliedMonths,
  onClose,
  onApply,
}: SubscriptionHistoryFilterDrawerProps) {
  const { t } = useTranslation();
  const [eventTypes, setEventTypes] = useState<Set<SubscriptionEventTypeFilter>>(appliedEventTypes);
  const [months, setMonths] = useState<Set<SubscriptionMonthFilter>>(appliedMonths);

  useEffect(() => {
    if (visible) {
      setEventTypes(new Set(appliedEventTypes));
      setMonths(new Set(appliedMonths));
    }
  }, [appliedEventTypes, appliedMonths, visible]);

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
      onReset={() => {
        setEventTypes(new Set());
        setMonths(new Set());
      }}
      onApply={() => {
        onApply(new Set(eventTypes), new Set(months));
        onClose();
      }}>
      <FilterDrawerSection title={t('meals.subscription.filterDrawer.eventType')}>
        {SUBSCRIPTION_EVENT_TYPES.map(type => (
          <FilterCheckboxRow
            key={type}
            label={eventLabel(type)}
            checked={eventTypes.has(type)}
            onToggle={() => setEventTypes(prev => toggleSetValue(prev, type))}
          />
        ))}
      </FilterDrawerSection>

      <FilterDrawerDivider />

      <FilterDrawerSection title={t('meals.subscription.filterDrawer.month')}>
        <FilterCheckboxRow
          label={t('meals.subscription.filterDrawer.currentMonth')}
          checked={months.has('current')}
          onToggle={() => setMonths(prev => toggleSetValue(prev, 'current'))}
        />
        <FilterCheckboxRow
          label={t('meals.subscription.filterDrawer.previousMonth')}
          checked={months.has('previous')}
          onToggle={() => setMonths(prev => toggleSetValue(prev, 'previous'))}
        />
      </FilterDrawerSection>
    </ListFilterDrawer>
  );
}
