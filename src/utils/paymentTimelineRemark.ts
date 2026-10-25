import type { PaymentTimelineEventResponse } from '../api/types';

export type TimelineRemarkKind = 'whatsappDisabled' | 'noDevice' | 'fcmUnavailable' | 'fcmRejected';

export function paymentTimelineRemarkKind(remarks?: string | null): TimelineRemarkKind | null {
  const text = remarks?.trim() ?? '';
  if (!text) return null;
  if (text.includes('WHATSAPP_PROVIDER_NOT_CONFIGURED') || text.includes('PROVIDER_NOT_CONFIGURED')) {
    return 'whatsappDisabled';
  }
  if (text.includes('NO_ACTIVE_DEVICE_TOKEN')) return 'noDevice';
  if (text.includes('FCM_UNAVAILABLE')) return 'fcmUnavailable';
  if (text.includes('FCM_REJECTED')) return 'fcmRejected';
  return null;
}

/** Friendly copy for known failures, with the original code kept for diagnosis. */
export function paymentTimelineRemarkContent(remarks?: string | null): {
  messageKey: string | null;
  text: string | null;
  diagnostic: string | null;
} {
  const text = remarks?.trim() ?? '';
  if (!text) {
    return { messageKey: null, text: null, diagnostic: null };
  }
  const kind = paymentTimelineRemarkKind(text);
  if (!kind) {
    return { messageKey: null, text, diagnostic: null };
  }
  return {
    messageKey: `paymentCollection.timeline.${kind}`,
    text: null,
    diagnostic: text,
  };
}

/** Drop a repeated event id. Events without an id stay, even when the outcome is a failure. */
export function distinctPaymentTimelineEvents(
  events: PaymentTimelineEventResponse[],
): PaymentTimelineEventResponse[] {
  const seen = new Set<string>();
  const distinct: PaymentTimelineEventResponse[] = [];
  for (const event of events) {
    const id = event.eventId?.trim();
    if (id) {
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);
    }
    distinct.push(event);
  }
  return distinct;
}
