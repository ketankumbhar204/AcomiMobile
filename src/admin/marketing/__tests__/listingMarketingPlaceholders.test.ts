import {
  extractListingMarketingPlaceholders,
  insertListingMarketingPlaceholder,
  unsupportedListingMarketingPlaceholders,
} from '../listingMarketingPlaceholders';

describe('listingMarketingPlaceholders', () => {
  it('extracts unique placeholder tokens', () => {
    const tokens = extractListingMarketingPlaceholders(
      'Hi {{ownerName}}, welcome to {{ propertyName }} near {{location}}. {{ownerName}} again.',
    );
    expect(tokens).toEqual(expect.arrayContaining(['ownerName', 'propertyName', 'location']));
    expect(tokens).toHaveLength(3);
  });

  it('reports unsupported placeholders', () => {
    expect(
      unsupportedListingMarketingPlaceholders('Hello {{ownerName}} and {{unknownField}}'),
    ).toEqual(['unknownField']);
  });

  it('inserts a placeholder at the cursor', () => {
    expect(insertListingMarketingPlaceholder('Hello ', 'ownerName', 6)).toBe(
      'Hello {{ownerName}}',
    );
    expect(insertListingMarketingPlaceholder('AB', 'name', 1)).toBe('A{{name}}B');
  });
});
