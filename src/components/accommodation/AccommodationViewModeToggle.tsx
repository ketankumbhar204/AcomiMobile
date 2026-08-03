import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, List } from 'lucide-react-native';
import { SegmentedTabs, type SegmentedTabItem } from '../ui';
import { spacing } from '../../theme';
import type { AccommodationViewMode } from '../../store/accommodationViewModeStore';

type AccommodationViewModeToggleProps = {
  value: AccommodationViewMode;
  onChange: (mode: AccommodationViewMode) => void;
};

export function AccommodationViewModeToggle({
  value,
  onChange,
}: AccommodationViewModeToggleProps) {
  const { t } = useTranslation();

  const items = useMemo<SegmentedTabItem<AccommodationViewMode>[]>(
    () => [
      { key: 'list', label: t('accommodation.viewMode.list'), icon: List },
      { key: 'layout', label: t('accommodation.viewMode.layout'), icon: LayoutGrid },
    ],
    [t],
  );

  return (
    <SegmentedTabs
      items={items}
      value={value}
      onChange={onChange}
      compact
      style={styles.wrap}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
});
