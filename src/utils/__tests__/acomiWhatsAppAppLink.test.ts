import {
  ACOMI_APP_OPEN_URL,
  ACOMI_PLAY_STORE_URL,
  withAcomiAppLink,
} from '../acomiWhatsAppAppLink';

describe('withAcomiAppLink', () => {
  it('adds the open link once', () => {
    const message = withAcomiAppLink('Hello');
    expect(message).toBe(`Hello\n\nYou can check in the ACOMI app: ${ACOMI_APP_OPEN_URL}`);
    expect(withAcomiAppLink(message)).toBe(message);
  });

  it('replaces an older Play Store listing', () => {
    expect(withAcomiAppLink(`See ${ACOMI_PLAY_STORE_URL}`)).toBe(`See ${ACOMI_APP_OPEN_URL}`);
  });
});
