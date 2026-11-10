import React from 'react';
import { View } from 'react-native';
import { Input } from './Input';
import { border, colors, fonts, hardShadow, radius } from '@/constants/theme';
import { Text } from '@/components/ui/Text';

export type FieldKind = 'username' | 'password' | 'newPassword' | 'email' | 'code';

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  kind: FieldKind;
  /** Under the label: why the field is asked. */
  hint?: string;
}

const CONTENT_TYPE = {
  username: 'username',
  password: 'password',
  newPassword: 'newPassword',
  email: 'emailAddress',
  code: 'oneTimeCode',
} as const;

/** A labelled text input of the account screens. */
export function TextField({ label, value, onChangeText, placeholder, kind, hint }: Props) {
  return (
    <View style={{ gap: 8 }}>
      <Text size={15} weight="bold">
        {label}
      </Text>
      {hint ? (
        <Text size={14} color={colors.inkMuted} style={{ lineHeight: 19 }}>
          {hint}
        </Text>
      ) : null}
      {/* L'ombre dure est portée par le cadre : TextInput ne la prend pas */}
      <View style={{ borderRadius: radius.input, ...hardShadow(2) }}>
        <Input
          maxFontSizeMultiplier={1.5}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          accessibilityLabel={label}
          autoCapitalize={kind === 'code' ? 'characters' : 'none'}
          autoCorrect={false}
          keyboardType={kind === 'email' ? 'email-address' : 'default'}
          textContentType={CONTENT_TYPE[kind]}
          secureTextEntry={kind === 'password' || kind === 'newPassword'}
          style={{
            minHeight: 60,
            borderRadius: radius.input,
            borderWidth: border.base,
            borderColor: colors.outline,
            backgroundColor: colors.card,
            color: colors.ink,
            fontFamily: fonts.regular,
            fontSize: 19,
            paddingHorizontal: 20,
          }}
        />
      </View>
    </View>
  );
}
