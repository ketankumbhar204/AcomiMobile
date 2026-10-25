import {
  buildPhotoRequestMessage,
  confirmPhotoRequest,
  hasActualListingPhotos,
  isPhotoRequestNotification,
  photoRequestActionLabel,
  photoRequestTitle,
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
      name: 'Sri Sai Venkateshwara PG',
      spaceType: 'PG',
      location: 'Hinjawadi',
    });
    expect(propertyEmpty).toBe(
      "Hi, I'm interested in Sri Sai Venkateshwara PG. Could you please share some recent photos of the property and available rooms? Thank you.",
    );
    expect(photoRequestTitle('property', false)).toBe('Request property photos');
    expect(propertyEmpty).not.toMatch(/null|undefined/);

    const propertyPhotos = buildPhotoRequestMessage({
      kind: 'property',
      hasPhotos: true,
      name: 'Sri Sai Venkateshwara PG',
      spaceType: 'PG',
      location: 'Hinjawadi',
    });
    expect(propertyPhotos).toContain('interested in Sri Sai Venkateshwara PG');
    expect(propertyPhotos).toContain('more recent photos of the property');
    expect(photoRequestTitle('property', true)).toBe('Request more property photos');

    expect(
      buildPhotoRequestMessage({
        kind: 'property',
        hasPhotos: false,
        name: '   ',
        spaceType: 'PG',
      }),
    ).toContain('interested in this property');

    const messEmpty = buildPhotoRequestMessage({
      kind: 'mess',
      hasPhotos: false,
      name: 'Annapurna Mess',
    });
    expect(messEmpty).toBe(
      "Hi, I'm interested in Annapurna Mess. Could you please share some recent photos of the menu, food, and service? Thank you.",
    );
    expect(photoRequestTitle('mess', false)).toBe('Request mess photos');
    expect(messEmpty).not.toContain('bathroom');
    expect(messEmpty).not.toContain('available rooms');

    expect(
      buildPhotoRequestMessage({ kind: 'mess', hasPhotos: true, name: 'Annapurna Mess' }),
    ).toContain('more recent photos of the menu, food, and service');
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

  it('opens WhatsApp with the edited message after the notification is saved', async () => {
    const openUrl = jest.fn(async () => undefined);
    const request = jest.fn(async () => ({
      notificationPersisted: true,
      notificationDuplicate: false,
      fcmQueued: true,
      phoneAvailable: true,
      internationalPhone: '919876543210',
    }));
    const edited = 'Hi, please send the kitchen photo.\nThanks!';
    const result = await confirmPhotoRequest({ message: edited, request, openUrl });
    expect(result.whatsApp).toBe('opened');
    expect(request).toHaveBeenCalledTimes(1);
    expect(openUrl).toHaveBeenCalledWith(whatsAppChatUrl('919876543210', edited));
    expect(decodeURIComponent(String(openUrl.mock.calls[0][0]).split('?text=')[1])).toBe(edited);
  });

  it('does not open WhatsApp or notify when the message is empty', async () => {
    const openUrl = jest.fn();
    const request = jest.fn();
    const result = await confirmPhotoRequest({ message: '   ', request, openUrl });
    expect(result.whatsApp).toBe('unavailable');
    expect(request).not.toHaveBeenCalled();
    expect(openUrl).not.toHaveBeenCalled();
  });

  it('keeps a saved notification when WhatsApp cannot open', async () => {
    const result = await confirmPhotoRequest({
      message: 'Please share photos.',
      request: async () => ({
        notificationPersisted: true,
        notificationDuplicate: false,
        fcmQueued: false,
        phoneAvailable: true,
        internationalPhone: '919876543210',
      }),
      openUrl: async () => {
        throw new Error('no app');
      },
    });
    expect(result.whatsApp).toBe('failed');
    expect(result.notificationPersisted).toBe(true);
    expect(result.fcmQueued).toBe(false);
  });

  it('does not open WhatsApp when the listing has no number, but keeps the notification', async () => {
    const openUrl = jest.fn();
    const result = await confirmPhotoRequest({
      message: 'Please share photos.',
      request: async () => ({
        notificationPersisted: true,
        notificationDuplicate: false,
        fcmQueued: true,
        phoneAvailable: false,
        internationalPhone: null,
      }),
      openUrl,
    });
    expect(result.whatsApp).toBe('unavailable');
    expect(result.notificationPersisted).toBe(true);
    expect(openUrl).not.toHaveBeenCalled();
  });

  it('does not open WhatsApp when the photo request fails', async () => {
    const openUrl = jest.fn();
    await expect(
      confirmPhotoRequest({
        message: 'Please share photos.',
        request: async () => {
          throw new Error('down');
        },
        openUrl,
      }),
    ).rejects.toThrow('down');
    expect(openUrl).not.toHaveBeenCalled();
  });

  it('still opens WhatsApp when the notification is a duplicate and push is not queued', async () => {
    const openUrl = jest.fn(async () => undefined);
    const result = await confirmPhotoRequest({
      message: 'Please share photos.',
      request: async () => ({
        notificationPersisted: true,
        notificationDuplicate: true,
        fcmQueued: false,
        phoneAvailable: true,
        internationalPhone: '919876543210',
      }),
      openUrl,
    });
    expect(result.whatsApp).toBe('opened');
    expect(result.notificationDuplicate).toBe(true);
    expect(result.fcmQueued).toBe(false);
    expect(openUrl).toHaveBeenCalledTimes(1);
  });

  it('recognises a photo-request notification without treating it as a contact enquiry', () => {
    expect(isPhotoRequestNotification({ notificationType: 'PHOTO_REQUEST_RECEIVED' })).toBe(true);
    expect(isPhotoRequestNotification({ actionRoute: 'FindAPlaceDetail' })).toBe(true);
    expect(isPhotoRequestNotification({ notificationType: 'CONTACT_ENQUIRY_RECEIVED' })).toBe(false);
  });
});
