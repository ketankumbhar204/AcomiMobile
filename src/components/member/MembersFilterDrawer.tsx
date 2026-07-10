import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MembershipRole, MemberStatus, SpaceType } from '../../api/types';
import {
  FilterCheckboxRow,
  FilterDrawerDivider,
  FilterDrawerSection,
  FilterRadioRow,
  ListFilterDrawer,
} from '../ui';
import {
  defaultMemberListFilters,
  MEMBER_STATUSES,
  rolesForSpace,
  type MemberListFilterState,
  type MemberSortOption,
} from '../../utils/memberListQuery';
import { createdDateSortLabelKey } from '../../utils/listSort';
import { toggleSetValue } from '../../utils/filterCount';

type MembersFilterDrawerProps = {
  visible: boolean;
  spaceType: SpaceType | undefined;
  applied: MemberListFilterState;
  showStatusSection: boolean;
  showSortSection: boolean;
  onClose: () => void;
  onApply: (filters: MemberListFilterState) => void;
};

export function MembersFilterDrawer({
  visible,
  spaceType,
  applied,
  showStatusSection,
  showSortSection,
  onClose,
  onApply,
}: MembersFilterDrawerProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<MemberListFilterState>(applied);

  useEffect(() => {
    if (visible) {
      setDraft({
        roles: new Set(applied.roles),
        statuses: new Set(applied.statuses),
        sort: applied.sort,
      });
    }
  }, [applied, visible]);

  const roleOptions = rolesForSpace(spaceType);

  const sortOptions: { id: MemberSortOption; label: string }[] = [
    { id: 'name_asc', label: t('list.sort.nameAsc') },
    { id: 'name_desc', label: t('list.sort.nameDesc') },
    { id: 'created_desc', label: t(createdDateSortLabelKey('created_desc')) },
    { id: 'created_asc', label: t(createdDateSortLabelKey('created_asc')) },
    { id: 'role', label: t('list.sort.role') },
  ];

  return (
    <ListFilterDrawer
      visible={visible}
      onClose={onClose}
      onReset={() => setDraft(defaultMemberListFilters())}
      onApply={() => {
        onApply({
          roles: new Set(draft.roles),
          statuses: new Set(draft.statuses),
          sort: draft.sort,
        });
        onClose();
      }}>
      <FilterDrawerSection title={t('list.filters.role')}>
        {roleOptions.map(role => (
          <FilterCheckboxRow
            key={role}
            label={t(`spaces.roles.${role}`)}
            checked={draft.roles.has(role)}
            onToggle={() =>
              setDraft(prev => ({
                ...prev,
                roles: toggleSetValue(prev.roles, role),
              }))
            }
          />
        ))}
      </FilterDrawerSection>

      {showStatusSection ? (
        <>
          <FilterDrawerDivider />
          <FilterDrawerSection title={t('list.filters.status')}>
            {MEMBER_STATUSES.map(status => (
              <FilterCheckboxRow
                key={status}
                label={t(`membership.status.${status}`)}
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
        </>
      ) : null}

      {showSortSection ? (
        <>
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
        </>
      ) : null}
    </ListFilterDrawer>
  );
}
