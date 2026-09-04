import { i18n } from '../i18n';

export function formatRegistrationSource(source: string): string {
  if (source === 'ADMIN') {
    return i18n.t('admin.labels.addedByAdmin');
  }
  return i18n.t('admin.labels.registeredOnWebsite');
}

export function formatRegistrationStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

export function formatAdminUserRole(role: string): string {
  if (role === 'OWNER') return i18n.t('admin.labels.owner');
  if (role === 'MEMBER') return i18n.t('admin.labels.member');
  if (role === 'OWNER_AND_MEMBER') return i18n.t('admin.labels.ownerAndMember');
  return i18n.t('admin.labels.notSelected');
}

export function formatAdminOnboardingStatus(status: string): string {
  return status === 'COMPLETE'
    ? i18n.t('admin.labels.complete')
    : i18n.t('admin.labels.incomplete');
}

export function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) return i18n.t('admin.labels.emDash');
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return i18n.t('admin.labels.emDash');
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatAdminUserName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'user') {
    return i18n.t('admin.labels.emDash');
  }
  return trimmed;
}

export function formatAdminAssociatedSpaces(spaces: Array<{ name: string; type: string }>): string {
  if (!spaces.length) {
    return i18n.t('admin.labels.emDash');
  }
  return spaces.map(space => `${space.name} (${space.type})`).join(', ');
}
