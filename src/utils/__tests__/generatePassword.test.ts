import fs from 'fs';
import path from 'path';
import { validatePassword } from '../passwordRules';
import {
  GENERATED_PASSWORD_LENGTH,
  canCopyPassword,
  generateStrongPassword,
  type RandomInt,
} from '../generatePassword';

const SOURCE = fs.readFileSync(path.join(__dirname, '../generatePassword.ts'), 'utf8');
const SCREEN = fs.readFileSync(
  path.join(__dirname, '../../screens/admin/AdminRegisteredUserDetailScreen.tsx'),
  'utf8',
);

function sequence(values: number[]): RandomInt {
  let index = 0;
  return (exclusiveMax: number) => {
    const value = values[index] ?? 0;
    index += 1;
    return value % exclusiveMax;
  };
}

describe('generateStrongPassword', () => {
  it('builds a policy-valid password from secure randomness', () => {
    const passwords = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      const password = generateStrongPassword();
      passwords.add(password);
      expect(password).toHaveLength(GENERATED_PASSWORD_LENGTH);
      expect(validatePassword(password)).toBeNull();
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[2-9]/);
      expect(password).toMatch(/[!@#$%&*\-_=+]/);
      expect(canCopyPassword(password)).toBe(true);
    }
    expect(passwords.size).toBeGreaterThan(1);
  });

  it('is deterministic for an injected generator and does not use weak sources', () => {
    const random = sequence([3, 5, 2, 1, 4, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const first = generateStrongPassword(random);
    const second = generateStrongPassword(
      sequence([3, 5, 2, 1, 4, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    );
    expect(first).toBe(second);
    expect(SOURCE).not.toContain('Math.random');
    expect(SOURCE).not.toContain('Date.now');
    expect(SOURCE).not.toContain('fullName');
  });

  it('still generates when web crypto is missing', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: undefined,
    });
    try {
      const password = generateStrongPassword();
      expect(password).toHaveLength(GENERATED_PASSWORD_LENGTH);
      expect(validatePassword(password)).toBeNull();
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, 'crypto', descriptor);
      }
    }
  });

  it('refuses to copy an empty or invalid password', () => {
    expect(canCopyPassword('')).toBe(false);
    expect(canCopyPassword('short')).toBe(false);
    expect(canCopyPassword('a'.repeat(73))).toBe(false);
    expect(canCopyPassword('12345678')).toBe(true);
  });

  it('keeps reset as one primary action and does not persist the password', () => {
    expect(SCREEN).toContain('generateStrongPassword');
    expect(SCREEN).toContain('auth.register.passwordTooShort');
    expect(SCREEN).toContain("defaultValue: 'Autogenerate'");
    expect(SCREEN).toContain("defaultValue: 'Copy'");
    expect(SCREEN).toContain('copyTextToClipboard');
    expect(SCREEN).toContain("defaultValue: 'Reset password'");
    expect(SCREEN).not.toContain('styles.resetButton');
    expect(SCREEN).not.toContain('AsyncStorage');
    expect(SCREEN).not.toContain('console.log');
    const copyIndex = SCREEN.indexOf('function handleCopy');
    const resetIndex = SCREEN.indexOf('function submitReset');
    expect(copyIndex).toBeGreaterThan(-1);
    expect(SCREEN.slice(copyIndex, resetIndex)).not.toContain('resetRegisteredUserPassword');
  });
});
