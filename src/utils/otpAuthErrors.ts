import { ApiError } from '../api/types';
import { i18n } from '../i18n';

export function mapOtpRequestError(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return i18n.t('common.errors.generic');
  }
  if (err.isNetworkError) {
    return i18n.t('common.errors.network');
  }
  const message = err.message.toLowerCase();
  if (message.includes('too many otp requests')) {
    return i18n.t('common.errors.otpRateLimited');
  }
  if (err.status === 429 || message.includes('please wait before requesting')) {
    return i18n.t('common.errors.otpCooldown');
  }
  if (err.status === 503 || message.includes('unable to send otp')) {
    return i18n.t('common.errors.sendOtp');
  }
  if (err.status === 409 || message.includes('already registered')) {
    return i18n.t('common.errors.mobileAlreadyRegistered');
  }
  return err.message || i18n.t('common.errors.sendOtp');
}

export function mapOtpVerifyError(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return i18n.t('common.errors.generic');
  }
  if (err.isNetworkError) {
    return i18n.t('common.errors.network');
  }
  const message = err.message.toLowerCase();
  if (message.includes('expired')) {
    return i18n.t('common.errors.otpExpired');
  }
  if (message.includes('too many incorrect attempts')) {
    return i18n.t('common.errors.otpMaxAttempts');
  }
  if (message.includes('no longer valid')) {
    return i18n.t('common.errors.otpConsumed');
  }
  if (err.status === 400) {
    return i18n.t('common.errors.incorrectOtp');
  }
  return err.message || i18n.t('common.errors.generic');
}

export function mapRegistrationTokenError(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return i18n.t('common.errors.generic');
  }
  if (err.isNetworkError) {
    return i18n.t('common.errors.network');
  }
  if (err.status === 409) {
    return i18n.t('common.errors.mobileAlreadyRegistered');
  }
  const message = err.message.toLowerCase();
  if (
    message.includes('verification token') ||
    message.includes('already been used')
  ) {
    return i18n.t('common.errors.registrationTokenExpired');
  }
  return err.message || i18n.t('common.errors.generic');
}

export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
