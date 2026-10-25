type SpaceRole = { membershipRole?: string | null };

const OPERATOR = new Set(['OWNER', 'MANAGER', 'STAFF']);
const MANAGE = new Set(['OWNER', 'MANAGER']);

export function canOpenServiceContacts(spaces: SpaceRole[], ownerIntent = false): boolean {
  if (spaces.some(space => OPERATOR.has(space.membershipRole ?? ''))) {
    return true;
  }
  return spaces.length === 0 && ownerIntent;
}

export function canManageServiceContacts(spaces: SpaceRole[]): boolean {
  if (spaces.some(space => MANAGE.has(space.membershipRole ?? ''))) {
    return true;
  }
  return spaces.length === 0;
}

export function associableSpaces<T extends SpaceRole>(spaces: T[]): T[] {
  return spaces.filter(space => MANAGE.has(space.membershipRole ?? ''));
}
