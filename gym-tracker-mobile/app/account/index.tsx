import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { t } from '@/i18n';
import { useLocale } from '@/hooks/useLocale';
import { AccountSettings } from '@/components/account/AccountSettings';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

/** Profil → Compte: recovery email and recovery code. Only reached when signed in. */
export default function AccountScreen() {
  useLocale();
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll>
        <ScreenHeader back title={t('account.settings.title')} />
        <AccountSettings />
      </Screen>
    </KeyboardAvoidingView>
  );
}
