import type { SpaceType } from '../../api/types';

export type BuiltinListingMarketingTemplateKey =
  | 'general_property'
  | 'pg_promotion'
  | 'coliving_promotion'
  | 'hostel_promotion'
  | 'rental_promotion'
  | 'corporate_stay_promotion'
  | 'mess_promotion';

/** Built-in key or custom template id / synthetic key. */
export type ListingMarketingTemplateKey = BuiltinListingMarketingTemplateKey | string;

export type ListingMarketingKind = 'PROPERTY' | 'MESS';

export type ListingMarketingTemplateApplicability = 'PROPERTY' | 'MESS' | 'BOTH';

export interface ListingMarketingTemplate {
  key: ListingMarketingTemplateKey;
  name?: string;
  kinds: ListingMarketingKind[];
  spaceTypes?: SpaceType[];
  builtin: boolean;
  body?: string;
  description?: string | null;
  active?: boolean;
  customId?: string;
}

export const BUILTIN_LISTING_MARKETING_TEMPLATE_KEYS: BuiltinListingMarketingTemplateKey[] = [
  'general_property',
  'pg_promotion',
  'coliving_promotion',
  'hostel_promotion',
  'rental_promotion',
  'corporate_stay_promotion',
  'mess_promotion',
];

export const LISTING_MARKETING_TEMPLATES: ListingMarketingTemplate[] = [
  { key: 'general_property', kinds: ['PROPERTY'], builtin: true },
  { key: 'pg_promotion', kinds: ['PROPERTY'], spaceTypes: ['PG'], builtin: true },
  { key: 'coliving_promotion', kinds: ['PROPERTY'], spaceTypes: ['CO_LIVING'], builtin: true },
  { key: 'hostel_promotion', kinds: ['PROPERTY'], spaceTypes: ['HOSTEL'], builtin: true },
  { key: 'rental_promotion', kinds: ['PROPERTY'], spaceTypes: ['RENTAL'], builtin: true },
  {
    key: 'corporate_stay_promotion',
    kinds: ['PROPERTY'],
    spaceTypes: ['CORPORATE_STAY'],
    builtin: true,
  },
  { key: 'mess_promotion', kinds: ['MESS'], builtin: true },
];

export interface ListingMarketingMessageFields {
  name?: string | null;
  spaceType?: string | null;
  ownerName?: string | null;
  location?: string | null;
  rentOrPrice?: string | null;
  address?: string | null;
  publicListingUrl?: string | null;
  sharing?: string | null;
  amenities?: string | null;
  foodIncluded?: string | null;
  genderPolicy?: string | null;
  description?: string | null;
}

