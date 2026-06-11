import React from 'react';
import { useTranslation } from 'react-i18next';
import type { MembershipRole } from '../../api/types';
import { Badge } from '../ui';

type RoleBadgeProps = {
  role: MembershipRole;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const { t } = useTranslation();

  return <Badge label={t(`spaces.roles.${role}`)} />;
}
