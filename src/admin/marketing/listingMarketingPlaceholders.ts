export const LISTING_MARKETING_PLACEHOLDERS = [
  'ownerName',
  'propertyName',
  'messName',
  'name',
  'spaceType',
  'location',
  'address',
  'rent',
  'rentOrPrice',
  'sharing',
  'sharingNotes',
  'amenities',
  'foodIncluded',
  'genderPolicy',
  'description',
] as const;

export type ListingMarketingPlaceholder = (typeof LISTING_MARKETING_PLACEHOLDERS)[number];

export const LISTING_MARKETING_PLACEHOLDER_SET = new Set<string>(LISTING_MARKETING_PLACEHOLDERS);

const TOKEN_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

export function extractListingMarketingPlaceholders(body: string): string[] {
  const found = new Set<string>();
  const matches = body.matchAll(TOKEN_RE);
  for (const match of matches) {
    if (match[1]) found.add(match[1]);
  }
  return [...found];
}

export function unsupportedListingMarketingPlaceholders(body: string): string[] {
  return extractListingMarketingPlaceholders(body).filter(
    token => !LISTING_MARKETING_PLACEHOLDER_SET.has(token),
  );
}

export function insertListingMarketingPlaceholder(
  body: string,
  token: string,
  cursor = body.length,
): string {
  const snippet = `{{${token}}}`;
  const start = Math.max(0, Math.min(cursor, body.length));
  return `${body.slice(0, start)}${snippet}${body.slice(start)}`;
}
