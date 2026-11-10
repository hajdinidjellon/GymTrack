import React from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

const num = (v: unknown): number => (typeof v === 'number' ? v : 0);

/**
 * A one-line TextInput whose placeholder we draw ourselves, centred on the field's height. iOS
 * draws its own lower than the typed text with our fonts, half cut off by the border. The native
 * one stays, see-through: it still sizes the field and is what tests and screen readers find.
 */
export function Input({
  placeholder,
  placeholderTextColor,
  style,
  value,
  maxFontSizeMultiplier,
  ...rest
}: TextInputProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const border = num(flat.borderWidth);
  const left = num(flat.paddingLeft ?? flat.paddingHorizontal ?? flat.padding) + num(flat.borderLeftWidth ?? border);
  const right = num(flat.paddingRight ?? flat.paddingHorizontal ?? flat.padding) + num(flat.borderRightWidth ?? border);
  return (
    <View>
      <TextInput
        {...rest}
        value={value}
        style={style}
        placeholder={placeholder}
        placeholderTextColor="transparent"
        maxFontSizeMultiplier={maxFontSizeMultiplier}
      />
      {!value && placeholder ? (
        <View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={{ position: 'absolute', top: 0, bottom: 0, left, right, justifyContent: 'center' }}
        >
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            style={{ fontFamily: flat.fontFamily, fontSize: flat.fontSize, color: placeholderTextColor }}
          >
            {placeholder}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
