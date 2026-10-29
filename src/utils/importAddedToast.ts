const IMPORT_SPACE_KEY: Record<string, string> = {
  MESS: 'mess',
  PG: 'pg',
  HOSTEL: 'hostel',
  CO_LIVING: 'coLiving',
  RENTAL: 'rental',
  CORPORATE_STAY: 'corporateStay',
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** "Member added to this rental." Mess stays "Customer added to this mess." */
export function importAddedToast(t: Translate, spaceType?: string | null): string {
  const personKey = spaceType === 'MESS' ? 'customer' : 'member';
  const spaceKey = (spaceType && IMPORT_SPACE_KEY[spaceType]) || 'space';
  return t('membership.add.importSuccessToast', {
    person: t(`membership.add.importPerson.${personKey}`),
    space: t(`membership.add.importSpace.${spaceKey}`),
  });
}
