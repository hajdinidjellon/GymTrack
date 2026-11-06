// "Mot de passe oublié", for someone signed out. Two ways:
// - { action: 'email', username, locale }: a reset link to the account's contact email, if it has one.
//   The answer is always the same: it never tells whether the account exists or has an email.
// - { action: 'code', username, code, password }: the recovery code sets a new password and is
//   replaced by a new one, returned once. Any failure gets the same answer.
// Limits: 5 tries per username and 20 per IP in 15 minutes.

import {
  adminClient,
  clientIp,
  CORS,
  env,
  generateCode,
  json,
  lookupAccount,
  normalizeCode,
  normalizeUsername,
  overLimit,
  PASSWORD_MIN,
  storeCode,
  verifyCode,
  authEmail,
} from '../_shared/recovery.ts';

const MAIL = {
  fr: {
    subject: 'Okilo : ton nouveau mot de passe',
    body: (link: string) =>
      `<p>Quelqu'un (toi, on espère) a demandé un nouveau mot de passe pour ton compte Okilo.</p>` +
      `<p><a href="${link}">Choisir un nouveau mot de passe</a></p>` +
      `<p>Le lien marche une fois, pendant une heure. Pas toi ? Ignore ce mail : rien ne change.</p>`,
  },
  en: {
    subject: 'Okilo: your new password',
    body: (link: string) =>
      `<p>Someone (you, we hope) asked for a new password for your Okilo account.</p>` +
      `<p><a href="${link}">Choose a new password</a></p>` +
      `<p>The link works once, for one hour. Not you? Ignore this email: nothing changes.</p>`,
  },
};

/** Any email API works; Resend is used here. Without a key, nothing is sent (logged for the developer). */
async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const key = env('RESEND_API_KEY');
  if (!key) {
    console.warn('RESEND_API_KEY missing: recovery email not sent');
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env('RECOVERY_EMAIL_FROM'), to, subject, html }),
  });
  if (!res.ok) console.warn('recovery email refused', res.status);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false }, 405);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const username = normalizeUsername(body.username);
  if (!username) return json({ ok: false });
  const admin = adminClient();
  const limited = await overLimit(admin, { [`user:${username}`]: 5, [`ip:${clientIp(req)}`]: 20 });

  if (body.action === 'email') {
    // Same answer whatever happens below
    if (!limited) {
      const account = await lookupAccount(admin, username);
      if (account?.contact_email) {
        const { data } = await admin.auth.admin.generateLink({ type: 'recovery', email: authEmail(username) });
        const token = data?.properties?.hashed_token;
        if (token) {
          const base = env('RESET_LINK_URL') || 'okilo://reset-password';
          const link = `${base}?token_hash=${encodeURIComponent(token)}&type=recovery`;
          const mail = MAIL[body.locale === 'en' ? 'en' : 'fr'];
          await sendMail(account.contact_email, mail.subject, mail.body(link));
        }
      }
    }
    return json({ ok: true });
  }

  if (body.action === 'code') {
    if (limited) return json({ ok: false, reason: 'limit' });
    const code = normalizeCode(body.code);
    const password = typeof body.password === 'string' ? body.password : '';
    const account = await lookupAccount(admin, username);
    const { data: row } = account
      ? await admin.from('recovery_codes').select('code_hash').eq('user_id', account.user_id).maybeSingle()
      : { data: null };
    // Always hashed, even without account or code: the time says nothing
    const valid = await verifyCode(code ?? '', (row as { code_hash: string } | null)?.code_hash ?? null);
    if (!account || !code || !valid || password.length < PASSWORD_MIN) return json({ ok: false });

    const { error } = await admin.auth.admin.updateUserById(account.user_id, { password });
    if (error) return json({ ok: false });
    // The code is used up: a new one, shown once
    const next = generateCode();
    await storeCode(admin, account.user_id, next);
    return json({ ok: true, code: next });
  }

  return json({ ok: false });
});
