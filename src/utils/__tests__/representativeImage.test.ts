import {
  getRepresentativeImage,
  isVerifiedListingImageUrl,
  normalizeRepresentativeCategory,
  resolveListingCover,
  stableHash,
} from '../representativeImage';

describe('representativeImage', () => {
  it('does not use Math.random', () => {
    expect(String(stableHash)).not.toMatch(/Math\.random\s*\(/);
    expect(String(resolveListingCover)).not.toMatch(/Math\.random\s*\(/);
  });

  it('maps existing space types to categories', () => {
    expect(normalizeRepresentativeCategory('PG')).toBe('PG');
    expect(normalizeRepresentativeCategory('HOSTEL')).toBe('HOSTEL');
    expect(normalizeRepresentativeCategory('CO_LIVING')).toBe('CO_LIVING');
    expect(normalizeRepresentativeCategory('RENTAL')).toBe('RENTAL');
    expect(normalizeRepresentativeCategory('SERVICED')).toBe('SERVICED');
    expect(normalizeRepresentativeCategory('CORPORATE_APARTMENT')).toBe('SERVICED');
    expect(normalizeRepresentativeCategory('MESS')).toBe('MESS');
    expect(normalizeRepresentativeCategory('TIFFIN')).toBe('MESS');
    expect(normalizeRepresentativeCategory('UNKNOWN')).toBe('GENERIC');
  });

  it.each([
    ['PG', 'pg-'],
    ['HOSTEL', 'hostel-'],
    ['CO_LIVING', 'coliving-'],
    ['RENTAL', 'rental-'],
    ['SERVICED', 'serviced-'],
    ['CORPORATE', 'serviced-'],
    ['MESS', 'mess-'],
    ['WAREHOUSE', 'generic-'],
  ] as const)('%s listings use %s images', (type, prefix) => {
    const cover = getRepresentativeImage(type, 'listing-12345');
    expect(cover.kind).toBe('representative');
    expect(cover.imageKey.startsWith(prefix)).toBe(true);
  });

  it('returns the same image for the same listing id', () => {
    const first = resolveListingCover({ listingId: 'space-aaa', spaceType: 'PG' });
    const again = resolveListingCover({ listingId: 'space-aaa', spaceType: 'PG' });
    expect(first).toEqual(again);
    expect(stableHash('space-aaa')).toBe(stableHash('space-aaa'));
  });

  it('can assign different images to different listing ids', () => {
    const keys = new Set(
      ['id-1', 'id-2', 'id-3', 'id-4', 'id-5', 'id-6', 'id-7', 'id-8'].map(
        (id) => resolveListingCover({ listingId: id, spaceType: 'PG' }).imageKey,
      ),
    );
    expect(keys.size).toBeGreaterThan(1);
  });

  it('lets a verified listing photo take priority', () => {
    const cover = resolveListingCover({
      listingId: 'space-aaa',
      spaceType: 'PG',
      listingImageUrl: 'https://cdn.example.com/spaces/verified.jpg',
    });
    expect(cover.kind).toBe('listing');
    expect(cover.source).toEqual({ uri: 'https://cdn.example.com/spaces/verified.jpg' });
  });

  it('shows the representative label only for representative covers', () => {
    expect(
      resolveListingCover({ listingId: 'space-aaa', spaceType: 'PG' }).kind,
    ).toBe('representative');
    expect(
      resolveListingCover({
        listingId: 'space-aaa',
        spaceType: 'PG',
        listingImageUrl: 'https://cdn.example.com/spaces/verified.jpg',
      }).kind,
    ).toBe('listing');
  });

  it('does not treat Unsplash or pack URLs as verified photos', () => {
    expect(isVerifiedListingImageUrl('https://images.unsplash.com/photo-1555854877')).toBe(false);
    expect(isVerifiedListingImageUrl('/images/representative/pg-1.png')).toBe(false);
    expect(
      resolveListingCover({
        listingId: 'space-aaa',
        spaceType: 'PG',
        listingImageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5',
      }).kind,
    ).toBe('representative');
  });
});
