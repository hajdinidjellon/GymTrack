import { describe, expect, it } from '@jest/globals';
import {
  displayRecoveryCode,
  normalizeRecoveryCode,
  RECOVERY_PROMPT_AFTER,
  shouldSuggestRecoveryEmail,
} from '@/domain/recovery';

describe('normalizeRecoveryCode', () => {
  it.each([
    ['OKL-7K2M-9QXR-4HTZ', '7K2M9QXR4HTZ'],
    ['okl 7k2m 9qxr 4htz', '7K2M9QXR4HTZ'],
    ['7K2M9QXR4HTZ', '7K2M9QXR4HTZ'],
    // O, I and L typed for 0 and 1
    ['OKL-OK2M-9QXR-4HTL', '0K2M9QXR4HT1'],
    ['OKL-IK2M-9QXR-4HTZ', '1K2M9QXR4HTZ'],
  ])('%s → %s', (typed, expected) => {
    expect(normalizeRecoveryCode(typed)).toBe(expected);
  });

  it.each(['', 'OKL-7K2M-9QXR', 'OKL-7K2M-9QXR-4HTZ-1', 'OKL-7K2M-9QXR-4HTU', 'not a code'])('refuses %j', (typed) => {
    expect(normalizeRecoveryCode(typed)).toBeNull();
  });
});

describe('displayRecoveryCode', () => {
  it('groups the code for reading', () => {
    expect(displayRecoveryCode('OKL-7K2M-9QXR-4HTZ')).toEqual(['OKL', '7K2M', '9QXR', '4HTZ']);
  });
});

describe('shouldSuggestRecoveryEmail', () => {
  const base = { signedIn: true, hasEmail: false, sessions: RECOVERY_PROMPT_AFTER, dismissed: false };

  it('asks a signed-in account without email, from the 5th session', () => {
    expect(RECOVERY_PROMPT_AFTER).toBe(5);
    expect(shouldSuggestRecoveryEmail(base)).toBe(true);
    expect(shouldSuggestRecoveryEmail({ ...base, sessions: 4 })).toBe(false);
  });

  it.each([{ signedIn: false }, { hasEmail: true }, { dismissed: true }])('never asks when %j', (change) => {
    expect(shouldSuggestRecoveryEmail({ ...base, ...change })).toBe(false);
  });
});
