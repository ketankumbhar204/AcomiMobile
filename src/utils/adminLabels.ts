export function formatRegistrationSource(source: string): string {
  if (source === 'ADMIN') {
    return 'Added by Admin';
  }
  return 'Registered on Website';
}

export function formatRegistrationStatus(status: string): string {
  return status.replace(/_/g, ' ');
}
