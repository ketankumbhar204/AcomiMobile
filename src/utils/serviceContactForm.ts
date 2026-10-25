import { isValidIndianMobile, normalizeIndianMobileDigits } from './indianMobile';
import type { SaveServiceContactBody, ServiceContact } from '../api/serviceContactsApi';
import { nationalPhone } from './serviceContactLinks';

const EMAIL = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const CUSTOM = /^[\p{L}\p{N}][\p{L}\p{N} .&/'\-]{1,79}$/u;

export interface ServiceContactDraft {
  businessName: string;
  category: string;
  customCategoryName: string;
  contactPersonName: string;
  primaryPhone: string;
  alternatePhone: string;
  whatsappPhone: string;
  email: string;
  description: string;
  address: string;
  notes: string;
  spaceIds: string[];
  version: number | null;
}

export function emptyDraft(): ServiceContactDraft {
  return {
    businessName: '',
    category: '',
    customCategoryName: '',
    contactPersonName: '',
    primaryPhone: '',
    alternatePhone: '',
    whatsappPhone: '',
    email: '',
    description: '',
    address: '',
    notes: '',
    spaceIds: [],
    version: null,
  };
}

export function draftFromContact(contact: ServiceContact): ServiceContactDraft {
  return {
    businessName: contact.businessName ?? '',
    category: contact.category ?? '',
    customCategoryName: contact.customCategoryName ?? '',
    contactPersonName: contact.contactPersonName ?? '',
    primaryPhone: nationalPhone(contact.primaryPhone),
    alternatePhone: nationalPhone(contact.alternatePhone),
    whatsappPhone: nationalPhone(contact.whatsappPhone),
    email: contact.email ?? '',
    description: contact.description ?? '',
    address: contact.address ?? '',
    notes: contact.notes ?? '',
    spaceIds: contact.spaces.map(space => space.spaceId),
    version: contact.version,
  };
}

export function validateServiceContactDraft(draft: ServiceContactDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.businessName.trim()) {
    errors.businessName = 'name_required';
  }
  if (!draft.category) {
    errors.category = 'category_required';
  }
  if (
    draft.category === 'OTHER' &&
    !CUSTOM.test(draft.customCategoryName.trim().replace(/\s+/g, ' '))
  ) {
    errors.customCategoryName = 'custom_required';
  }
  for (const field of ['primaryPhone', 'alternatePhone', 'whatsappPhone'] as const) {
    const raw = draft[field].trim();
    if (raw && !isValidIndianMobile(raw)) {
      errors[field] = 'phone_invalid';
    }
  }
  const email = draft.email.trim();
  if (email && !EMAIL.test(email)) {
    errors.email = 'email_invalid';
  }
  const hasMethod =
    isValidIndianMobile(draft.primaryPhone) ||
    isValidIndianMobile(draft.alternatePhone) ||
    isValidIndianMobile(draft.whatsappPhone) ||
    EMAIL.test(email);
  if (
    !hasMethod &&
    !errors.primaryPhone &&
    !errors.alternatePhone &&
    !errors.whatsappPhone &&
    !errors.email
  ) {
    errors.contactMethod = 'method_required';
  }
  return errors;
}

function phoneOrNull(value: string): string | null {
  const digits = normalizeIndianMobileDigits(value);
  return isValidIndianMobile(digits) ? digits : null;
}

export function toSaveBody(
  draft: ServiceContactDraft,
  acknowledgeDuplicate: boolean,
): SaveServiceContactBody {
  return {
    businessName: draft.businessName.trim(),
    category: draft.category,
    customCategoryName: draft.category === 'OTHER' ? draft.customCategoryName.trim() : null,
    contactPersonName: draft.contactPersonName.trim() || null,
    primaryPhone: phoneOrNull(draft.primaryPhone),
    alternatePhone: phoneOrNull(draft.alternatePhone),
    whatsappPhone: phoneOrNull(draft.whatsappPhone),
    email: draft.email.trim() || null,
    description: draft.description.trim() || null,
    address: draft.address.trim() || null,
    notes: draft.notes.trim() || null,
    spaceIds: draft.spaceIds,
    acknowledgeDuplicate,
    version: draft.version,
  };
}
