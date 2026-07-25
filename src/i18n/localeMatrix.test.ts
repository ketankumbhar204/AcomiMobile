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
    return [prefix];
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
          const sourceValue = valueAtPath(
            en,
            `${namespace}.${relativePath}`,
          );
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
