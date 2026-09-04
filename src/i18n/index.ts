import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

import en from './locales/en.json';
import hi from './locales/hi.json';
import kn from './locales/kn.json';
import mr from './locales/mr.json';
import ta from './locales/ta.json';
import te from './locales/te.json';

export const LANGUAGE_STORAGE_KEY = '@acomi/language';

export const SUPPORTED_LANGUAGES = [
  'en',
  'hi',
  'mr',
  'kn',
  'te',
  'ta',
] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
  kn: { translation: kn },
  te: { translation: te },
  ta: { translation: ta },
} as const;

function isSupportedLanguage(code: string): code is AppLanguage {
  return SUPPORTED_LANGUAGES.includes(code as AppLanguage);
}

export function detectDeviceLanguage(): AppLanguage {
  const locales = RNLocalize.getLocales();

  for (const locale of locales) {
    if (isSupportedLanguage(locale.languageCode)) {
      return locale.languageCode;
    }
  }

  return 'en';
}

export async function initI18n(): Promise<typeof i18n> {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  const language =
    stored && isSupportedLanguage(stored) ? stored : detectDeviceLanguage();

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: 'en',
      compatibilityJSON: 'v4',
      interpolation: {
        escapeValue: false,
      },
      returnNull: false,
      parseMissingKeyHandler: (key: string, defaultValue?: string) => {
        const fromEnglish = i18n.getResource('en', 'translation', key);
        if (typeof fromEnglish === 'string' && fromEnglish.length > 0) {
          return fromEnglish;
        }
        if (typeof defaultValue === 'string' && defaultValue.length > 0) {
          return defaultValue;
        }
        // Prefer a readable last segment over the full dotted key path.
        const leaf = key.includes('.') ? key.slice(key.lastIndexOf('.') + 1) : key;
        return leaf || key;
      },
      react: {
        useSuspense: false,
      },
    });
  } else {
    await i18n.changeLanguage(language);
  }

  return i18n;
}

export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export { i18n };
