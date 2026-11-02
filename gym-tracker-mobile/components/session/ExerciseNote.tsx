import React, { useState } from 'react';
import { Pressable, TextInput } from 'react-native';
import { border, colors, fonts, radius } from '@/constants/theme';
import { NOTE_MAX_LENGTH } from '@/domain/notes';
import { useSettingsStore } from '@/stores/settingsStore';
import { Text } from '@/components/ui/Text';
import { exerciseName as displayName, t } from '@/i18n';

/**
 * The user's own note on an exercise ("siège cran 4"), shown every time it
 * comes back. A tap edits it in place; emptied, it is removed.
 */
export function ExerciseNote({ exerciseName }: { exerciseName: string }) {
  const note = useSettingsStore((s) => s.settings.exerciseNotes[exerciseName]);
  const setExerciseNote = useSettingsStore((s) => s.setExerciseNote);
  const [draft, setDraft] = useState<string | null>(null);

  if (draft !== null) {
    return (
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onBlur={() => {
          setExerciseNote(exerciseName, draft);
          setDraft(null);
        }}
        autoFocus
        maxLength={NOTE_MAX_LENGTH}
        returnKeyType="done"
        placeholder={t('session.note.placeholder')}
        placeholderTextColor={colors.inkFaint}
        accessibilityLabel={t('session.note.inputA11y', { name: displayName(exerciseName) })}
        style={{
          minHeight: 44,
          paddingHorizontal: 12,
          borderRadius: radius.input,
          borderWidth: border.base,
          borderColor: colors.outline,
          backgroundColor: colors.card,
          fontFamily: fonts.semibold,
          fontSize: 15,
          color: colors.ink,
        }}
      />
    );
  }

  return (
    <Pressable
      onPress={() => setDraft(note ?? '')}
      accessibilityRole="button"
      accessibilityLabel={note ? t('session.note.editA11y', { note }) : t('session.note.addA11y')}
      hitSlop={8}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: 12,
        justifyContent: 'center',
        borderRadius: radius.input,
        borderWidth: border.base,
        borderStyle: note ? 'solid' : 'dashed',
        borderColor: note || pressed ? colors.outlineStrong : colors.line,
        backgroundColor: note ? colors.card : 'transparent',
      })}
    >
      <Text size={15} weight={note ? 'bold' : 'semibold'} color={note ? colors.ink : colors.inkMuted} numberOfLines={2}>
        {note ?? t('session.note.add')}
      </Text>
    </Pressable>
  );
}
