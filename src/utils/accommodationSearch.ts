export function matchesSearch(query: string, ...fields: (string | number | null | undefined)[]): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return fields.some(field => {
    if (field === null || field === undefined) {
      return false;
    }
    return String(field).toLowerCase().includes(normalized);
  });
}
