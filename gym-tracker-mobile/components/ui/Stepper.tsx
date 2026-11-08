import React, { useState } from 'react';
import { Keyboard, Pressable, Text as RNText, TextInput, View } from 'react-native';
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

const NUMBER_STYLE = { fontFamily: fonts.black, fontSize: 60, lineHeight: 70 } as const;

/** A huge number with arrows each side. Arrows nudge it by one step, a tap on the number opens the keyboard. */
export function Stepper({ value, unit, onMinus, onPlus, minusLabel, plusLabel, onChange, integer, inputLabel }: Props) {
  // Texte en cours de frappe : "62," n'est pas encore un nombre, on l'affiche tel quel
  const [draft, setDraft] = useState<string | null>(null);
  // iOS sizes a TextInput with the system font, not Fredoka: "37,5" lost its 5.
  // The same text, drawn hidden in the same font, gives the real width.
  const [width, setWidth] = useState(0);
  const shown = (draft ?? value) || value;

  const typing = draft !== null;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Arrow onPress={onMinus} label={minusLabel}>
          <ChevronLeft size={24} />
        </Arrow>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
          <RNText
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            maxFontSizeMultiplier={1.2}
            onLayout={(e) => setWidth(Math.ceil(e.nativeEvent.layout.width))}
            style={[NUMBER_STYLE, { position: 'absolute', opacity: 0 }]}
            testID="stepper-measure"
          >
            {shown}
          </RNText>
          <TextInput
            maxFontSizeMultiplier={1.2}
            value={draft ?? value}
            onFocus={() => setDraft('')}
            onEndEditing={() => setDraft(null)}
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
            selectTextOnFocus
            maxLength={6}
            accessibilityLabel={inputLabel}
            accessibilityHint={t('ui.stepper.typeHint')}
            style={{
              ...NUMBER_STYLE,
              color: colors.ink,
              padding: 0,
              minWidth: 80,
              // A little room for the cursor
              width: width ? width + 8 : undefined,
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
      </View>
      {/* The number pad has no "OK" key on iPhone: this one closes it, so Valider shows again */}
      {typing ? (
        <Pressable
          onPress={() => Keyboard.dismiss()}
          accessibilityRole="button"
          hitSlop={10}
          style={({ pressed }) => ({
            alignSelf: 'center',
            marginTop: 6,
            paddingHorizontal: 22,
            minHeight: 44,
            borderRadius: 20,
            borderWidth: border.base,
            borderColor: colors.outline,
            backgroundColor: pressed ? colors.coralSoft : colors.card,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text size={16} weight="black">
            {t('ui.stepper.done')}
          </Text>
        </Pressable>
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
        borderColor: colors.outline,
        backgroundColor: colors.card,
        ...(pressed ? {} : hardShadow(2)),
        transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : [],
      })}
    >
      {children}
    </Pressable>
  );
}
