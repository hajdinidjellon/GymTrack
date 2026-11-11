import React, { useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { requestVoicePermission, voiceInputAvailable } from '@/services/voiceInput';
import { colors, space } from '@/constants/theme';
import { formatKg } from '@/domain/plates';
import { findGym } from '@/domain/gyms';
import { GOALS, programTitle } from '@/domain/programs';
import { totals } from '@/domain/stats';
import { insights } from '@/domain/insights';
import { useLoadFactor } from '@/hooks/useLoadFactor';
import { useLocale } from '@/hooks/useLocale';
import { localeTag, t } from '@/i18n';
import { hasSession } from '@/services/supabase';
import { pendingAfterSync, signOutAndClear } from '@/stores/accountData';
import { speak } from '@/services/speech';
import { playRestBell } from '@/services/sound';
import { useProfileStore } from '@/stores/profileStore';
import { REST_CHOICES, useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { FadeIn } from '@/components/ui/FadeIn';
import { StatTile } from '@/components/stats/StatTile';
import { Group, Row } from '@/components/profile/SettingsRows';
import { languageLabel, themeLabel } from '@/components/profile/choices';
import { PlateFace } from '@/components/disc/PlateFace';
import { InsightsCard } from '@/components/stats/InsightsCard';

export default function Profile() {
  useLocale();
  const profile = useProfileStore((s) => s.profile);
  const settings = useSettingsStore((s) => s.settings);
  const { updateSettings } = useSettingsStore.getState();
  const workouts = useWorkoutStore((s) => s.workouts);
  const factor = useLoadFactor();
  const stats = useMemo(() => totals(workouts, factor), [workouts, factor]);
  const perWeek = profile?.program.perWeek ?? 3;
  const own = settings.customExercises;
  const learned = useMemo(() => insights(workouts, { perWeek, own, now: new Date() }), [workouts, perWeek, own]);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    hasSession()
      .then(setSignedIn)
      .catch(() => null);
  }, []);

  const nextRest = () => {
    const i = REST_CHOICES.indexOf(settings.defaultRestTime);
    updateSettings({ defaultRestTime: REST_CHOICES[(i + 1) % REST_CHOICES.length]! });
  };

  const toggleVoice = () => {
    const voice = !settings.voice;
    updateSettings({ voice });
    if (voice) speak(t('profile.during.voiceHello'));
  };

  const toggleVoiceCommands = async () => {
    if (settings.voiceCommands) {
      updateSettings({ voiceCommands: false });
      return;
    }
    if (await requestVoicePermission()) updateSettings({ voiceCommands: true });
    else Alert.alert(t('profile.during.commandsDeniedTitle'), t('profile.during.commandsDeniedText'));
  };

  const toggleBell = () => {
    const restBell = !settings.restBell;
    updateSettings({ restBell });
    if (restBell) playRestBell();
  };

  const [canListen] = useState(voiceInputAvailable);
  const goal = GOALS.find((g) => g.id === profile?.goal);
  // The name the user gave their own program, else the program's
  const split = profile ? { title: programTitle(profile.program.split, settings.programName) } : null;
  const bar = t('profile.settings.bar', { kg: formatKg(settings.barWeight) });
  const chain = findGym(settings.gymChain)?.name;
  const gymValue = chain ? `${chain} · ${bar}` : bar;

  return (
    <Screen tabs scroll>
      <FadeIn>
        <ScreenHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />
      </FadeIn>

      <FadeIn index={1}>
        <StickerCard style={{ gap: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <PlateFace kg={20} size={60} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text size={20} weight="black" numberOfLines={1}>
                {goal?.title ?? t('profile.card.fallbackGoal')}
              </Text>
              <Text size={14} color={colors.inkMuted} numberOfLines={1}>
                {split ? t('profile.card.split', { split: split.title, n: perWeek }) : ''}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <StatTile value={String(stats.sessions)} label={t('profile.card.sessions', { count: stats.sessions })} />
            <StatTile
              value={t('profile.card.tons', { tons: formatKg(Math.round(stats.tonnage / 100) / 10) })}
              label={t('profile.card.lifted')}
            />
            <StatTile value={stats.since ? formatMonth(stats.since) : '—'} label={t('profile.card.since')} />
          </View>
        </StickerCard>
      </FadeIn>

      <FadeIn index={2}>
        <SectionTitle title={t('profile.training.title')} />
        <Group>
          <Row
            label={t('profile.training.goal')}
            value={goal?.title ?? ''}
            onPress={() => router.push({ pathname: '/goal', params: { edit: '1' } })}
            chevron
          />
          <Row
            label={t('profile.training.program')}
            value={split ? t('profile.training.programValue', { split: split.title, n: perWeek }) : ''}
            onPress={() => router.push({ pathname: '/program', params: { edit: '1' } })}
            chevron
          />
          <Row
            label={t('profile.training.days')}
            value={t('profile.training.daysValue')}
            onPress={() => router.push('/days')}
            chevron
            last
          />
        </Group>

        <SectionTitle title={t('profile.during.title')} />
        <Group>
          <Row
            label={t('profile.during.rest')}
            value={t('profile.during.restValue', { seconds: settings.defaultRestTime })}
            onPress={nextRest}
            hint={t('profile.during.restHint')}
          />
          <Row
            label={t('profile.during.voice')}
            value={settings.voice ? t('profile.during.voiceOn') : t('profile.during.voiceOff')}
            on={settings.voice}
            onPress={toggleVoice}
            hint={t('profile.during.tapToChange')}
          />
          <Row
            label={t('profile.during.bell')}
            value={settings.restBell ? t('profile.during.bellOn') : t('profile.during.bellOff')}
            on={settings.restBell}
            onPress={toggleBell}
            hint={t('profile.during.tapToChange')}
          />
          {canListen ? (
            <Row
              label={t('profile.during.commands')}
              value={settings.voiceCommands ? t('profile.during.commandsOn') : t('profile.during.commandsOff')}
              on={settings.voiceCommands}
              onPress={() => void toggleVoiceCommands()}
              hint={t('profile.during.commandsHint')}
            />
          ) : null}
          <Row
            label={t('profile.during.rpe')}
            value={settings.preciseRpe ? t('profile.during.rpeOn') : t('profile.during.rpeOff')}
            on={settings.preciseRpe}
            onPress={() => updateSettings({ preciseRpe: !settings.preciseRpe })}
            hint={t('profile.during.rpeHint')}
          />
          <Row
            label={t('profile.during.warmups')}
            value={settings.warmups ? t('profile.during.warmupsOn') : t('profile.during.warmupsOff')}
            on={settings.warmups}
            onPress={() => updateSettings({ warmups: !settings.warmups })}
            hint={t('profile.during.tapToChange')}
            last
          />
        </Group>

        <SectionTitle title={t('profile.settings.title')} />
        <Group>
          <Row
            label={t('profile.settings.gym')}
            value={gymValue}
            onPress={() => router.push('/settings/gym')}
            chevron
          />
          <Row
            label={t('profile.settings.app')}
            value={t('profile.settings.appValue', {
              language: languageLabel(settings.language),
              theme: themeLabel(settings.theme),
            })}
            onPress={() => router.push('/settings/app')}
            chevron
            last
          />
        </Group>
      </FadeIn>

      <FadeIn index={3}>
        <View style={{ marginTop: space.xl + 4 }}>
          <InsightsCard insights={learned} sessions={workouts.length} />
        </View>

        <SectionTitle title={t('profile.data.title')} />
        <Group>
          <Row
            label={t('profile.data.transfer')}
            value={t('profile.data.transferValue')}
            onPress={() => router.push('/data')}
            hint={t('profile.data.transferHint')}
            chevron
          />
          <Row
            label={t('privacy.link')}
            value={t('privacy.linkValue')}
            onPress={() => router.push('/privacy')}
            hint={t('privacy.linkHint')}
            chevron
            last
          />
        </Group>

        <SectionTitle title={t('profile.account.title')} />
        <StickerCard style={{ gap: space.md }}>
          <Text size={15} color={colors.inkMuted} style={{ lineHeight: 21 }}>
            {signedIn ? t('profile.account.signedIn') : t('profile.account.local')}
          </Text>
          {signedIn ? (
            <StickerButton
              label={t('profile.account.manage')}
              variant="secondary"
              size="small"
              onPress={() => router.push('/account')}
            />
          ) : null}
          <StickerButton
            label={signedIn ? t('profile.account.signOut') : t('profile.account.signIn')}
            variant="secondary"
            size="small"
            onPress={() => confirmLogout(signedIn)}
          />
        </StickerCard>
      </FadeIn>
    </Screen>
  );
}

/** "oct. 2026" */
function formatMonth(iso: string): string {
  const d = new Date(iso);
  // The whole year: « nov. 26 » read as the 26th of November
  return `${d.toLocaleDateString(localeTag(), { month: 'short' })} ${d.getFullYear()}`;
}

/** Back to the login page. */
function toLogin() {
  useSettingsStore.getState().updateSettings({ signedOut: true });
  router.replace('/login');
}

/** The account's data leaves this phone with it: the next one to sign in starts clean. */
async function leave() {
  await signOutAndClear();
  toLogin();
}

function confirmLogout(signedIn: boolean) {
  // Sans compte, rien à quitter : on va droit à la connexion, les séances restent
  if (!signedIn) return toLogin();
  Alert.alert(t('profile.account.confirmTitle'), t('profile.account.confirmText'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('profile.account.signOut'),
      style: 'destructive',
      onPress: async () => {
        const pending = await pendingAfterSync();
        if (pending === 0) return leave();
        // Not in the account yet: said before it is lost
        Alert.alert(t('profile.account.pendingTitle'), t('profile.account.pendingText', { count: pending }), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('profile.account.signOutAnyway'), style: 'destructive', onPress: () => void leave() },
        ]);
      },
    },
  ]);
}
