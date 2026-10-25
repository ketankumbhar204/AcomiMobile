import { Clipboard } from 'react-native';

/**
 * Copies text with the clipboard API shipped by React Native.
 * Callers must not log or persist the value.
 */
export function copyTextToClipboard(value: string): void {
  if (typeof Clipboard?.setString !== 'function') {
    throw new Error('Clipboard unavailable');
  }
  Clipboard.setString(value);
}
