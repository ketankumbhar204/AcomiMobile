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

export function photoRequestTitle(kind: PhotoRequestKind, hasPhotos: boolean): string {
  if (kind === 'mess') {
    return hasPhotos ? 'Request more mess photos' : 'Request mess photos';
  }
  return hasPhotos ? 'Request more property photos' : 'Request property photos';
}

export function friendlySpaceType(type: string | null | undefined): string | null {
  const key = (type ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (!key || key === 'MESS' || key === 'TIFFIN') return null;
  if (key === 'PG') return 'PG';
  if (key === 'HOSTEL') return 'Hostel';
  if (key === 'CO_LIVING' || key === 'COLIVING') return 'Co-living';
  if (key === 'RENTAL') return 'Rental';
  if (key === 'CORPORATE_STAY') return 'Corporate Stay';
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
  const more = input.hasPhotos ? 'more ' : '';
  if (input.kind === 'mess') {
    const subject = name || 'your mess';
    return `Hi, I'm interested in ${subject}. Could you please share some ${more}recent photos of the menu, food, and service? Thank you.`;
  }
  const subject = name || 'this property';
  return `Hi, I'm interested in ${subject}. Could you please share some ${more}recent photos of the property and available rooms? Thank you.`;
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

export type PhotoRequestHandoff = {
  notificationPersisted: boolean;
  notificationDuplicate: boolean;
  fcmQueued: boolean;
  phoneAvailable: boolean;
  internationalPhone?: string | null;
};

export type PhotoRequestWhatsAppOutcome = 'opened' | 'unavailable' | 'failed';

export type PhotoRequestConfirmResult = PhotoRequestHandoff & {
  whatsApp: PhotoRequestWhatsAppOutcome;
};

export function isPhotoRequestNotification(item: {
  notificationType?: string | null;
  actionRoute?: string | null;
}): boolean {
  const type = (item.notificationType ?? '').toUpperCase();
  return type === 'PHOTO_REQUEST_RECEIVED' || item.actionRoute === 'FindAPlaceDetail';
}

/**
 * Saves the in-app photo request first, then tries to open WhatsApp.
 * A failure in either step does not undo the other. Opening WhatsApp is not delivery.
 */
export async function confirmPhotoRequest(input: {
  message: string;
  request: () => Promise<PhotoRequestHandoff>;
  openUrl: (url: string) => Promise<void>;
}): Promise<PhotoRequestConfirmResult> {
  const text = input.message.trim();
  if (!text) {
    return {
      whatsApp: 'unavailable',
      notificationPersisted: false,
      notificationDuplicate: false,
      fcmQueued: false,
      phoneAvailable: false,
      internationalPhone: null,
    };
  }
  const handoff = await input.request();
  const base: PhotoRequestHandoff = {
    notificationPersisted: Boolean(handoff.notificationPersisted),
    notificationDuplicate: Boolean(handoff.notificationDuplicate),
    fcmQueued: Boolean(handoff.fcmQueued),
    phoneAvailable: Boolean(handoff.phoneAvailable),
    internationalPhone: handoff.internationalPhone ?? null,
  };
  const url = base.phoneAvailable ? whatsAppChatUrl(base.internationalPhone, text) : null;
  if (!url) {
    return { ...base, whatsApp: 'unavailable' };
  }
  try {
    await input.openUrl(url);
    return { ...base, whatsApp: 'opened' };
  } catch {
    return { ...base, whatsApp: 'failed' };
  }
}
