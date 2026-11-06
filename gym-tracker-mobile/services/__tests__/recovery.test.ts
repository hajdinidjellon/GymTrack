import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  createRecoveryCode,
  getContactEmail,
  requestResetEmail,
  resetWithCode,
  resetWithEmailLink,
  updateContactEmail,
} from '@/services/recovery';
import { isSupabaseConfigured, supabase } from '@/services/supabase';

jest.mock('@/services/supabase', () => ({
  isSupabaseConfigured: jest.fn(() => true),
  supabase: {
    functions: { invoke: jest.fn() },
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      updateUser: jest.fn(),
      verifyOtp: jest.fn(),
    },
  },
}));

const invoke = jest.mocked(supabase.functions.invoke);
const auth = jest.mocked(supabase.auth);
const configured = jest.mocked(isSupabaseConfigured);
const answer = (data: unknown, error: unknown = null) => invoke.mockResolvedValue({ data, error } as never);
const session = (user: unknown) =>
  auth.getSession.mockResolvedValue({ data: { session: user ? { user } : null } } as never);

beforeEach(() => {
  jest.clearAllMocks();
  configured.mockReturnValue(true);
});

describe('recovery code', () => {
  it('returns the new code to show once', async () => {
    answer({ ok: true, code: 'OKL-7K2M-9QXR-4HTZ' });
    expect(await createRecoveryCode('secret1')).toEqual({ ok: true, code: 'OKL-7K2M-9QXR-4HTZ' });
    expect(invoke).toHaveBeenCalledWith('recovery-code', { body: { password: 'secret1' } });
  });

  it('says why it failed: wrong password, too many tries, anything else', async () => {
    answer({ ok: false, reason: 'password' });
    expect(await createRecoveryCode('x')).toEqual({ ok: false, reason: 'password' });
    answer({ ok: false, reason: 'limit' });
    expect(await createRecoveryCode('x')).toEqual({ ok: false, reason: 'limit' });
    answer(null, new Error('offline'));
    expect(await createRecoveryCode('x')).toEqual({ ok: false, reason: 'other' });
    answer({ weird: true });
    expect(await createRecoveryCode('x')).toEqual({ ok: false, reason: 'other' });
  });

  it('does nothing without Supabase', async () => {
    configured.mockReturnValue(false);
    expect(await createRecoveryCode('x')).toEqual({ ok: false, reason: 'other' });
    expect(await resetWithEmailLink('t', 'x')).toBe(false);
    expect(await getContactEmail()).toBeNull();
    expect(await updateContactEmail('a@b.co', 'x')).toBe('other');
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe('forgotten password', () => {
  it('asks for an email link and only reports a network failure', async () => {
    answer({ ok: true });
    expect(await requestResetEmail('poseidon', 'fr')).toBe(true);
    expect(invoke).toHaveBeenCalledWith('password-reset', {
      body: { action: 'email', username: 'poseidon', locale: 'fr' },
    });
    answer(null, new Error('offline'));
    expect(await requestResetEmail('poseidon', 'fr')).toBe(false);
  });

  it('resets with the code and gets a new one', async () => {
    answer({ ok: true, code: 'OKL-AAAA-BBBB-CCCC' });
    expect(await resetWithCode('poseidon', 'OKL-7K2M-9QXR-4HTZ', 'newpass')).toEqual({
      ok: true,
      code: 'OKL-AAAA-BBBB-CCCC',
    });
  });

  it('gives one answer for a wrong code or an unknown account', async () => {
    answer({ ok: false });
    expect(await resetWithCode('nobody', 'OKL-7K2M-9QXR-4HTZ', 'newpass')).toEqual({ ok: false, reason: 'other' });
    answer({ ok: false, reason: 'password' });
    expect(await resetWithCode('nobody', 'OKL-7K2M-9QXR-4HTZ', 'newpass')).toEqual({ ok: false, reason: 'other' });
  });

  it('sets the new password from the email link', async () => {
    auth.verifyOtp.mockResolvedValue({ error: null } as never);
    auth.updateUser.mockResolvedValue({ error: null } as never);
    expect(await resetWithEmailLink('hash', 'newpass')).toBe(true);
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'hash', type: 'recovery' });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'newpass' });
  });

  it('refuses a used or expired link', async () => {
    auth.verifyOtp.mockResolvedValue({ error: { message: 'expired' } } as never);
    expect(await resetWithEmailLink('hash', 'newpass')).toBe(false);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
});

describe('contact email', () => {
  it('reads it from the session', async () => {
    session({ email: 'poseidon@users.gymtrack.app', user_metadata: { contact_email: 'me@mail.com' } });
    expect(await getContactEmail()).toBe('me@mail.com');
    session({ email: 'poseidon@users.gymtrack.app', user_metadata: { contact_email: null } });
    expect(await getContactEmail()).toBeNull();
  });

  it('changes it only with the right password', async () => {
    session({ email: 'poseidon@users.gymtrack.app', user_metadata: {} });
    auth.signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login' } } as never);
    expect(await updateContactEmail('me@mail.com', 'wrong')).toBe('password');
    expect(auth.updateUser).not.toHaveBeenCalled();

    auth.signInWithPassword.mockResolvedValue({ error: null } as never);
    auth.updateUser.mockResolvedValue({ error: null } as never);
    expect(await updateContactEmail('me@mail.com', 'right')).toBe('ok');
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'poseidon@users.gymtrack.app', password: 'right' });
    expect(auth.updateUser).toHaveBeenCalledWith({ data: { contact_email: 'me@mail.com' } });
  });

  it('needs a session', async () => {
    session(null);
    expect(await updateContactEmail('me@mail.com', 'x')).toBe('other');
  });
});
