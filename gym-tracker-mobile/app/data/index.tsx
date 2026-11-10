import React from 'react';
import { useLocale } from '@/hooks/useLocale';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { DataActions } from '@/components/data/DataActions';
import { t } from '@/i18n';

/** Profil → Tes données: backup, restore, import from Strong or Hevy, CSV export. */
export default function DataScreen() {
  useLocale();
  return (
    <Screen scroll>
      <ScreenHeader back title={t('data.title')} subtitle={t('data.subtitle')} />
      <DataActions />
    </Screen>
  );
}
