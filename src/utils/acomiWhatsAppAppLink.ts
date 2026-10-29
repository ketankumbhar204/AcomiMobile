/** Play Store listing. The open page uses this when the app is not installed. */
export const ACOMI_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.acomi&hl=en_IN';

/**
 * Tappable link for every WhatsApp message we compose.
 * https://www.acomi.in/open.html opens the installed Android app, or the Play Store.
 */
export const ACOMI_APP_OPEN_URL = 'https://www.acomi.in/open.html';

export const ACOMI_APP_LINK_LINE = `You can check in the ACOMI app: ${ACOMI_APP_OPEN_URL}`;

/** Appends the ACOMI app link once. Replaces an older Play Store listing in the same message. */
export function withAcomiAppLink(message: string): string {
  let text = message.trim();
  if (!text) {
    return text;
  }
  if (text.includes(ACOMI_PLAY_STORE_URL)) {
    text = text.split(ACOMI_PLAY_STORE_URL).join(ACOMI_APP_OPEN_URL);
  }
  if (text.includes(ACOMI_APP_OPEN_URL)) {
    return text;
  }
  return `${text}\n\n${ACOMI_APP_LINK_LINE}`;
}
