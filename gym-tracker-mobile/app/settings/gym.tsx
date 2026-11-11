import React from 'react';
import { View } from 'react-native';
import { border, colors, hardShadow, radius, space } from '@/constants/theme';
import { findGym } from '@/domain/gyms';
import { ALL_PLATES, COLLAR_CHOICES, formatKg } from '@/domain/plates';
import { useLocale } from '@/hooks/useLocale';
import { t } from '@/i18n';
import { useSettingsStore } from '@/stores/settingsStore';
import { PlateFace } from '@/components/disc/PlateFace';
import { Chip } from '@/components/ui/Chip';
import { Check } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';
import { Group, Row } from '@/components/profile/SettingsRows';

/** Bars found in gyms: the classic one, the shorter (women's) one, a light training bar. */
const BAR_WEIGHTS = [20, 15, 10];

/** Profil → Ma salle: the bar, the collars, the plates and the machines' steps of the user's gym. */
export default function GymSettingsScreen() {
  useLocale();
  const settings = useSettingsStore((s) => s.settings);
  const { updateSettings, togglePlate } = useSettingsStore.getState();
  const chain = findGym(settings.gymChain)?.name;
  const steps = [
    settings.stackStep ? t('profile.gymScreen.stack', { kg: formatKg(settings.stackStep) }) : null,
    settings.cableStep ? t('profile.gymScreen.cable', { kg: formatKg(settings.cableStep) }) : null,
  ].filter(Boolean);

  return (
    <Screen scroll>
      <ScreenHeader back title={t('profile.gymScreen.title')} subtitle={t('profile.plates.text')} />
      {chain || steps.length ? (
        <StickerCard small style={{ gap: 4 }}>
          <Text size={18} weight="black">
            {chain ?? t('profile.gymScreen.yourGym')}
          </Text>
          {steps.length ? (
            <Text size={14} color={colors.inkMuted} style={{ lineHeight: 19 }}>
              {t('profile.gymScreen.machines', { steps: steps.join(' · ') })}
            </Text>
          ) : null}
        </StickerCard>
      ) : null}
      <SectionTitle title={t('profile.gymScreen.bar')} />
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
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
      <SectionTitle title={t('profile.plates.collars')} />
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
      <Text size={13} color={colors.inkMuted} style={{ lineHeight: 18 }}>
        {t('profile.plates.collarsHint')}
      </Text>
      <SectionTitle title={t('profile.plates.title')} right={<Chip tone="sun" label={t('profile.plates.chip')} />} />
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
      <SectionTitle title={t('profile.gymScreen.totals')} />
      <Group>
        <Row
          label={t('profile.data.total')}
          value={settings.countBothSides ? t('profile.data.bothSides') : t('profile.data.asLogged')}
          on={settings.countBothSides}
          onPress={() => updateSettings({ countBothSides: !settings.countBothSides })}
          hint={settings.countBothSides ? t('profile.data.bothSidesHint') : t('profile.data.asLoggedHint')}
          last
        />
      </Group>
      <Text size={13} color={colors.inkMuted} style={{ marginTop: space.sm, lineHeight: 18 }}>
        {settings.countBothSides ? t('profile.gymScreen.bothSidesText') : t('profile.gymScreen.asLoggedText')}
      </Text>
      <View style={{ height: space.xl }} />
    </Screen>
  );
}
