import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, fonts, radius, space } from '@/constants/theme';
import { draftFrom, draftProblem, type CustomProgramDraft } from '@/domain/customProgram';
import { NAME_MAX, SPLITS } from '@/domain/programs';
import { SETTINGS_LIMITS } from '@/domain/schemas';
import { dayName, t } from '@/i18n';
import type { AppSettings, SplitId } from '@/types';
import { Input } from '@/components/ui/Input';
import { RemoveButton } from '@/components/ui/RemoveButton';
import { Text } from '@/components/ui/Text';
import { Pill } from '@/components/ui/Pill';

interface Props {
  draft: CustomProgramDraft;
  onChange: (draft: CustomProgramDraft) => void;
  settings: Pick<AppSettings, 'customDays' | 'ownDays' | 'supersets' | 'customExercises' | 'programName'>;
  /** Show what keeps it from being saved (after a first try). */
  showProblem?: boolean;
  /** Under the sessions: where the exercises are chosen. */
  hint: string;
}

const inputStyle = {
  minHeight: 52,
  paddingHorizontal: 16,
  paddingVertical: 0,
  borderRadius: radius.row,
  borderWidth: border.base,
  borderColor: colors.outline,
  backgroundColor: colors.card,
  fontFamily: fonts.bold,
  fontSize: 17,
  color: colors.ink,
} as const;

/** "Mon programme": its name, where it starts from, and the name of each session. */
export function CustomProgramBuilder({ draft, onChange, settings, showProblem, hint }: Props) {
  const [from, setFrom] = useState<SplitId | 'none' | null>(null);
  const templates = SPLITS.filter((s) => s.id !== 'custom');
  const problem = draftProblem(draft);
  const setDay = (i: number, name: string) =>
    onChange({ ...draft, days: draft.days.map((d, j) => (j === i ? { ...d, name } : d)) });
  const start = (id: SplitId | 'none') => {
    setFrom(id);
    // A copy: its sessions and their exercises, each name to change as the user likes
    onChange({ ...draft, days: id === 'none' ? [{ name: '' }, { name: '' }] : draftFrom(id, settings) });
  };

  return (
    <View style={{ gap: space.sm }}>
      <Text size={17} weight="titleMedium">
        {t('program.custom.nameLabel')}
      </Text>
      <Input
        maxFontSizeMultiplier={1.5}
        value={draft.name}
        onChangeText={(name) => onChange({ ...draft, name })}
        placeholder={t('program.custom.namePlaceholder')}
        placeholderTextColor={colors.inkFaint}
        maxLength={NAME_MAX}
        autoCorrect={false}
        accessibilityLabel={t('program.custom.nameLabel')}
        style={inputStyle}
      />

      <Text size={17} weight="titleMedium" style={{ marginTop: space.md }}>
        {t('program.custom.from')}
      </Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Pill label={t('program.custom.fromNothing')} on={from === 'none'} onPress={() => start('none')} />
        {templates.map((s) => (
          <Pill key={s.id} label={s.title} on={from === s.id} onPress={() => start(s.id)} />
        ))}
      </View>
      <Text size={13} color={colors.inkMuted} style={{ lineHeight: 18 }}>
        {t('program.custom.fromHint')}
      </Text>

      <Text size={17} weight="titleMedium" style={{ marginTop: space.md }}>
        {t('program.custom.sessions')}
      </Text>
      {draft.days.map((day, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Input
              maxFontSizeMultiplier={1.5}
              value={day.name}
              onChangeText={(name) => setDay(i, name)}
              placeholder={t('program.custom.sessionPlaceholder', {
                example: [
                  t('program.custom.exampleA'),
                  t('program.custom.exampleChest'),
                  t('program.custom.exampleCardio'),
                ][i % 3]!,
              })}
              placeholderTextColor={colors.inkFaint}
              maxLength={NAME_MAX}
              autoCorrect={false}
              accessibilityLabel={t('program.custom.sessionA11y', { n: i + 1 })}
              style={inputStyle}
            />
            {day.source && day.source.split !== 'custom' ? (
              <Text size={12} color={colors.inkMuted} style={{ marginTop: 2, marginLeft: 4 }}>
                {t('program.custom.copied', { day: dayName(day.source.day) })}
              </Text>
            ) : null}
          </View>
          {draft.days.length > 1 ? (
            <RemoveButton
              onPress={() => onChange({ ...draft, days: draft.days.filter((_, j) => j !== i) })}
              accessibilityLabel={t('program.custom.removeA11y', { name: day.name || String(i + 1) })}
            />
          ) : null}
        </View>
      ))}
      {draft.days.length < SETTINGS_LIMITS.ownDays ? (
        <Pressable
          onPress={() => onChange({ ...draft, days: [...draft.days, { name: '' }] })}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 52,
            borderRadius: radius.row,
            borderWidth: border.base,
            borderStyle: 'dashed',
            borderColor: pressed ? colors.outlineStrong : colors.outlineSoft,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text size={16} weight="bold" color={colors.inkMuted}>
            {t('program.custom.addSession')}
          </Text>
        </Pressable>
      ) : null}
      {showProblem && problem ? (
        <Text size={14} weight="bold" color={colors.danger} accessibilityLiveRegion="polite">
          {t(`domain.customProgram.${problem}`, { max: SETTINGS_LIMITS.ownDays })}
        </Text>
      ) : null}
      <Text size={14} color={colors.inkMuted} style={{ lineHeight: 20 }}>
        {hint}
      </Text>
    </View>
  );
}
