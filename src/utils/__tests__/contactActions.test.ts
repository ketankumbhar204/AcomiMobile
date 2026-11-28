import { Linking, Platform } from 'react-native';
import {
  canOpenContactOptions,
  contactDisplayNumber,
  contactTelDigits,
  copyContactNumber,
  openContactDialer,
  openContactWhatsApp,
  whatsAppMeUrl,
} from '../contactActions';

jest.mock('../copyTextToClipboard', () => ({
  copyTextToClipboard: jest.fn(),
}));

describe('contactActions', () => {
  it('formats valid Indian mobiles for dialer', () => {
    expect(contactTelDigits('9876543210')).toBe('+919876543210');
    expect(contactTelDigits('+91 98765 43210')).toBe('+919876543210');
  });

  it('rejects empty or short values', () => {
    expect(contactTelDigits('')).toBeNull();
    expect(contactTelDigits('123')).toBeNull();
    expect(canOpenContactOptions('')).toBe(false);
    expect(canOpenContactOptions('9876543210')).toBe(true);
  });

  it('displays formatted contact numbers', () => {
    expect(contactDisplayNumber('9876543210')).toBe('+91 9876543210');
  });

  it('copies display form', () => {
    const { copyTextToClipboard } = require('../copyTextToClipboard');
    expect(copyContactNumber('9876543210')).toBe('copied');
    expect(copyTextToClipboard).toHaveBeenCalledWith('+91 9876543210');
  });

  it('builds a wa.me link without duplicating the India code', () => {
    expect(whatsAppMeUrl('+91 79664-68564')).toBe('https://wa.me/917966468564');
    expect(whatsAppMeUrl('+91 (79664) 68564')).toBe('https://wa.me/917966468564');
    expect(whatsAppMeUrl('917966468564')).toBe('https://wa.me/917966468564');
    expect(whatsAppMeUrl('07966468564')).toBe('https://wa.me/917966468564');
  });

  it('opens wa.me even when canOpenURL reports no handler', async () => {
    const previous = Platform.OS;
    Platform.OS = 'android';
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const canOpenURL = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    await expect(openContactWhatsApp('+91 79664 68564')).resolves.toBe('opened');
    expect(canOpenURL).not.toHaveBeenCalled();
    expect(openURL).toHaveBeenCalledWith(
      'intent://wa.me/917966468564#Intent;scheme=https;package=com.whatsapp;end',
    );
    Platform.OS = previous;
    openURL.mockRestore();
    canOpenURL.mockRestore();
  });

  it('prefills WhatsApp chat text when a message is provided', async () => {
    const previous = Platform.OS;
    Platform.OS = 'android';
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await expect(openContactWhatsApp('9876543210', 'Hello owner')).resolves.toBe('opened');
    expect(openURL).toHaveBeenCalledWith(
      'intent://wa.me/919876543210?text=Hello%20owner#Intent;scheme=https;package=com.whatsapp;end',
    );
    Platform.OS = previous;
    openURL.mockRestore();
  });

  it('tries WhatsApp Business and then the browser when Messenger is missing', async () => {
    const previous = Platform.OS;
    Platform.OS = 'android';
    const openURL = jest.spyOn(Linking, 'openURL').mockImplementation(async url => {
      const target = String(url);
      if (target.includes('package=com.whatsapp;')) {
        throw new Error('messenger missing');
      }
      if (target.includes('package=com.whatsapp.w4b')) {
        throw new Error('business missing');
      }
      if (target === 'https://wa.me/917966468564') {
        throw new Error('resolver missing');
      }
      if (target.includes('category=android.intent.category.BROWSABLE')) {
        return;
      }
      throw new Error(`unexpected ${target}`);
    });
    await expect(openContactWhatsApp('7966468564')).resolves.toBe('opened');
    expect(openURL).toHaveBeenCalledWith('https://wa.me/917966468564');
    expect(openURL).toHaveBeenCalledWith(
      'intent://wa.me/917966468564#Intent;scheme=https;package=com.whatsapp.w4b;end',
    );
    Platform.OS = previous;
    openURL.mockRestore();
  });

  it('reports unavailable only after WhatsApp and the browser both fail', async () => {
    const previous = Platform.OS;
    Platform.OS = 'android';
    const openURL = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no handler'));
    await expect(openContactWhatsApp('7966468564')).resolves.toBe('unavailable');
    expect(openURL).toHaveBeenCalledWith('https://wa.me/917966468564');
    Platform.OS = previous;
    openURL.mockRestore();
  });

  it('dials with tel: and does not consult canOpenURL', async () => {
    const previous = Platform.OS;
    Platform.OS = 'android';
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const canOpenURL = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    await expect(openContactDialer('+91 79664 68564')).resolves.toBe('opened');
    expect(canOpenURL).not.toHaveBeenCalled();
    expect(openURL).toHaveBeenCalledWith('tel:+917966468564');
    Platform.OS = previous;
    openURL.mockRestore();
    canOpenURL.mockRestore();
  });
});
