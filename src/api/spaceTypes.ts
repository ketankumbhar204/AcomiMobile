import { i18n } from '../i18n';
import type { SpaceType } from './types';

export const SPACE_TYPE_VALUES: SpaceType[] = [
  'MESS',
  'PG',
  'HOSTEL',
  'CO_LIVING',
  'RENTAL',
  'CORPORATE_STAY',
];

const SPACE_TYPE_ICON_LABEL: Record<SpaceType, string> = {
  PG: 'PG',
  MESS: 'ME',
  HOSTEL: 'HO',
  CO_LIVING: 'CO',
  RENTAL: 'RE',
  CORPORATE_STAY: 'CS',
};

const SPACE_TYPE_I18N_KEY: Record<SpaceType, string> = {
  PG: 'pg',
  MESS: 'mess',
  HOSTEL: 'hostel',
  CO_LIVING: 'coLiving',
  RENTAL: 'rental',
  CORPORATE_STAY: 'corporateStay',
};

export function getSpaceTypeLabel(type: SpaceType): string {
  return i18n.t(`spaces.types.${SPACE_TYPE_I18N_KEY[type]}.label`);
}

export function getSpaceTypeDescription(type: SpaceType): string {
  return i18n.t(`spaces.types.${SPACE_TYPE_I18N_KEY[type]}.description`);
}

export function formatSpaceType(type: SpaceType): string {
  return getSpaceTypeLabel(type);
}

export function spaceTypeIconLabel(type: SpaceType): string {
  return SPACE_TYPE_ICON_LABEL[type] ?? type.slice(0, 2).toUpperCase();
}
