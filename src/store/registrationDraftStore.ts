import { create } from 'zustand';

type RegistrationDraftState = {
  mobileNumber: string | null;
  expiresIn: number | null;
  resendAfter: number | null;
  otpSentAt: number | null;
  verificationToken: string | null;
  verificationTokenExpiresAt: number | null;
  beginOtp: (mobileNumber: string, expiresIn: number, resendAfter: number) => void;
  markResent: (expiresIn: number, resendAfter: number) => void;
  setVerified: (token: string, expiresInSeconds: number) => void;
  clearVerification: () => void;
  clear: () => void;
};

export const useRegistrationDraftStore = create<RegistrationDraftState>(set => ({
  mobileNumber: null,
  expiresIn: null,
  resendAfter: null,
  otpSentAt: null,
  verificationToken: null,
  verificationTokenExpiresAt: null,

  beginOtp: (mobileNumber, expiresIn, resendAfter) =>
    set({
      mobileNumber,
      expiresIn,
      resendAfter,
      otpSentAt: Date.now(),
      verificationToken: null,
      verificationTokenExpiresAt: null,
    }),

  markResent: (expiresIn, resendAfter) =>
    set({
      expiresIn,
      resendAfter,
      otpSentAt: Date.now(),
      verificationToken: null,
      verificationTokenExpiresAt: null,
    }),

  setVerified: (token, expiresInSeconds) =>
    set({
      verificationToken: token,
      verificationTokenExpiresAt: Date.now() + expiresInSeconds * 1000,
    }),

  clearVerification: () =>
    set({
      verificationToken: null,
      verificationTokenExpiresAt: null,
    }),

  clear: () =>
    set({
      mobileNumber: null,
      expiresIn: null,
      resendAfter: null,
      otpSentAt: null,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    }),
}));

export function isRegistrationTokenValid(
  token: string | null,
  expiresAt: number | null,
): boolean {
  return Boolean(token) && expiresAt != null && expiresAt > Date.now();
}
