import React from 'react';
import { useTranslation } from 'react-i18next';
import { DateField } from '../ui/DateField';

type SubscriptionValidTillDateFieldProps = {
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
  allowPastDates?: boolean;
};

export function SubscriptionValidTillDateField({
  value,
  onChange,
  error,
  allowPastDates = false,
}: SubscriptionValidTillDateFieldProps) {
  const { t } = useTranslation();
  return (
    <DateField
      label={t('meals.subscription.validTillLabel')}
      value={value}
      onChange={onChange}
      allowPastDates={allowPastDates}
      error={error}
    />
  );
}
