import { describe, expect, test } from '@jest/globals';
import { contactEmailError, loginEmail, normalizeUsername, passwordError, usernameError } from '@/domain/account';

describe('usernameError', () => {
  test.each([
    ['poseidon', null],
    ['  Poseidon_92 ', null],
    ['jo.b-x', null],
    ['ab', 'Ton pseudo doit faire au moins 3 caractères.'],
    ['a'.repeat(21), 'Ton pseudo doit faire 20 caractères maximum.'],
    ['élodie', 'Ton pseudo : lettres sans accent, chiffres, point, tiret ou _ seulement.'],
    ['jean claude', 'Ton pseudo : lettres sans accent, chiffres, point, tiret ou _ seulement.'],
  ])('%s → %s', (name, expected) => {
    expect(usernameError(name)).toBe(expected);
  });
});

test('normalizeUsername trims and lowercases', () => {
  expect(normalizeUsername('  PoseiDon ')).toBe('poseidon');
});

test('passwordError', () => {
  expect(passwordError('12345')).toBe('Ton mot de passe doit faire au moins 6 caractères.');
  expect(passwordError('123456')).toBeNull();
});

test.each([
  ['', null],
  ['  ', null],
  ['toi@exemple.com', null],
  ['toi@exemple', "Cet email n'a pas l'air valide."],
  ['pas un email', "Cet email n'a pas l'air valide."],
])('contactEmailError(%p) → %p', (email, expected) => {
  expect(contactEmailError(email)).toBe(expected);
});

test.each([
  ['Poseidon ', 'poseidon@users.gymtrack.app'],
  [' toi@exemple.com', 'toi@exemple.com'],
])('loginEmail(%p) → %p', (id, expected) => {
  expect(loginEmail(id)).toBe(expected);
});
