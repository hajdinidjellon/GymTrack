import React from 'react';
import { Alert, View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { backupFileName, makeBackup, parseBackup } from '@/domain/backup';
import { workoutsToCsv } from '@/domain/exportCsv';
import { importWorkouts, type ImportResult } from '@/domain/importWorkouts';
import { pickTextFile, shareFile } from '@/services/files';
import { logger } from '@/services/logger';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';
import { t } from '@/i18n';

/** Any file: the content is checked after, with a clear message when it is not the right one. */
const ANY = ['*/*'];

/** Runs a file action; a crash becomes a message, never a silent failure. */
async function guarded(label: string, action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    logger.warn(`${label} failed`, error);
    Alert.alert(t('data.failTitle'), t('data.failText'));
  }
}

export function createBackup() {
  return guarded('backup', async () => {
    const now = new Date();
    const content = makeBackup(
      {
        profile: useProfileStore.getState().profile,
        workouts: useWorkoutStore.getState().workouts,
        settings: useSettingsStore.getState().settings,
      },
      now,
    );
    await shareFile(backupFileName(now), content, 'application/json', t('data.backup.shareTitle'));
  });
}

export function restoreBackup() {
  return guarded('restore', async () => {
    const text = await pickTextFile(ANY);
    if (text === null) return;
    const backup = parseBackup(text);
    if (typeof backup === 'string') {
      Alert.alert(
        t('data.failTitle'),
        t(backup === 'newerVersion' ? 'data.backup.newerVersion' : 'data.backup.notBackup'),
      );
      return;
    }
    Alert.alert(t('data.backup.confirmTitle'), t('data.backup.confirmText', { count: backup.workouts.length }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('data.backup.confirm'),
        onPress: () =>
          void guarded('restore', async () => {
            if (backup.profile) await useProfileStore.getState().saveProfile(backup.profile);
            useSettingsStore.getState().updateSettings(backup.settings);
            const added = await useWorkoutStore.getState().importWorkouts(backup.workouts);
            const lines = [t('data.backup.added', { count: added })];
            if (backup.rejected) lines.push(t('data.backup.rejected', { count: backup.rejected }));
            Alert.alert(t('data.backup.doneTitle'), lines.join('\n'));
          }),
      },
    ]);
  });
}

/** What the import did, one line per fact, nothing hidden. */
export function importSummary(result: ImportResult, added: number): string {
  const source = result.source === 'strong' ? 'Strong' : 'Hevy';
  const lines = [added ? t('data.import.added', { count: added, source }) : t('data.import.nothingNew')];
  if (result.recognized) lines.push(t('data.import.recognized', { count: result.recognized }));
  if (result.unknown) lines.push(t('data.import.unknown', { count: result.unknown }));
  if (result.skipped) lines.push(t('data.import.skipped', { count: result.skipped }));
  if (result.source === 'strong') lines.push(t('data.import.strongKilos'));
  return lines.join('\n');
}

export function importCsv() {
  return guarded('import', async () => {
    const text = await pickTextFile(ANY);
    if (text === null) return;
    const result = importWorkouts(text, useSettingsStore.getState().settings.customExercises);
    if (typeof result === 'string') {
      Alert.alert(t('data.import.errorTitle'), t(`data.import.${result}`));
      return;
    }
    const added = await useWorkoutStore.getState().importWorkouts(result.workouts);
    Alert.alert(t('data.import.doneTitle'), importSummary(result, added));
  });
}

export function exportCsv() {
  return guarded('export', async () => {
    const { workouts } = useWorkoutStore.getState();
    if (workouts.length === 0) {
      Alert.alert(t('data.csv.emptyTitle'), t('data.csv.emptyText'));
      return;
    }
    await shareFile(backupFileName(new Date(), 'csv'), workoutsToCsv(workouts), 'text/csv', t('data.csv.shareTitle'));
  });
}

/** The three ways in and out of the app, each with one line saying what it does. */
export function DataActions() {
  return (
    <View style={{ gap: space.lg }}>
      <Section title={t('data.backup.title')} text={t('data.backup.text')}>
        <StickerButton label={t('data.backup.create')} size="small" onPress={() => void createBackup()} />
        <StickerButton
          label={t('data.backup.restore')}
          variant="secondary"
          size="small"
          onPress={() => void restoreBackup()}
        />
      </Section>
      <Section title={t('data.import.title')} text={t('data.import.text')}>
        <StickerButton
          label={t('data.import.button')}
          variant="secondary"
          size="small"
          onPress={() => void importCsv()}
        />
      </Section>
      <Section title={t('data.csv.title')} text={t('data.csv.text')}>
        <StickerButton label={t('data.csv.button')} variant="secondary" size="small" onPress={() => void exportCsv()} />
      </Section>
    </View>
  );
}

function Section({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <StickerCard style={{ gap: space.sm + 2 }}>
      <Text size={19} weight="black" accessibilityRole="header">
        {title}
      </Text>
      <Text size={15} color={colors.inkMuted} style={{ lineHeight: 21 }}>
        {text}
      </Text>
      <View style={{ gap: space.sm, marginTop: 4 }}>{children}</View>
    </StickerCard>
  );
}
