import type { InquiryCreditsPaymentConfig } from '../../../api/inquiryCreditsApi';
import {
  draftFromPaymentConfig,
  paymentConfigUpdateFromDraft,
  type InquiryCreditsConfigDraft,
} from '../inquiryCreditsConfigDraft';

function config(
  overrides: Partial<InquiryCreditsPaymentConfig> = {},
): InquiryCreditsPaymentConfig {
  return {
    enabled: true,
    upiId: 'shop@upi',
    qrFileId: 'qr-1',
    whatsappNumber: '919800000000',
    instructions: 'Pay, then send the screenshot.',
    webFreeDailyLimit: 4,
    viewHereDailyLimit: 0,
    webViewHereEnabled: false,
    androidViewHereEnabled: true,
    androidViewHereDailyLimit: 9,
    androidBillingMode: 'CREDITS',
    androidFreeDailyLimit: 8,
    androidHourlyRateLimit: 15,
    packages: [],
    ...overrides,
  };
}

function draft(
  overrides: Partial<InquiryCreditsConfigDraft> = {},
): InquiryCreditsConfigDraft {
  return {
    ...draftFromPaymentConfig(config()),
    ...overrides,
  };
}

describe('inquiry credits config draft', () => {
  it('keeps persisted zeroes and disabled flags instead of the fallback defaults', () => {
    const next = draftFromPaymentConfig(config());

    expect(next.webFree).toBe('4');
    expect(next.webViewHere).toBe('0');
    expect(next.webViewHereEnabled).toBe(false);
    expect(next.androidViewHere).toBe('9');
    expect(next.androidViewHereEnabled).toBe(true);
    expect(next.androidFree).toBe('8');
    expect(next.androidMode).toBe('CREDITS');
    expect(next.hourly).toBe('15');
    expect(next.qrFileId).toBe('qr-1');
    expect(next.qrCleared).toBe(false);
  });

  it('uses the web fallbacks only when the response omits a field', () => {
    const next = draftFromPaymentConfig(
      config({
        webFreeDailyLimit: undefined,
        viewHereDailyLimit: undefined,
        webViewHereEnabled: undefined,
        androidViewHereEnabled: undefined,
        androidViewHereDailyLimit: undefined,
        androidBillingMode: undefined,
        androidFreeDailyLimit: undefined,
        androidHourlyRateLimit: undefined,
        qrFileId: undefined,
      }),
    );

    expect(next.webFree).toBe('5');
    expect(next.webViewHere).toBe('5');
    expect(next.webViewHereEnabled).toBe(true);
    expect(next.androidViewHere).toBe('5');
    expect(next.androidViewHereEnabled).toBe(true);
    expect(next.androidMode).toBe('FREE');
    expect(next.androidFree).toBe('5');
    expect(next.hourly).toBe('20');
    expect(next.qrFileId).toBeNull();
    expect(next.qrCleared).toBe(false);
  });

  it('sends contact-view limits even when viewing is disabled, without touching enquiry quotas', () => {
    const body = paymentConfigUpdateFromDraft(
      draft({
        webViewHereEnabled: false,
        webViewHere: '7',
        webFree: '2',
        androidViewHereEnabled: false,
        androidViewHere: '3',
        androidMode: 'FREE',
        androidFree: '8',
        hourly: '20',
      }),
    );

    expect(body.webViewHereEnabled).toBe(false);
    expect(body.viewHereDailyLimit).toBe(7);
    expect(body.webFreeDailyLimit).toBe(2);
    expect(body.androidViewHereEnabled).toBe(false);
    expect(body.androidViewHereDailyLimit).toBe(3);
    expect(body.androidBillingMode).toBe('FREE');
    expect(body.androidFreeDailyLimit).toBe(8);
    expect(body.androidHourlyRateLimit).toBe(20);
    expect(body.qrFileId).toBe('qr-1');
    expect(body.clearQr).toBeUndefined();
  });

  it('clears the QR only after an explicit remove, and keeps it when quotas change', () => {
    const removed = paymentConfigUpdateFromDraft(
      draft({ qrFileId: null, qrCleared: true, webFree: '1' }),
    );
    expect(removed.qrFileId).toBeNull();
    expect(removed.clearQr).toBe(true);
    expect(removed.webFreeDailyLimit).toBe(1);

    const untouched = paymentConfigUpdateFromDraft(draft({ webViewHere: '2' }));
    expect(untouched.qrFileId).toBe('qr-1');
    expect(untouched.clearQr).toBeUndefined();
    expect(untouched.viewHereDailyLimit).toBe(2);
  });

  it('does not replace an empty hourly limit with the default of 20', () => {
    const body = paymentConfigUpdateFromDraft(draft({ hourly: '' }));
    expect(body.androidHourlyRateLimit).toBe(0);
  });

  it('keeps the stored free-enquiry count when billing mode stays Free', () => {
    const loaded = draftFromPaymentConfig(
      config({ androidBillingMode: 'FREE', androidFreeDailyLimit: 11 }),
    );
    const body = paymentConfigUpdateFromDraft({ ...loaded, androidMode: 'FREE' });

    expect(body.androidFreeDailyLimit).toBe(11);
    expect(body.androidBillingMode).toBe('FREE');
  });
});
