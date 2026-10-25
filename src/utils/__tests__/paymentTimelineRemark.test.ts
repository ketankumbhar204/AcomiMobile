import type { PaymentTimelineEventResponse } from '../../api/types';
import {
  distinctPaymentTimelineEvents,
  paymentTimelineRemarkContent,
  paymentTimelineRemarkKind,
} from '../paymentTimelineRemark';

describe('paymentTimelineRemarkKind', () => {
  it('explains a historical WhatsApp configuration failure without treating it as a new send', () => {
    expect(paymentTimelineRemarkKind('WHATSAPP_PROVIDER_NOT_CONFIGURED')).toBe('whatsappDisabled');
  });

  it('keeps ordinary timeline notes unchanged', () => {
    expect(paymentTimelineRemarkKind('Push notification accepted · 2026-10-09')).toBeNull();
    expect(paymentTimelineRemarkKind(null)).toBeNull();
  });

  it('identifies Firebase delivery outcomes', () => {
    expect(paymentTimelineRemarkKind('NO_ACTIVE_DEVICE_TOKEN: Member has no registered device')).toBe('noDevice');
    expect(paymentTimelineRemarkKind('FCM_UNAVAILABLE: Firebase push notifications are not available')).toBe(
      'fcmUnavailable',
    );
  });

  it('keeps the provider code as diagnostic detail under a readable message', () => {
    expect(paymentTimelineRemarkContent('WHATSAPP_PROVIDER_NOT_CONFIGURED')).toEqual({
      messageKey: 'paymentCollection.timeline.whatsappDisabled',
      text: null,
      diagnostic: 'WHATSAPP_PROVIDER_NOT_CONFIGURED',
    });
    expect(paymentTimelineRemarkContent('Owner asked for a clearer screenshot')).toEqual({
      messageKey: null,
      text: 'Owner asked for a clearer screenshot',
      diagnostic: null,
    });
  });
});

describe('distinctPaymentTimelineEvents', () => {
  it('keeps separate reminder failures and drops a repeated event id', () => {
    const created = {
      eventId: 'evt-created',
      paymentId: 'pay-1',
      eventType: 'CREATED',
      performedAt: '2026-10-03T14:35:00.000Z',
    } as PaymentTimelineEventResponse;
    const firstFailure = {
      eventId: 'evt-fail-1',
      paymentId: 'pay-1',
      eventType: 'REMINDER_FAILED',
      performedAt: '2026-10-09T16:23:00.000Z',
      remarks: 'WHATSAPP_PROVIDER_NOT_CONFIGURED',
    } as PaymentTimelineEventResponse;
    const secondFailure = {
      eventId: 'evt-fail-2',
      paymentId: 'pay-1',
      eventType: 'REMINDER_FAILED',
      performedAt: '2026-10-11T09:38:00.000Z',
      remarks: 'WHATSAPP_PROVIDER_NOT_CONFIGURED',
    } as PaymentTimelineEventResponse;

    expect(
      distinctPaymentTimelineEvents([created, firstFailure, firstFailure, secondFailure]).map(
        event => event.eventId,
      ),
    ).toEqual(['evt-created', 'evt-fail-1', 'evt-fail-2']);
  });
});
