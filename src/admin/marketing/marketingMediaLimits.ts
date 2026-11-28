/** Configurable limits for admin promotional media shared via WhatsApp (local only). */

import { Platform, Share } from 'react-native';

export const MARKETING_MEDIA_MAX_FILES = 10;
export const MARKETING_MEDIA_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MARKETING_MEDIA_MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export type MarketingMediaKind = 'image' | 'video';

export type MarketingMediaValidationCode =
  | 'TOO_MANY'
  | 'UNSUPPORTED'
  | 'IMAGE_TOO_LARGE'
  | 'VIDEO_TOO_LARGE';

export type MarketingMediaCandidate = {
  name: string;
  mime: string;
  size: number;
};

export type SelectedMarketingMedia = {
  id: string;
  uri: string;
  mime: string;
  size: number;
  name: string;
  kind: MarketingMediaKind;
};

function normalizeMime(mime: string | null | undefined): string {
  return ((mime ?? '').split(';')[0] ?? '').trim().toLowerCase();
}

export function marketingMediaKind(mime: string | null | undefined): MarketingMediaKind | null {
  const normalized = normalizeMime(mime);
  if (
    normalized === 'image/jpeg' ||
    normalized === 'image/jpg' ||
    normalized === 'image/png' ||
    normalized === 'image/webp'
  ) {
    return 'image';
  }
  if (
    normalized === 'video/mp4' ||
    normalized === 'video/quicktime' ||
    normalized === 'video/webm' ||
    normalized === 'video/3gpp'
  ) {
    return 'video';
  }
  return null;
}

export function marketingMediaMaxMb(kind: MarketingMediaKind): number {
  const bytes = kind === 'image' ? MARKETING_MEDIA_MAX_IMAGE_BYTES : MARKETING_MEDIA_MAX_VIDEO_BYTES;
  return Math.max(1, Math.floor(bytes / (1024 * 1024)));
}

export function validateMarketingMediaAddition(
  existingCount: number,
  candidates: MarketingMediaCandidate[],
): { ok: true; accepted: MarketingMediaCandidate[] } | { ok: false; code: MarketingMediaValidationCode } {
  if (existingCount + candidates.length > MARKETING_MEDIA_MAX_FILES) {
    return { ok: false, code: 'TOO_MANY' };
  }
  for (const candidate of candidates) {
    const kind = marketingMediaKind(candidate.mime);
    if (!kind) {
      return { ok: false, code: 'UNSUPPORTED' };
    }
    if (kind === 'image' && candidate.size > MARKETING_MEDIA_MAX_IMAGE_BYTES) {
      return { ok: false, code: 'IMAGE_TOO_LARGE' };
    }
    if (kind === 'video' && candidate.size > MARKETING_MEDIA_MAX_VIDEO_BYTES) {
      return { ok: false, code: 'VIDEO_TOO_LARGE' };
    }
  }
  return { ok: true, accepted: candidates };
}

export type MarketingMediaShareResult =
  | 'shared'
  | 'cancelled'
  | 'unsupported'
  | 'failed'
  | 'partial'
  | 'fallback';

async function shareOneNative(
  item: SelectedMarketingMedia | null,
  message?: string,
): Promise<MarketingMediaShareResult> {
  const caption = message?.trim() || undefined;
  try {
    if (!item) {
      if (!caption) return 'unsupported';
      await Share.share({ message: caption, title: 'ACOMI listing message' });
      return 'shared';
    }

    // Share the file URI without caption text. Including text often opens WhatsApp without the
    // contact/media picker. Callers should copy the caption to the clipboard separately.
    if (Platform.OS === 'ios') {
      await Share.share({
        url: item.uri,
      });
      return 'shared';
    }

    await Share.share({
      url: item.uri,
      title: item.name,
    });
    return 'shared';
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    if (/cancel/i.test(messageText)) {
      return 'cancelled';
    }
    return 'failed';
  }
}

/**
 * System share sheet for Share message and media mode.
 * Shares files without caption text so WhatsApp can open its recipient/media picker.
 * Callers should copy the caption to the clipboard before invoking this.
 * Remaining files are offered in follow-up share sheets when possible.
 */
export async function shareMarketingMediaNatively(
  items: SelectedMarketingMedia[],
  message?: string,
): Promise<MarketingMediaShareResult> {
  const caption = message?.trim() || undefined;
  if (items.length === 0) {
    return shareOneNative(null, caption);
  }

  let sharedCount = 0;
  for (let index = 0; index < items.length; index += 1) {
    const result = await shareOneNative(items[index]);
    if (result === 'cancelled' && sharedCount === 0) {
      return 'cancelled';
    }
    if (result === 'shared') {
      sharedCount += 1;
    } else if (sharedCount === 0) {
      return result;
    } else {
      break;
    }
  }

  if (sharedCount === 0) {
    return 'unsupported';
  }
  return sharedCount < items.length ? 'partial' : 'shared';
}
