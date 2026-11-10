// Deletes the signed-in user's account and everything in it: { password } in, { ok } out.
// The password is checked again: a phone left unlocked is not enough to delete the account.
// Sessions, profile, settings and recovery code go with the account (on delete cascade,
// schema.sql); the rate-limit rows keyed on it are removed too. Limit: 5 per account in 15 minutes.
//
// Deploy: supabase functions deploy delete-account   (needs the user's JWT)

import { adminClient, anonClient, clientIp, CORS, json, overLimit } from '../_shared/recovery.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false }, 405);

  const authorization = req.headers.get('Authorization') ?? '';
  const { data: auth } = await anonClient(authorization).auth.getUser();
  const user = auth.user;
  if (!user?.email) return json({ ok: false }, 401);

  const admin = adminClient();
  if (await overLimit(admin, { [`delete:${user.id}`]: 5, [`ip:${clientIp(req)}`]: 20 })) {
    return json({ ok: false, reason: 'limit' });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const password = typeof body.password === 'string' ? body.password : '';
  const { error } = await anonClient().auth.signInWithPassword({ email: user.email, password });
  if (error) return json({ ok: false, reason: 'password' });

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return json({ ok: false }, 500);
  await admin.from('recovery_attempts').delete().like('key', `%:${user.id}`);
  return json({ ok: true });
});
