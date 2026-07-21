import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FilterCheckboxRow,
  FilterDrawerSection,
  ListFilterDrawer,
} from '../ui';
import { toggleSetValue } from '../../utils/filterCount';
import {
  MENU_PLANNING_STATUSES,
  type MenuPlanningStatusFilter,
} from '../../utils/menuPlanningFilter';

type MenuPlanningFilterDrawerProps = {
  visible: boolean;
  applied: Set<MenuPlanningStatusFilter>;
  onClose: () => void;
  onApply: (statuses: Set<MenuPlanningStatusFilter>) => void;
};

export function MenuPlanningFilterDrawer({
  visible,
  applied,
  onClose,
  onApply,
}: MenuPlanningFilterDrawerProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Set<MenuPlanningStatusFilter>>(applied);

  useEffect(() => {
    if (visible) {
      setDraft(new Set(applied));
    }
  }, [applied, visible]);

  const labelFor = (status: MenuPlanningStatusFilter) => {
    switch (status) {
      case 'published':
        return t('meals.planning.filterDrawer.published');
      case 'modified':
        return t('meals.planning.filterDrawer.modified');
      case 'draft':
        return t('meals.planning.filterDrawer.draft');
      case 'not_planned':
        return t('meals.planning.filterDrawer.notPlanned');
      default:
        return status;
    }
  };

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
        {MENU_PLANNING_STATUSES.map(status => (
          <FilterCheckboxRow
            key={status}
            label={labelFor(status)}
            checked={draft.has(status)}
            onToggle={() => setDraft(prev => toggleSetValue(prev, status))}
          />
        ))}
      </FilterDrawerSection>
    </ListFilterDrawer>
  );
}
