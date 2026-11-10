/**
 * Creates (or rebuilds) the test accounts on the Supabase project of .env.local.
 *
 *   npm run seed:personas            the real thing
 *   SEED_DRY=1 npm run seed:personas  only builds and checks the histories, nothing sent
 *
 * Runs under Jest only to reuse its TypeScript and `@/` setup; it is not a test. The passwords
 * are made here and kept in test-accounts.local.md (git-ignored); a rerun reuses them.
 */
import { test } from '@jest/globals';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loginEmail } from '@/domain/account';
import { findGym } from '@/domain/gyms';
import { profileSchema } from '@/domain/schemas';
import { DEFAULT_SETTINGS, syncedSettings } from '@/domain/settings';
import type { AppSettings, UserProfile } from '@/types';
import { buildHistory } from './history';
import { PERSONAS, type Persona } from './personas';

const ROOT = join(__dirname, '..', '..');
const ACCOUNTS_FILE = join(ROOT, 'test-accounts.local.md');
const DRY = process.env.SEED_DRY === '1';

function env(): { url: string; key: string } {
  const text = readFileSync(join(ROOT, '.env.local'), 'utf8');
  const get = (name: string) => text.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim() ?? '';
  return { url: get('EXPO_PUBLIC_SUPABASE_URL'), key: get('EXPO_PUBLIC_SUPABASE_ANON_KEY') };
}

function knownPasswords(): Record<string, string> {
  if (!existsSync(ACCOUNTS_FILE)) return {};
  const rows = [...readFileSync(ACCOUNTS_FILE, 'utf8').matchAll(/^\| `([^`]+)` \| `([^`]+)` \|/gm)];
  return Object.fromEntries(rows.map((m) => [m[1]!, m[2]!]));
}

const newPassword = () => randomBytes(12).toString('base64url');

function setup(persona: Persona, now: Date): { profile: UserProfile; settings: AppSettings } {
  const gym = findGym(persona.gym);
  const settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...(gym
      ? {
          gymChain: gym.id,
          barWeight: gym.barWeight,
          plates: gym.plates,
          stackStep: gym.stackStep,
          cableStep: gym.cableStep,
        }
      : {}),
  };
  const { bodyWeight, ...rest } = persona.profile;
  const profile = profileSchema.parse({
    ...rest,
    prs: [],
    bodyStats: bodyWeight != null ? [{ date: now.toISOString(), weight: bodyWeight }] : [],
  });
  return { profile, settings };
}

async function call(url: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(url, init);
  const text = await res.text();
  const body: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${url.split('?')[0]} → ${res.status} ${text.slice(0, 200)}`);
  return body;
}

async function session(
  persona: Persona,
  password: string,
): Promise<{ token: string; userId: string; created: boolean }> {
  const { url, key } = env();
  const headers = { apikey: key, 'Content-Type': 'application/json' };
  const email = loginEmail(persona.username);
  const signup = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, data: { username: persona.username, contact_email: null } }),
  });
  const created = signup.ok;
  const auth = created
    ? ((await signup.json()) as { access_token: string; user: { id: string } })
    : ((await call(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
      })) as { access_token: string; user: { id: string } });
  return { token: auth.access_token, userId: auth.user.id, created };
}

async function upload(persona: Persona, password: string, now: Date): Promise<string> {
  const { url, key } = env();
  const { profile, settings } = setup(persona, now);
  const workouts = buildHistory(persona, profile, settings, now);
  if (DRY) {
    // The main lift of the first session, first time and last time: does it progress?
    const first = workouts.at(-1)?.exercises[0];
    const line = (w: (typeof workouts)[number] | undefined) =>
      w?.exercises
        .find((e) => e.name === first?.name)
        ?.sets.filter((x) => x.setType !== 'warmup')
        .map((x) => `${x.weight}×${x.reps}`)
        .join(' ');
    const last = workouts.find((w) => w.exercises.some((e) => e.name === first?.name));
    return `${workouts.length} séances (essai à blanc)${first ? ` · ${first.name} : ${line(workouts.at(-1))} → ${line(last)}` : ''}`;
  }

  const { token, userId, created } = await session(persona, password);
  const headers = {
    apikey: key,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  };
  const stamp = now.toISOString();
  // Rebuilt from scratch: what the account had before goes
  await call(`${url}/rest/v1/workouts?user_id=eq.${userId}`, { method: 'DELETE', headers });
  await call(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ user_id: userId, data: profile, updated_at: stamp }),
  });
  await call(`${url}/rest/v1/user_settings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ user_id: userId, data: syncedSettings(settings), updated_at: stamp }),
  });
  if (workouts.length) {
    await call(`${url}/rest/v1/workouts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(workouts.map((w) => ({ id: w.id, user_id: userId, data: w, updated_at: stamp }))),
    });
  }
  return `${created ? 'créé' : 'reconstruit'}, ${workouts.length} séances`;
}

function writeAccounts(passwords: Record<string, string>): void {
  const lines = [
    '# Comptes de test Okilo',
    '',
    'Fichier local, jamais commité. Recréer ou remettre à zéro : `npm run seed:personas`.',
    'Se connecter dans l’app avec le pseudo et le mot de passe.',
    '',
    '| Pseudo | Mot de passe | Qui c’est |',
    '|---|---|---|',
    ...PERSONAS.map((p) => `| \`${p.username}\` | \`${passwords[p.username]}\` | ${p.about} |`),
    '',
  ];
  writeFileSync(ACCOUNTS_FILE, lines.join('\n'));
}

test('seed the test accounts', async () => {
  const now = new Date();
  const passwords = knownPasswords();
  for (const p of PERSONAS) passwords[p.username] ??= newPassword();
  if (!DRY) writeAccounts(passwords);
  for (const persona of PERSONAS) {
    const result = await upload(persona, passwords[persona.username]!, now);
    process.stdout.write(`${persona.username}: ${result}\n`);
  }
}, 120_000);
