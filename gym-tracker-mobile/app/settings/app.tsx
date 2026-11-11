import React from 'react';
import { View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { useLocale } from '@/hooks/useLocale';
import { t } from '@/i18n';
import { useSettingsStore } from '@/stores/settingsStore';
import { LANGUAGES, THEMES } from '@/components/profile/choices';
import { Choice } from '@/components/ui/Choice';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Text } from '@/components/ui/Text';
import { buzz } from '@/components/ui/PressableScale';

/** Profil → Application: the language and the appearance. Each choice applies at once. */
export default function AppSettingsScreen() {
  useLocale();
  const settings = useSettingsStore((s) => s.settings);
  const { updateSettings } = useSettingsStore.getState();
  return (
    <Screen scroll>
      <ScreenHeader back title={t('profile.appScreen.title')} subtitle={t('profile.appScreen.subtitle')} />
      <SectionTitle title={t('profile.language.title')} />
      <Options options={LANGUAGES} value={settings.language} onChange={(language) => updateSettings({ language })} />
      <SectionTitle title={t('profile.appearance.title')} />
      <Options options={THEMES} value={settings.theme} onChange={(theme) => updateSettings({ theme })} />
    </Screen>
  );
}

function Options<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: () => string; detail?: () => string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
      {options.map(({ id, label, detail }) => (
        <Choice
          key={id}
          selected={value === id}
          onPress={() => {
            buzz('selection');
            onChange(id);
          }}
          accessibilityLabel={label()}
          style={{ minHeight: 58, paddingHorizontal: 18, paddingVertical: 10, justifyContent: 'center' }}
        >
          <Text size={17} weight="black">
            {label()}
          </Text>
          {detail ? (
            <Text size={13} color={colors.inkMuted} style={{ marginTop: 2, lineHeight: 18 }}>
              {detail()}
            </Text>
          ) : null}
        </Choice>
      ))}
      <View style={{ height: space.xs }} />
    </View>
  );
}
