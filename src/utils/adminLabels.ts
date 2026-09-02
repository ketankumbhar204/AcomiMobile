export function formatRegistrationSource(source: string): string {
  if (source === 'ADMIN') {
    return 'Added by Admin';
  }
  return 'Registered on Website';
}

export function formatRegistrationStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

export function formatAdminUserRole(role: string): string {
  if (role === 'OWNER') return 'Owner';
  if (role === 'MEMBER') return 'Member';
  if (role === 'OWNER_AND_MEMBER') return 'Owner & member';
  return 'Not selected';
}

export function formatAdminOnboardingStatus(status: string): string {
  return status === 'COMPLETE' ? 'Complete' : 'Incomplete';
}

export function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatAdminUserName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'user') {
    return '—';
  }
  return trimmed;
}

export function formatAdminAssociatedSpaces(spaces: Array<{ name: string; type: string }>): string {
  if (!spaces.length) {
    return '—';
  }
  return spaces.map(space => `${space.name} (${space.type})`).join(', ');
}
