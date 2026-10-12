export type PhotoRequestKind = 'property' | 'mess';

const INDIAN_MOBILE = /^[6-9]\d{9}$/;

/** Actual uploaded listing photos only. Representative, stock, and empty sources do not count. */
export function isActualListingPhoto(url: string | null | undefined): boolean {
  const value = url?.trim() ?? '';
  if (!value) return false;
  const lower = value.toLowerCase();
  if (lower.startsWith('representative:')) return false;
  if (lower.includes('/images/representative/')) return false;
  if (lower.includes('images.unsplash.com')) return false;
  if (lower.startsWith('data:') || lower.startsWith('blob:')) return false;
  return lower.startsWith('https://') || lower.startsWith('http://') || value.startsWith('/');
}

export function actualListingPhotos(
  urls: ReadonlyArray<string | null | undefined> | null | undefined,
): string[] {
  if (!urls?.length) return [];
  const seen = new Set<string>();
  const photos: string[] = [];
  for (const url of urls) {
    const value = url?.trim() ?? '';
    if (!isActualListingPhoto(value) || seen.has(value)) continue;
    seen.add(value);
    photos.push(value);
  }
  return photos;
}

export function hasActualListingPhotos(
  urls: ReadonlyArray<string | null | undefined> | null | undefined,
): boolean {
  return actualListingPhotos(urls).length > 0;
}

export function photoRequestActionLabel(hasPhotos: boolean): string {
  return hasPhotos ? 'Request more photos on WhatsApp' : 'Request photos on WhatsApp';
}

export function photoRequestTitle(hasPhotos: boolean): string {
  return hasPhotos ? 'Request more photos' : 'Request photos';
}

export function friendlySpaceType(type: string | null | undefined): string | null {
  const key = (type ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (!key || key === 'MESS' || key === 'TIFFIN') return null;
  if (key === 'PG') return 'PG';
  if (key === 'HOSTEL') return 'Hostel';
  if (key === 'CO_LIVING' || key === 'COLIVING') return 'Co-living';
  if (key === 'RENTAL') return 'Rental';
  return null;
}

function cleanPhrase(value: string | null | undefined): string {
  const text = value?.replace(/\s+/g, ' ').trim() ?? '';
  if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') return '';
  return text;
}

export function buildPhotoRequestMessage(input: {
  kind: PhotoRequestKind;
  hasPhotos: boolean;
  name?: string | null;
  spaceType?: string | null;
  location?: string | null;
}): string {
  const name = cleanPhrase(input.name);
  const location = cleanPhrase(input.location);
  if (input.kind === 'mess') {
    if (input.hasPhotos) {
      const subject = name ? ` in ${name}` : '';
      return `Hi, I am interested${subject}. Could you please share some more photos of your meals, food portions and menu? Thank you!`;
    }
    const named = name ? `, ${name}` : '';
    return `Hi, I am interested in your mess service${named}. Could you please share some actual photos of your meals, food portions and menu? Thank you!`;
  }

  if (input.hasPhotos) {
    const subject = name ? ` in ${name}` : '';
    return `Hi, I am interested${subject}. Could you please share some more photos, especially of the room, bathroom and common areas? Thank you!`;
  }

  const spaceType = friendlySpaceType(input.spaceType) ?? 'place';
  const where = location ? ` in ${location}` : '';
  const named = name ? ` of ${name}` : '';
  return `Hi, I am looking for a ${spaceType}${where}. Could you please share some actual photos${named}, including the room, bathroom and common areas? Thank you!`;
}

/** Digits for wa.me. Indian locals become 91XXXXXXXXXX. Existing country codes are kept. */
export function whatsAppPhoneDigits(raw: string | null | undefined): string | null {
  let digits = (raw ?? '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (!digits) return null;
  if (digits.length === 10 && INDIAN_MOBILE.test(digits)) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0') && INDIAN_MOBILE.test(digits.slice(1))) {
    return `91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('91') && INDIAN_MOBILE.test(digits.slice(2))) {
    return digits;
  }
  if (digits.length >= 11 && digits.length <= 15 && !digits.startsWith('0')) return digits;
  return null;
}

export function firstWhatsAppPhone(
  phones: ReadonlyArray<string | null | undefined> | null | undefined,
): string | null {
  for (const phone of phones ?? []) {
    const digits = whatsAppPhoneDigits(phone);
    if (digits) return digits;
  }
  return null;
}

export function whatsAppChatUrl(phone: string | null | undefined, message: string): string | null {
  const digits = whatsAppPhoneDigits(phone);
  const text = message.trim();
  if (!digits || !text) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
