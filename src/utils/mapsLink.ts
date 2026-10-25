const PLACE_ID = /place_id[:=]([A-Za-z0-9_-]+)/i;

/**
 * Android Google Maps searches the literal text "place_id:ChIJ..." when that
 * is the query. The Maps URL API opens the place via query_place_id.
 */
export function openableMapsUrl(mapUrl: string | null | undefined): string {
  const trimmed = mapUrl?.trim() ?? '';
  if (!trimmed) return '';
  if (/[?&]query_place_id=/i.test(trimmed)) return trimmed;
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    decoded = trimmed;
  }
  const placeId = decoded.match(PLACE_ID)?.[1];
  if (!placeId) return trimmed;
  const encoded = encodeURIComponent(placeId);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}&query_place_id=${encoded}`;
}
