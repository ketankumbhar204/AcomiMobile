import type { SpaceEnquiryResponse } from '../api/types';

/** True when owner contact was delivered by email (authoritative API fields). */
export function contactWasEmailed(enquiry: SpaceEnquiryResponse | null | undefined): boolean {
  if (!enquiry || enquiry.status !== 'SHARED') {
    return false;
  }
  if (typeof enquiry.contactEmailSent === 'boolean') {
    return enquiry.contactEmailSent;
  }
  if (enquiry.contactDelivery === 'EMAIL') {
    return true;
  }
  if (enquiry.contactDelivery === 'IN_APP') {
    return false;
  }
  if (enquiry.clientChannel === 'ANDROID') {
    return false;
  }
  return true;
}
