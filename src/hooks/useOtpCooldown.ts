import type { OtpPurpose } from '../api/types';
import { useRegistrationDraftStore } from '../store/registrationDraftStore';
import { normalizeIndianMobileDigits } from '../utils/indianMobile';
import { useCountdown } from './useCountdown';

/**
 * Seconds left before another OTP may be requested for this number and purpose.
 * Returns 0 when the caller is free to send.
 */
export function useOtpCooldown(
  mobileNumber: string,
  purpose: OtpPurpose,
): number {
  const cooldownMobile = useRegistrationDraftStore(draft => draft.cooldownMobile);
  const cooldownPurpose = useRegistrationDraftStore(
    draft => draft.cooldownPurpose,
  );
  const cooldownUntil = useRegistrationDraftStore(draft => draft.cooldownUntil);

  const matches =
    cooldownUntil != null &&
    cooldownPurpose === purpose &&
    cooldownMobile != null &&
    cooldownMobile === normalizeIndianMobileDigits(mobileNumber);

  return useCountdown(matches ? cooldownUntil : null);
}
