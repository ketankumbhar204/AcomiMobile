import { i18n } from '../i18n';

export type NewMemberFieldErrors = {
  fullName?: string;
  mobileNumber?: string;
};

export function validateNewMemberFields(
  fullName: string,
  mobileNumber: string,
): NewMemberFieldErrors {
  const errors: NewMemberFieldErrors = {};
  const digits = mobileNumber.replace(/\D/g, '');

  if (!fullName.trim()) {
    errors.fullName = i18n.t('membership.add.fullNameRequired');
  }

  if (!mobileNumber.trim()) {
    errors.mobileNumber = i18n.t('membership.invite.mobileRequired');
  } else if (digits.length < 10) {
    errors.mobileNumber = i18n.t('membership.invite.mobileInvalid');
  }

  return errors;
}

export function hasFieldErrors(errors: NewMemberFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
