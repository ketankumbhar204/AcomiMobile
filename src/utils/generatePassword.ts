import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, validatePassword } from './passwordRules';
import { randomUint32 } from './secureRandom';

/** Length stays inside the backend policy of 8–72 characters. */
export const GENERATED_PASSWORD_LENGTH = 16;

const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*-_=+';
const ALL = `${LOWER}${UPPER}${DIGITS}${SYMBOLS}`;

export type RandomInt = (exclusiveMax: number) => number;

function cryptoRandomInt(exclusiveMax: number): number {
  if (!Number.isInteger(exclusiveMax) || exclusiveMax <= 0) {
    throw new Error('Invalid random range');
  }
  const range = 0x1_0000_0000;
  const limit = range - (range % exclusiveMax);
  let value = 0;
  do {
    value = randomUint32();
  } while (value >= limit);
  return value % exclusiveMax;
}

function pick(alphabet: string, randomInt: RandomInt): string {
  return alphabet.charAt(randomInt(alphabet.length));
}

/**
 * Cryptographically random password that satisfies the existing 8–72 character policy.
 * Does not use timestamps, account names, or hardcoded secrets.
 */
export function generateStrongPassword(randomInt: RandomInt = cryptoRandomInt): string {
  if (
    GENERATED_PASSWORD_LENGTH < PASSWORD_MIN_LENGTH ||
    GENERATED_PASSWORD_LENGTH > PASSWORD_MAX_LENGTH
  ) {
    throw new Error('Generated password length is outside policy');
  }
  const chars = [
    pick(LOWER, randomInt),
    pick(UPPER, randomInt),
    pick(DIGITS, randomInt),
    pick(SYMBOLS, randomInt),
  ];
  while (chars.length < GENERATED_PASSWORD_LENGTH) {
    chars.push(pick(ALL, randomInt));
  }
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    const current = chars[i];
    chars[i] = chars[j] ?? '';
    chars[j] = current ?? '';
  }
  const password = chars.join('');
  if (validatePassword(password) !== null) {
    throw new Error('Generated password failed policy');
  }
  return password;
}

export function canCopyPassword(password: string): boolean {
  return validatePassword(password) === null;
}
