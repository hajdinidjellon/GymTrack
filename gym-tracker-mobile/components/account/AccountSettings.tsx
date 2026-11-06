import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { contactEmailError } from '@/domain/account';
import { t } from '@/i18n';
import { createRecoveryCode, getContactEmail, updateContactEmail } from '@/services/recovery';
import { RecoveryCodeView } from '@/components/account/RecoveryCodeView';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

type Message = { text: string; error: boolean } | null;

/** Profil → Compte: the recovery email, added or changed, and a new recovery code. Password asked each time. */
export function AccountSettings() {
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<Message>(null);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getContactEmail()
      .then((current) => {
        setSaved(current);
        setEmail(current ?? '');
      })
      .catch(() => null);
  }, []);

  const saveEmail = async () => {
    const invalid = contactEmailError(email);
    if (invalid) return setMessage({ text: invalid, error: true });
    setBusy(true);
    const next = email.trim() || null;
    const result = await updateContactEmail(next, password);
    setBusy(false);
    if (result !== 'ok') {
      return setMessage({
        text: t(result === 'password' ? 'account.settings.wrongPassword' : 'account.settings.failed'),
        error: true,
      });
    }
    setSaved(next);
    setPassword('');
    setMessage({ text: t('account.settings.emailSaved'), error: false });
  };

  const newCode = async () => {
    setBusy(true);
    const result = await createRecoveryCode(password);
    setBusy(false);
    if (!result.ok) {
      const key = {
        password: 'account.settings.wrongPassword',
        limit: 'account.forgot.limit',
        other: 'account.settings.failed',
      } as const;
      return setMessage({ text: t(key[result.reason]), error: true });
    }
    setPassword('');
    setMessage(null);
    setCode(result.code);
  };

  // Shown once, in place: gone once kept
  if (code) return <RecoveryCodeView code={code} onKept={() => setCode(null)} />;

  return (
    <View style={{ gap: space.lg }}>
      <Text size={16} color={colors.inkMuted} style={{ lineHeight: 22 }}>
        {t('account.settings.subtitle')}
      </Text>
      <StickerCard small>
        <Text size={15} weight="bold">
          {t('account.settings.email')}
        </Text>
        <Text size={16} color={colors.inkMuted} testID="saved-email">
          {saved ?? t('account.settings.noEmail')}
        </Text>
      </StickerCard>
      <TextField
        label={t('account.emailLabel')}
        hint={t('account.emailWhy')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('onboarding.login.emailPlaceholder')}
        kind="email"
      />
      <TextField
        label={t('account.settings.password')}
        hint={t('account.settings.passwordWhy')}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        kind="password"
      />
      {message ? (
        <Text
          size={16}
          weight="bold"
          color={message.error ? colors.danger : colors.inkMuted}
          accessibilityLiveRegion="polite"
        >
          {message.text}
        </Text>
      ) : null}
      <StickerButton
        label={t(saved && !email.trim() ? 'account.settings.removeEmail' : 'account.settings.saveEmail')}
        onPress={saveEmail}
        disabled={busy || !password || (email.trim() || null) === saved}
      />
      <View style={{ gap: space.xs }}>
        <StickerButton
          label={t('account.settings.newCode')}
          variant="secondary"
          onPress={newCode}
          disabled={busy || !password}
        />
        <Text size={14} color={colors.inkMuted} align="center">
          {t('account.settings.newCodeHint')}
        </Text>
      </View>
    </View>
  );
}
