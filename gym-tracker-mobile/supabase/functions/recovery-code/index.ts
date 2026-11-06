// A new recovery code for the signed-in user: { password } in, { code } out, shown once by the app.
// The password is checked again: a phone left unlocked is not enough to take the account.
// Only the slow hash is stored; an older code stops working. Limit: 5 per account in 15 minutes.

import {
  adminClient,
  anonClient,
  clientIp,
  CORS,
  generateCode,
  json,
  overLimit,
  storeCode,
} from '../_shared/recovery.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false }, 405);

  const authorization = req.headers.get('Authorization') ?? '';
  const { data: auth } = await anonClient(authorization).auth.getUser();
  const user = auth.user;
  if (!user?.email) return json({ ok: false }, 401);

  const admin = adminClient();
  if (await overLimit(admin, { [`code:${user.id}`]: 5, [`ip:${clientIp(req)}`]: 20 })) {
    return json({ ok: false, reason: 'limit' });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const password = typeof body.password === 'string' ? body.password : '';
  const { error } = await anonClient().auth.signInWithPassword({ email: user.email, password });
  if (error) return json({ ok: false, reason: 'password' });

  const code = generateCode();
  await storeCode(admin, user.id, code);
  return json({ ok: true, code });
});
