import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { AppSettings } from '@/types';
import { requestVoicePermission, voiceInputAvailable } from '@/services/voiceInput';
import { border, colors, hardShadow, radius, space } from '@/constants/theme';
import { ALL_PLATES, COLLAR_CHOICES, formatKg } from '@/domain/plates';
import { GOALS, getSplit } from '@/domain/programs';
import { totals } from '@/domain/stats';
import { insights } from '@/domain/insights';
import { useLoadFactor } from '@/hooks/useLoadFactor';
import { useLocale } from '@/hooks/useLocale';
import { localeTag, t, type LanguageSetting } from '@/i18n';
import { hasSession, signOut } from '@/services/supabase';
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
import { PressableScale } from '@/components/ui/PressableScale';
import { StatTile } from '@/components/stats/StatTile';
import { Chip } from '@/components/ui/Chip';
import { Choice } from '@/components/ui/Choice';
import { Check, ChevronRight } from '@/components/ui/icons';
import { PlateFace } from '@/components/disc/PlateFace';
import { InsightsCard } from '@/components/stats/InsightsCard';

/** Bars found in gyms: the classic one, the shorter (women's) one, a light training bar. */
const BAR_WEIGHTS = [20, 15, 10];

export default function Profile() {
  useLocale();
  const profile = useProfileStore((s) => s.profile);
  const settings = useSettingsStore((s) => s.settings);
  const { updateSettings, togglePlate } = useSettingsStore.getState();
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
  const split = profile ? getSplit(profile.program.split) : null;

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

        <SectionTitle title={t('profile.language.title')} />
        <LanguagePicker value={settings.language} onChange={(language) => updateSettings({ language })} />

        <SectionTitle title={t('profile.appearance.title')} />
        <Segmented
          options={THEMES.map(({ id, label }) => ({ id, label: label() }))}
          value={settings.theme}
          onChange={(theme) => updateSettings({ theme })}
          hint={t('profile.appearance.hint')}
        />
      </FadeIn>

      <FadeIn index={3}>
        <SectionTitle title={t('profile.plates.title')} right={<Chip tone="sun" label={t('profile.plates.chip')} />} />
        <Text size={14} color={colors.inkMuted} style={{ marginBottom: space.md, lineHeight: 19 }}>
          {t('profile.plates.text')}
        </Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8, marginBottom: space.md }}>
          {BAR_WEIGHTS.map((kg) => {
            const on = settings.barWeight === kg;
            return (
              <PressableScale
                key={kg}
                haptic="selection"
                onPress={() => updateSettings({ barWeight: kg })}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={t('profile.plates.barA11y', { kg: formatKg(kg) })}
                // On the outer view: the three bars share the whole width
                containerStyle={{ flex: 1 }}
                style={{
                  minHeight: 48,
                  borderRadius: radius.pill,
                  borderWidth: on ? border.strong : border.base,
                  borderColor: on ? colors.outlineStrong : colors.outlineSoft,
                  backgroundColor: on ? colors.coralSoft : colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text size={15} weight="black" color={on ? colors.ink : colors.inkMuted}>
                  {t('profile.plates.bar', { kg: formatKg(kg) })}
                </Text>
              </PressableScale>
            );
          })}
        </View>
        <Text size={15} weight="black" style={{ marginBottom: 8 }}>
          {t('profile.plates.collars')}
        </Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
          {COLLAR_CHOICES.map((kg) => {
            const on = settings.collarWeight === kg;
            return (
              <PressableScale
                key={kg}
                haptic="selection"
                onPress={() => updateSettings({ collarWeight: kg })}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={
                  kg ? t('profile.plates.collarsA11y', { kg: formatKg(kg) }) : t('profile.plates.collarsNoneA11y')
                }
                containerStyle={{ flex: 1 }}
                style={{
                  minHeight: 44,
                  borderRadius: radius.pill,
                  borderWidth: on ? border.strong : border.base,
                  borderColor: on ? colors.outlineStrong : colors.outlineSoft,
                  backgroundColor: on ? colors.coralSoft : colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text size={15} weight="black" color={on ? colors.ink : colors.inkMuted}>
                  {kg ? t('profile.plates.collarsKg', { kg: formatKg(kg) }) : t('profile.plates.collarsNone')}
                </Text>
              </PressableScale>
            );
          })}
        </View>
        <Text size={13} color={colors.inkMuted} style={{ marginBottom: space.md, lineHeight: 18 }}>
          {t('profile.plates.collarsHint')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ALL_PLATES.map((kg) => {
            const on = settings.plates.includes(kg);
            return (
              <PressableScale
                key={kg}
                haptic="selection"
                onPress={() => togglePlate(kg)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={t('profile.plates.a11y', { kg: formatKg(kg) })}
                style={{
                  width: 78,
                  paddingTop: 10,
                  paddingBottom: 8,
                  borderRadius: radius.md,
                  borderCurve: 'continuous',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: on ? colors.card : 'transparent',
                  borderWidth: border.base,
                  borderColor: on ? colors.outlineStrong : colors.outlineSoft,
                  borderStyle: on ? 'solid' : 'dashed',
                  ...(on ? hardShadow(2) : {}),
                }}
              >
                <View>
                  <PlateFace kg={kg} size={56} off={!on} />
                  {on ? (
                    <View
                      style={{
                        position: 'absolute',
                        right: -2,
                        top: -2,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: colors.success,
                        borderWidth: 2,
                        borderColor: colors.outline,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={13} color={colors.onSuccess} />
                    </View>
                  ) : null}
                </View>
                <Text size={13} weight="black" color={on ? colors.ink : colors.inkFaint}>
                  {formatKg(kg)} kg
                </Text>
              </PressableScale>
            );
          })}
        </View>

        <View style={{ marginTop: space.xl + 4 }}>
          <InsightsCard insights={learned} sessions={workouts.length} />
        </View>

        <SectionTitle title={t('profile.data.title')} />
        <Group>
          <Row
            label={t('profile.data.total')}
            value={settings.countBothSides ? t('profile.data.bothSides') : t('profile.data.asLogged')}
            on={settings.countBothSides}
            onPress={() => updateSettings({ countBothSides: !settings.countBothSides })}
            hint={settings.countBothSides ? t('profile.data.bothSidesHint') : t('profile.data.asLoggedHint')}
          />
          <Row
            label={t('profile.data.transfer')}
            value={t('profile.data.transferValue')}
            onPress={() => router.push('/data')}
            hint={t('profile.data.transferHint')}
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

/** "oct. 26" */
function formatMonth(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(localeTag(), { month: 'short' })} ${String(d.getFullYear()).slice(2)}`;
}

/** A sticker switch: the knob on the right and green when on. */
function Switch({ on }: { on: boolean }) {
  return (
    <View
      style={{
        width: 50,
        height: 30,
        borderRadius: 15,
        borderWidth: border.base,
        borderColor: colors.outline,
        backgroundColor: on ? colors.success : colors.paper,
        padding: 2,
        alignItems: on ? 'flex-end' : 'flex-start',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 21,
          height: 21,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: colors.outline,
          backgroundColor: colors.card,
        }}
      />
    </View>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ borderRadius: radius.card, ...hardShadow(5) }}>
      <View
        style={{
          borderRadius: radius.card,
          borderCurve: 'continuous',
          borderWidth: border.strong,
          borderColor: colors.outline,
          backgroundColor: colors.card,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** Back to the login page. Workouts stay on the phone, nothing is deleted. */
function toLogin() {
  useSettingsStore.getState().updateSettings({ signedOut: true });
  router.replace('/login');
}

function confirmLogout(signedIn: boolean) {
  // Sans compte, rien à quitter : on va droit à la connexion
  if (!signedIn) return toLogin();
  Alert.alert(t('profile.account.confirmTitle'), t('profile.account.confirmText'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('profile.account.signOut'),
      style: 'destructive',
      onPress: async () => {
        await signOut().catch(() => null);
        toLogin();
      },
    },
  ]);
}

/** Language names are written in their own language, whatever the app speaks. */
const LANGUAGES: { id: LanguageSetting; label: () => string }[] = [
  { id: 'auto', label: () => t('profile.language.auto') },
  { id: 'fr', label: () => 'Français' },
  { id: 'en', label: () => 'English' },
];

const THEMES: { id: AppSettings['theme']; label: () => string }[] = [
  { id: 'auto', label: () => t('profile.appearance.auto') },
  { id: 'light', label: () => t('profile.appearance.light') },
  { id: 'dark', label: () => t('profile.appearance.dark') },
];

/** Three choices side by side, with one line under them. The screen switches at once. */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  hint,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  hint: string;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 10 }}>
        {options.map(({ id, label }) => (
          <Choice
            key={id}
            selected={value === id}
            onPress={() => {
              Haptics.selectionAsync().catch(() => null);
              onChange(id);
            }}
            accessibilityLabel={label}
            style={{ flex: 1, height: 56, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text size={16} weight="black" numberOfLines={1} adjustsFontSizeToFit>
              {label}
            </Text>
          </Choice>
        ))}
      </View>
      <Text size={14} color={colors.inkMuted} style={{ lineHeight: 19 }}>
        {hint}
      </Text>
    </View>
  );
}

/** Automatique / Français / English. The screen switches at once. */
function LanguagePicker({ value, onChange }: { value: LanguageSetting; onChange: (l: LanguageSetting) => void }) {
  return (
    <View style={{ gap: space.sm }}>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 10 }}>
        {LANGUAGES.map(({ id, label }) => (
          <Choice
            key={id}
            selected={value === id}
            onPress={() => {
              Haptics.selectionAsync().catch(() => null);
              onChange(id);
            }}
            accessibilityLabel={label()}
            style={{ flex: 1, height: 56, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text size={16} weight="black" numberOfLines={1} adjustsFontSizeToFit>
              {label()}
            </Text>
          </Choice>
        ))}
      </View>
      <Text size={14} color={colors.inkMuted} style={{ lineHeight: 19 }}>
        {t('profile.language.autoHint')}
      </Text>
    </View>
  );
}

interface RowProps {
  label: string;
  value: string;
  onPress: () => void;
  chevron?: boolean;
  last?: boolean;
  hint?: string;
  /** An on/off setting: drawn as a switch, so it reads as something to change. */
  on?: boolean;
}

function Row({ label, value, onPress, chevron, last, hint, on }: RowProps) {
  const toggle = on !== undefined;
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => null);
        onPress();
      }}
      accessibilityRole={toggle ? 'switch' : 'button'}
      accessibilityState={toggle ? { checked: on } : undefined}
      accessibilityLabel={toggle ? label : t('profile.row', { label, value })}
      accessibilityHint={hint}
      style={({ pressed }) => ({
        minHeight: 56,
        gap: 16,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: last ? 0 : 2,
        borderBottomColor: colors.line,
        backgroundColor: pressed ? colors.coralSoft : 'transparent',
      })}
    >
      <Text size={16} weight="bold">
        {label}
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
        {toggle ? (
          <Switch on={on} />
        ) : (
          <Text
            size={chevron ? 14 : 16}
            weight={chevron ? 'semibold' : 'black'}
            color={chevron ? colors.inkMuted : colors.ink}
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {value}
          </Text>
        )}
        {chevron ? <ChevronRight size={18} /> : null}
      </View>
    </Pressable>
  );
}
