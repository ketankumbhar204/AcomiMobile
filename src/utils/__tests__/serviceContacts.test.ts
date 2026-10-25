import { associableSpaces, canManageServiceContacts, canOpenServiceContacts } from '../serviceContactAccess';
import { emptyDraft, validateServiceContactDraft } from '../serviceContactForm';
import { mailtoHref, telHref, whatsappHref } from '../serviceContactLinks';

describe('service contacts', () => {
  it('hides the directory from tenants and lets staff view without managing', () => {
    expect(canOpenServiceContacts([{ membershipRole: 'TENANT' }])).toBe(false);
    expect(canOpenServiceContacts([{ membershipRole: 'CUSTOMER' }])).toBe(false);
    expect(canOpenServiceContacts([{ membershipRole: 'STAFF' }])).toBe(true);
    expect(canManageServiceContacts([{ membershipRole: 'STAFF' }])).toBe(false);
    expect(canManageServiceContacts([{ membershipRole: 'OWNER' }])).toBe(true);
    expect(associableSpaces([
      { membershipRole: 'STAFF' },
      { membershipRole: 'MANAGER' },
    ])).toHaveLength(1);
  });

  it('builds call and WhatsApp links with +91 and rejects a bad email', () => {
    expect(telHref('9876543210')).toBe('tel:+919876543210');
    expect(whatsappHref('+91 98765 43210')).toBe('https://wa.me/919876543210');
    expect(mailtoHref('bad')).toBeNull();
    expect(mailtoHref('owner@example.com')).toBe('mailto:owner@example.com');
  });

  it('requires a name, category, and a usable contact method', () => {
    const errors = validateServiceContactDraft(emptyDraft());
    expect(errors.businessName).toBe('name_required');
    expect(errors.category).toBe('category_required');
    expect(errors.contactMethod).toBe('method_required');

    const custom = validateServiceContactDraft({
      ...emptyDraft(),
      businessName: 'Ramesh Electricals',
      category: 'OTHER',
      customCategoryName: 'x',
      primaryPhone: '9876543210',
    });
    expect(custom.customCategoryName).toBe('custom_required');
  });
});
