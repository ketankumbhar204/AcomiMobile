import { create } from 'zustand';
import type { OtpPurpose } from '../api/types';

type RegistrationDraftState = {
  mobileNumber: string | null;
  purpose: OtpPurpose | null;
  fullName: string | null;
  password: string | null;
  confirmPassword: string | null;
  expiresIn: number | null;
  resendAfter: number | null;
  otpSentAt: number | null;
  verificationToken: string | null;
  verificationTokenExpiresAt: number | null;
  setCredentials: (input: {
    fullName: string;
    password: string;
    confirmPassword: string;
  }) => void;
  beginOtp: (
    mobileNumber: string,
    expiresIn: number,
    resendAfter: number,
    purpose?: OtpPurpose,
  ) => void;
  markResent: (expiresIn: number, resendAfter: number) => void;
  setVerified: (token: string, expiresInSeconds: number) => void;
  clearVerification: () => void;
  clear: () => void;
};

export const useRegistrationDraftStore = create<RegistrationDraftState>(set => ({
  mobileNumber: null,
  purpose: null,
  fullName: null,
  password: null,
  confirmPassword: null,
  expiresIn: null,
  resendAfter: null,
  otpSentAt: null,
  verificationToken: null,
  verificationTokenExpiresAt: null,

  setCredentials: ({ fullName, password, confirmPassword }) =>
    set({
      fullName,
      password,
      confirmPassword,
    }),

  beginOtp: (mobileNumber, expiresIn, resendAfter, purpose = 'REGISTER') =>
    set({
      mobileNumber,
      purpose,
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
      purpose: null,
      fullName: null,
      password: null,
      confirmPassword: null,
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
