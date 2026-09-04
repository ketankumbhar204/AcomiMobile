import en from './locales/en.json';
import hi from './locales/hi.json';
import kn from './locales/kn.json';
import mr from './locales/mr.json';
import ta from './locales/ta.json';
import te from './locales/te.json';

type TranslationTree = Record<string, unknown>;

const locales: Record<string, TranslationTree> = {
  en,
  hi,
  kn,
  mr,
  ta,
  te,
};

function leafKeys(value: unknown, prefix = ''): string[] {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as TranslationTree).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function interpolationTokens(value: unknown): string[] {
  if (typeof value !== 'string') {
    return [];
  }
  return [...value.matchAll(/\{\{([^}]+)\}\}/g)]
    .map(match => match[1])
    .sort();
}

function valueAtPath(tree: TranslationTree, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    return (current as TranslationTree)[segment];
  }, tree);
}

describe('Lifecycle localization matrix', () => {
  const namespaces = [
    'progressiveWorkflow',
    'coachmarks',
    'dashboard.health',
    'admin',
  ] as const;

  it.each(namespaces)(
    'has the complete %s key tree in every supported locale',
    namespace => {
      const source = valueAtPath(en, namespace);
      const expectedKeys = leafKeys(source).sort();

      for (const [locale, translations] of Object.entries(locales)) {
        const actual = valueAtPath(translations, namespace);
        expect({ locale, namespace, keys: leafKeys(actual).sort() }).toEqual({
          locale,
          namespace,
          keys: expectedKeys,
        });
      }
    },
  );

  it.each(namespaces)(
    'preserves %s interpolation placeholders in every locale',
    namespace => {
      const source = valueAtPath(en, namespace);
      const paths = leafKeys(source);

      for (const [locale, translations] of Object.entries(locales)) {
        for (const relativePath of paths) {
          const sourceValue = valueAtPath(en, `${namespace}.${relativePath}`);
          const translatedValue = valueAtPath(
            translations,
            `${namespace}.${relativePath}`,
          );
          expect({
            locale,
            key: `${namespace}.${relativePath}`,
            tokens: interpolationTokens(translatedValue),
          }).toEqual({
            locale,
            key: `${namespace}.${relativePath}`,
            tokens: interpolationTokens(sourceValue),
          });
        }
      }
    },
  );
});

describe('Primary locale catalog coverage (en / hi / mr)', () => {
  const enKeys = leafKeys(en).sort();

  it('Hindi contains every English leaf key', () => {
    const hiKeys = new Set(leafKeys(hi));
    const missing = enKeys.filter(key => !hiKeys.has(key));
    expect(missing).toEqual([]);
  });

  it('Marathi contains every English leaf key', () => {
    const mrKeys = new Set(leafKeys(mr));
    const missing = enKeys.filter(key => !mrKeys.has(key));
    expect(missing).toEqual([]);
  });

  it('Hindi and Marathi preserve English interpolation tokens for every key', () => {
    for (const key of enKeys) {
      const sourceValue = valueAtPath(en, key);
      if (typeof sourceValue !== 'string') {
        continue;
      }
      const hiValue = valueAtPath(hi, key);
      const mrValue = valueAtPath(mr, key);
      expect({ key, locale: 'hi', tokens: interpolationTokens(hiValue) }).toEqual({
        key,
        locale: 'hi',
        tokens: interpolationTokens(sourceValue),
      });
      expect({ key, locale: 'mr', tokens: interpolationTokens(mrValue) }).toEqual({
        key,
        locale: 'mr',
        tokens: interpolationTokens(sourceValue),
      });
    }
  });

  it('high-visibility Dashboard / Profile keys have natural Hindi (not English placeholders)', () => {
    const required = [
      'dashboard.owner.greetingMorning',
      'dashboard.owner.heroSubtitle',
      'dashboard.health.title',
      'dashboard.financial.title',
      'dashboard.accommodationOperations.title',
      'dashboard.operations.title',
      'dashboard.operations.planMenuCta',
      'meals.mealType.breakfast',
      'meals.dates.today',
      'settings.profile.editProfile',
      'settings.profile.documentsSection',
      'settings.profile.personalSection',
      'accommodation.home.title',
      'accommodation.home.eyebrow',
      'accommodation.home.quickActions',
      'accommodation.home.quickSetup',
      'accommodation.home.buildingsTitle',
      'accommodation.search.placeholder',
    ] as const;

    for (const key of required) {
      const enValue = valueAtPath(en, key);
      const hiValue = valueAtPath(hi, key);
      expect(typeof hiValue).toBe('string');
      expect(hiValue).not.toBe(enValue);
      // Devanagari range — natural Hindi, not leftover English.
      expect(String(hiValue)).toMatch(/[\u0900-\u097F]/);
    }
  });
});
