import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { border, colors, fonts, radius, space } from '@/constants/theme';
import { NAME_MAX } from '@/domain/programs';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';
import { t } from '@/i18n';

interface Props {
  initial?: string;
  submitLabel: string;
  /** The name typed; returns the error to show, or null once it is saved. */
  onSubmit: (name: string) => string | null;
  onCancel: () => void;
}

/** The name of a session the user adds or renames, checked when saved. */
export function DayNameForm({ initial = '', submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  return (
    <StickerCard style={{ gap: space.sm }}>
      <TextInput
        maxFontSizeMultiplier={1.5}
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        placeholder={t('program.days.namePlaceholder')}
        placeholderTextColor={colors.inkFaint}
        maxLength={NAME_MAX}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => setError(onSubmit(name))}
        accessibilityLabel={t('program.days.nameA11y')}
        style={{
          minHeight: 54,
          paddingHorizontal: 16,
          paddingVertical: 0,
          borderRadius: radius.row,
          borderWidth: border.base,
          borderColor: error ? colors.danger : colors.outline,
          backgroundColor: colors.card,
          fontFamily: fonts.bold,
          fontSize: 17,
          color: colors.ink,
        }}
      />
      {error ? (
        <Text size={14} weight="bold" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <View style={{ gap: space.sm }}>
        <StickerButton label={submitLabel} size="small" onPress={() => setError(onSubmit(name))} />
        <StickerButton label={t('common.cancel')} variant="secondary" size="small" onPress={onCancel} />
      </View>
    </StickerCard>
  );
}
