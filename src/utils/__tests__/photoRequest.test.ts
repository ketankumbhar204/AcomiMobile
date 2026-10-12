import {
  buildPhotoRequestMessage,
  hasActualListingPhotos,
  photoRequestActionLabel,
  whatsAppChatUrl,
  whatsAppPhoneDigits,
} from '../photoRequest';

const real = 'https://cdn.acomi.app/listings/room.jpg';
const representative = '/images/representative/co-living-1.png';
const stock = 'https://images.unsplash.com/photo-1';

describe('photo request', () => {
  it('labels from actual uploaded photos only', () => {
    expect(hasActualListingPhotos([])).toBe(false);
    expect(hasActualListingPhotos(null)).toBe(false);
    expect(hasActualListingPhotos([null, '', '   ', 'not a url'])).toBe(false);
    expect(hasActualListingPhotos([representative, stock, 'representative:pg'])).toBe(false);
    expect(photoRequestActionLabel(false)).toBe('Request photos on WhatsApp');
    expect(hasActualListingPhotos([real])).toBe(true);
    expect(hasActualListingPhotos([representative, real])).toBe(true);
    expect(photoRequestActionLabel(true)).toBe('Request more photos on WhatsApp');
  });

  it('builds property and mess messages without empty placeholders', () => {
    const propertyEmpty = buildPhotoRequestMessage({
      kind: 'property',
      hasPhotos: false,
      name: 'Stanza Living Positano House',
      spaceType: 'CO_LIVING',
      location: 'Hinjawadi',
    });
    expect(propertyEmpty).toContain('looking for a Co-living in Hinjawadi');
    expect(propertyEmpty).toContain('actual photos of Stanza Living Positano House');
    expect(propertyEmpty).toContain('room, bathroom and common areas');
    expect(propertyEmpty).not.toMatch(/null|undefined/);

    const propertyPhotos = buildPhotoRequestMessage({
      kind: 'property',
      hasPhotos: true,
      name: 'Stanza Living Positano House',
      spaceType: 'PG',
      location: 'Hinjawadi',
    });
    expect(propertyPhotos).toContain('interested in Stanza Living Positano House');
    expect(propertyPhotos).toContain('some more photos');
    expect(propertyPhotos).not.toContain('looking for a');

    expect(
      buildPhotoRequestMessage({
        kind: 'property',
        hasPhotos: false,
        name: 'Green PG',
        spaceType: 'PG',
        location: '  ',
      }),
    ).toContain('looking for a PG.');

    const messEmpty = buildPhotoRequestMessage({
      kind: 'mess',
      hasPhotos: false,
      name: 'Annapurna Mess',
    });
    expect(messEmpty).toContain('mess service, Annapurna Mess');
    expect(messEmpty).toContain('meals, food portions and menu');
    expect(messEmpty).not.toContain('bathroom');

    expect(
      buildPhotoRequestMessage({ kind: 'mess', hasPhotos: true, name: 'Annapurna Mess' }),
    ).toContain('more photos of your meals');
  });

  it('encodes an edited message and rejects missing numbers', () => {
    const edited = 'Hi, please send the kitchen photo.';
    const url = whatsAppChatUrl('9876543210', edited);
    expect(url).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
    expect(decodeURIComponent(url!.split('?text=')[1])).toBe(edited);

    const punctuated = whatsAppChatUrl('+91 98765 43210', 'Line one.\nRoom, bath & hall?');
    expect(punctuated).toContain('919876543210');
    expect(decodeURIComponent(punctuated!.split('?text=')[1])).toBe('Line one.\nRoom, bath & hall?');

    expect(whatsAppPhoneDigits('+1 415 555 2671')).toBe('14155552671');
    expect(whatsAppPhoneDigits('00919876543210')).toBe('919876543210');
    expect(whatsAppPhoneDigits('09876543210')).toBe('919876543210');
    expect(whatsAppChatUrl('', 'Hello')).toBeNull();
    expect(whatsAppChatUrl('123', 'Hello')).toBeNull();
    expect(whatsAppChatUrl(null, 'Hello')).toBeNull();
  });
});
