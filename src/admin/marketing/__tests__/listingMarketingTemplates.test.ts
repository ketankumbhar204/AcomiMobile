import {
  buildListingMarketingMessage,
  buildMessageForTemplate,
  customTemplateToSelectable,
  renderCustomListingMarketingBody,
  templatesForListing,
} from '../listingMarketingTemplates';

describe('listingMarketingTemplates', () => {
  it('returns property templates including type-specific ones', () => {
    const keys = templatesForListing('PROPERTY', 'PG').map(t => t.key);
    expect(keys).toContain('general_property');
    expect(keys).toContain('pg_promotion');
    expect(keys).not.toContain('mess_promotion');
  });

  it('returns only mess templates for mess listings', () => {
    const keys = templatesForListing('MESS', 'MESS').map(t => t.key);
    expect(keys).toEqual(['mess_promotion']);
  });

  it('prefers active DB templates over client built-ins when present', () => {
    const custom = customTemplateToSelectable({
      id: 'abc',
      name: 'Wakad promo',
      body: 'Hi {{ownerName}}',
      applicability: 'PROPERTY',
      active: true,
    });
    const inactive = customTemplateToSelectable({
      id: 'zzz',
      name: 'Off',
      body: 'x',
      applicability: 'PROPERTY',
      active: false,
    });
    const messOnly = customTemplateToSelectable({
      id: 'mess1',
      name: 'Mess custom',
      body: 'y',
      applicability: 'MESS',
      active: true,
    });
    const keys = templatesForListing('PROPERTY', 'PG', [custom, inactive, messOnly]).map(
      t => t.key,
    );
    expect(keys).toEqual(['custom:abc']);
    expect(keys).not.toContain('general_property');
    expect(keys).not.toContain('custom:zzz');
    expect(keys).not.toContain('custom:mess1');
  });

  it('renders custom bodies and omits missing placeholder values', () => {
    const rendered = renderCustomListingMarketingBody(
      'Hi {{ownerName}},\n\nPromote {{propertyName}}\n\n{{location}}',
      {
        ownerName: 'Ravi',
        name: 'Sunrise PG',
        location: null,
      },
    );
    expect(rendered).toContain('Hi Ravi,');
    expect(rendered).toContain('Sunrise PG');
    expect(rendered).not.toContain('{{');
    expect(rendered).not.toContain('null');
  });

  it('buildMessageForTemplate uses custom body for non-builtin templates', () => {
    const message = buildMessageForTemplate(
      {
        key: 'custom:1',
        builtin: false,
        body: 'Hello {{ownerName}} from {{name}}',
        kinds: ['PROPERTY'],
      },
      { ownerName: 'Ravi', name: 'Sunrise PG' },
    );
    expect(message).toBe('Hello Ravi from Sunrise PG');
  });

  it('builds editable message without inventing missing fields', () => {
    const message = buildListingMarketingMessage('pg_promotion', {
      name: 'Sunrise PG',
      spaceType: 'PG',
      ownerName: 'Ravi',
      location: 'Pune',
    });
    expect(message).toContain('Hi Ravi,');
    expect(message).toContain('Sunrise PG');
    expect(message).toContain('Type: PG');
    expect(message).toContain('Location: Pune');
    expect(message).not.toContain('undefined');
    expect(message).not.toContain('Listing:');
  });

  it('omits empty placeholders', () => {
    const message = buildListingMarketingMessage('general_property', {
      name: null,
      ownerName: '  ',
      publicListingUrl: undefined,
    });
    expect(message.startsWith('Hi,')).toBe(true);
    expect(message).not.toContain('null');
    expect(message).not.toContain('Listing:');
  });
});