function clean(value?: string | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

function resolvePlaceholderValue(
  token: string,
  fields: ListingMarketingMessageFields,
): string | null {
  const name = clean(fields.name);
  const rent = clean(fields.rentOrPrice);
  const sharing = clean(fields.sharing);
  switch (token) {
    case 'ownerName':
      return clean(fields.ownerName);
    case 'propertyName':
    case 'messName':
    case 'name':
      return name;
    case 'spaceType':
      return clean(fields.spaceType);
    case 'location':
      return clean(fields.location);
    case 'address':
      return clean(fields.address);
    case 'rent':
    case 'rentOrPrice':
      return rent;
    case 'sharing':
    case 'sharingNotes':
      return sharing;
    case 'amenities':
      return clean(fields.amenities);
    case 'foodIncluded':
      return clean(fields.foodIncluded);
    case 'genderPolicy':
      return clean(fields.genderPolicy);
    case 'description':
      return clean(fields.description);
    default:
      return null;
  }
}

/** Replace {{tokens}}; omit missing values and collapse leftover blank lines. */
export function renderCustomListingMarketingBody(
  body: string,
  fields: ListingMarketingMessageFields,
): string {
  const replaced = body.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g, (_full, token: string) => {
    return resolvePlaceholderValue(token, fields) ?? '';
  });
  return replaced
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function isBuiltinListingMarketingTemplateKey(
  key: string,
): key is BuiltinListingMarketingTemplateKey {
  return (BUILTIN_LISTING_MARKETING_TEMPLATE_KEYS as string[]).includes(key);
}

export function templatesForListing(
  kind: ListingMarketingKind,
  spaceType?: SpaceType | null,
  customTemplates: ListingMarketingTemplate[] = [],
): ListingMarketingTemplate[] {
  const customs = customTemplates.filter((template) => {
    if (template.active === false) return false;
    if (!template.kinds.includes(kind)) return false;
    return true;
  });
  // Prefer DB/default templates when present (editable). Fall back to client built-ins if none.
  if (customs.length > 0) {
    return customs;
  }

  return LISTING_MARKETING_TEMPLATES.filter((template) => {
    if (!template.kinds.includes(kind)) return false;
    if (!template.spaceTypes || template.spaceTypes.length === 0) return true;
    if (!spaceType) return template.key === 'general_property' || template.key === 'mess_promotion';
    return template.spaceTypes.includes(spaceType) || template.key === 'general_property';
  });
}

export function customTemplateToSelectable(template: {
  id: string;
  name: string;
  description?: string | null;
  body: string;
  applicability: ListingMarketingTemplateApplicability;
  active: boolean;
}): ListingMarketingTemplate {
  const kinds: ListingMarketingKind[] =
    template.applicability === 'BOTH'
      ? ['PROPERTY', 'MESS']
      : [template.applicability];
  return {
    key: `custom:${template.id}`,
    customId: template.id,
    name: template.name,
    description: template.description,
    body: template.body,
    kinds,
    builtin: false,
    active: template.active,
  };
}

export function buildListingMarketingMessage(
  templateKey: ListingMarketingTemplateKey,
  fields: ListingMarketingMessageFields,
  customBody?: string | null,
): string {
  if (customBody != null) {
    return renderCustomListingMarketingBody(customBody, fields);
  }
  if (!isBuiltinListingMarketingTemplateKey(templateKey)) {
    return renderCustomListingMarketingBody('', fields);
  }

  const name = clean(fields.name);
  const spaceType = clean(fields.spaceType);
  const ownerName = clean(fields.ownerName);
  const location = clean(fields.location);
  const rentOrPrice = clean(fields.rentOrPrice);
  const address = clean(fields.address);
  const publicListingUrl = clean(fields.publicListingUrl);

  const lines: string[] = [];
  const greeting = ownerName ? `Hi ${ownerName},` : 'Hi,';
  lines.push(greeting);
  lines.push('');

  switch (templateKey) {
    case 'mess_promotion':
      lines.push(
        name
          ? `We'd like to promote ${name} on ACOMI to nearby residents looking for mess meals.`
          : `We'd like to promote your mess on ACOMI to nearby residents looking for mess meals.`,
      );
      break;
    case 'pg_promotion':
      lines.push(
        name
          ? `We'd like to promote ${name} (PG) on ACOMI to people searching for paying guest stays.`
          : `We'd like to promote your PG on ACOMI to people searching for paying guest stays.`,
      );
      break;
    case 'coliving_promotion':
      lines.push(
        name
          ? `We'd like to promote ${name} as a co-living stay on ACOMI.`
          : `We'd like to promote your co-living stay on ACOMI.`,
      );
      break;
    case 'hostel_promotion':
      lines.push(
        name
          ? `We'd like to promote ${name} (Hostel) on ACOMI.`
          : `We'd like to promote your hostel on ACOMI.`,
      );
      break;
    case 'rental_promotion':
      lines.push(
        name
          ? `We'd like to promote ${name} as a rental listing on ACOMI.`
          : `We'd like to promote your rental listing on ACOMI.`,
      );
      break;
    case 'corporate_stay_promotion':
      lines.push(
        name
          ? `We'd like to promote ${name} for corporate stay enquiries on ACOMI.`
          : `We'd like to promote your property for corporate stay enquiries on ACOMI.`,
      );
      break;
    case 'general_property':
    default:
      lines.push(
        name
          ? `We'd like to promote ${name} on ACOMI.`
          : `We'd like to promote your property on ACOMI.`,
      );
      break;
  }

  if (spaceType) lines.push(`Type: ${spaceType}`);
  if (location) lines.push(`Location: ${location}`);
  if (address && address !== location) lines.push(`Address: ${address}`);
  if (rentOrPrice) lines.push(`Price: ${rentOrPrice}`);
  if (publicListingUrl) {
    lines.push('');
    lines.push(`Listing: ${publicListingUrl}`);
  }

  lines.push('');
  lines.push('Please share any updated photos, videos, or details you would like us to use.');
  return lines.join('\n');
}

export function buildMessageForTemplate(
  template: ListingMarketingTemplate,
  fields: ListingMarketingMessageFields,
): string {
  if (!template.builtin && template.body) {
    return renderCustomListingMarketingBody(template.body, fields);
  }
  return buildListingMarketingMessage(template.key, fields);
}
