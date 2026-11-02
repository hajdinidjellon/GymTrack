import React, { useId, useState } from 'react';
import { InputAccessoryView, Keyboard, Platform, Pressable, TextInput, View } from 'react-native';
import { border, colors, fonts, hardShadow } from '@/constants/theme';
import { parseAmount } from '@/domain/format';
import { ChevronLeft, ChevronRight } from './icons';
import { Text } from './Text';
import { t } from '@/i18n';

interface Props {
  value: string;
  unit: string;
  onMinus: () => void;
  onPlus: () => void;
  minusLabel: string;
  plusLabel: string;
  /** Typed on the keyboard. Called as soon as the text is a valid number. */
  onChange: (value: number) => void;
  /** Reps are whole numbers: no decimal key. */
  integer?: boolean;
  inputLabel: string;
}

/** A huge number with arrows each side. Arrows nudge it by one step, a tap on the number opens the keyboard. */
export function Stepper({ value, unit, onMinus, onPlus, minusLabel, plusLabel, onChange, integer, inputLabel }: Props) {
  // Texte en cours de frappe : "62," n'est pas encore un nombre, on l'affiche tel quel
  const [draft, setDraft] = useState<string | null>(null);
  // The iPhone number pad has no "OK" key: a bar above it closes it, so Valider shows again
  const accessoryId = `stepper-${useId()}`;
  const ios = Platform.OS === 'ios';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Arrow onPress={onMinus} label={minusLabel}>
        <ChevronLeft size={24} />
      </Arrow>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
        <TextInput
          value={draft ?? value}
          onFocus={() => setDraft('')}
          onBlur={() => setDraft(null)}
          onChangeText={(text) => {
            setDraft(text);
            const n = parseAmount(text, integer);
            if (n !== null) onChange(n);
          }}
          placeholder={value}
          placeholderTextColor={colors.inkFaint}
          keyboardType={integer ? 'number-pad' : 'decimal-pad'}
          returnKeyType="done"
          inputAccessoryViewID={ios ? accessoryId : undefined}
          selectTextOnFocus
          maxLength={6}
          accessibilityLabel={inputLabel}
          accessibilityHint={t('ui.stepper.typeHint')}
          style={{
            fontFamily: fonts.black,
            fontSize: 60,
            lineHeight: 70,
            color: colors.ink,
            padding: 0,
            minWidth: 80,
            textAlign: 'center',
          }}
        />
        <Text size={18} weight="titleMedium" color={colors.inkMuted}>
          {unit}
        </Text>
      </View>
      <Arrow onPress={onPlus} label={plusLabel}>
        <ChevronRight size={24} />
      </Arrow>
      {ios ? (
        <InputAccessoryView nativeID={accessoryId}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderTopWidth: border.base,
              borderTopColor: colors.ink,
              backgroundColor: colors.paper,
            }}
          >
            <Pressable onPress={() => Keyboard.dismiss()} accessibilityRole="button" hitSlop={10}>
              <Text size={18} weight="black">
                {t('ui.stepper.done')}
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
}

function Arrow({ onPress, label, children }: { onPress: () => void; label: string; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: border.base,
        borderColor: colors.ink,
        backgroundColor: colors.card,
        ...(pressed ? {} : hardShadow(2)),
        transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : [],
      })}
    >
      {children}
    </Pressable>
  );
}
