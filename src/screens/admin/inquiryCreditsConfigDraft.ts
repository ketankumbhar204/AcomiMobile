import type { InquiryCreditsPaymentConfig } from '../../api/inquiryCreditsApi';
import type { UpdateInquiryPaymentConfigRequest } from '../../api/inquiryCreditsAdminApi';

export type InquiryCreditsConfigDraft = {
  enabled: boolean;
  upiId: string;
  whatsapp: string;
  instructions: string;
  qrFileId: string | null;
  /** True after the admin removes the QR. A later upload clears it. */
  qrCleared: boolean;
  webFree: string;
  webViewHereEnabled: boolean;
  webViewHere: string;
  androidViewHereEnabled: boolean;
  androidViewHere: string;
  androidMode: 'FREE' | 'CREDITS';
  androidFree: string;
  hourly: string;
};

/** Same initial values the web admin uses before a config response arrives. */
export const emptyInquiryCreditsConfigDraft: InquiryCreditsConfigDraft = {
  enabled: false,
  upiId: '',
  whatsapp: '',
  instructions: '',
  qrFileId: null,
  qrCleared: false,
  webFree: '5',
  webViewHereEnabled: true,
  webViewHere: '5',
  androidViewHereEnabled: true,
  androidViewHere: '5',
  androidMode: 'FREE',
  androidFree: '5',
  hourly: '20',
};

/**
 * Map the payment-config response onto the form.
 * Missing fields use the web admin fallbacks. Zero and false are real values.
 */
export function draftFromPaymentConfig(
  config: InquiryCreditsPaymentConfig,
): InquiryCreditsConfigDraft {
  return {
    enabled: config.enabled,
    upiId: config.upiId ?? '',
    whatsapp: config.whatsappNumber ?? '',
    instructions: config.instructions ?? '',
    qrFileId: config.qrFileId ?? null,
    qrCleared: false,
    webFree: String(config.webFreeDailyLimit ?? 5),
    webViewHereEnabled: config.webViewHereEnabled !== false,
    webViewHere: String(config.viewHereDailyLimit ?? 5),
    androidViewHereEnabled: config.androidViewHereEnabled !== false,
    androidViewHere: String(config.androidViewHereDailyLimit ?? 5),
    androidMode: config.androidBillingMode === 'CREDITS' ? 'CREDITS' : 'FREE',
    androidFree: String(config.androidFreeDailyLimit ?? 5),
    hourly: String(config.androidHourlyRateLimit ?? 20),
  };
}

function integerOrZero(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return 0;
  return Math.trunc(parsed);
}

/**
 * Save body aligned with the web admin.
 * Contact-view numbers are still sent when their toggles are off, and the
 * mobile free-enquiry count is still sent when billing mode is Free.
 * Hourly rate is not rewritten to a default; the API rejects values below 1.
 */
export function paymentConfigUpdateFromDraft(
  draft: InquiryCreditsConfigDraft,
): UpdateInquiryPaymentConfigRequest {
  return {
    enabled: draft.enabled,
    upiId: draft.upiId.trim() || null,
    whatsappNumber: draft.whatsapp.trim() || null,
    instructions: draft.instructions.trim() || null,
    qrFileId: draft.qrFileId,
    clearQr: draft.qrCleared && !draft.qrFileId ? true : undefined,
    webFreeDailyLimit: integerOrZero(draft.webFree),
    viewHereDailyLimit: Math.max(0, integerOrZero(draft.webViewHere)),
    webViewHereEnabled: draft.webViewHereEnabled,
    androidViewHereEnabled: draft.androidViewHereEnabled,
    androidViewHereDailyLimit: Math.max(0, integerOrZero(draft.androidViewHere)),
    androidBillingMode: draft.androidMode,
    androidFreeDailyLimit: integerOrZero(draft.androidFree),
    androidHourlyRateLimit: integerOrZero(draft.hourly),
  };
}
