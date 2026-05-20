import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  Pressable,
  type TextInputProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function Input({ label, error, hint, leftIcon, rightIcon, onRightIconPress, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? '#ef4444' : focused ? '#7c3aed' : 'rgba(255,255,255,0.10)';

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
          {label}
        </Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 16, gap: 8, borderWidth: 1, borderColor }}>
        {leftIcon && <View style={{ opacity: 0.6 }}>{leftIcon}</View>}
        <TextInput
          style={{ flex: 1, paddingVertical: 14, fontSize: 16, fontWeight: '500', color: colors.text.primary }}
          placeholderTextColor={colors.text.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={colors.brand.primary}
          {...rest}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress}>
            <View style={{ opacity: 0.6 }}>{rightIcon}</View>
          </Pressable>
        )}
      </View>
      {error && <Text style={{ fontSize: 12, color: colors.status.danger }}>{error}</Text>}
      {hint && !error && <Text style={{ fontSize: 12, color: colors.text.muted }}>{hint}</Text>}
    </View>
  );
}

// ── Stepper numérique — poids & reps ─────────────────────────────

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  large?: boolean;
}

export function NumericInput({ value, onChange, min = 0, max = 999, step = 1, suffix, large = false }: NumericInputProps) {
  const clamp                   = (v: number) => Math.min(Math.max(v, min), max);
  const [editing, setEditing]   = useState(false);
  const [editText, setEditText] = useState('');
  const editTextRef             = React.useRef('');

  const fmt = (v: number) => Number.isInteger(v) ? String(v) : v.toFixed(1);

  const startEdit = () => {
    const initial = fmt(value);
    editTextRef.current = initial;
    setEditText(initial);
    setEditing(true);
  };
  const commit = () => {
    const n = parseFloat(editTextRef.current.replace(',', '.'));
    onChange(isNaN(n) ? min : clamp(n));
    setEditing(false);
  };
  const handleButton = (newVal: number) => { setEditing(false); onChange(clamp(newVal)); };

  if (large) {
    return (
      <View style={{ alignItems: 'center', gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={() => handleButton(value - step)}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 20, color: colors.text.secondary, fontWeight: '700', lineHeight: 22 }}>−</Text>
          </Pressable>

          {editing ? (
            <TextInput
              autoFocus
              style={{ fontSize: 40, fontWeight: '900', color: colors.text.primary, textAlign: 'center', minWidth: 80 }}
              value={editText}
              onChangeText={(t) => { editTextRef.current = t; setEditText(t); }}
              onBlur={commit}
              onSubmitEditing={commit}
              keyboardType="numeric"
              selectTextOnFocus
            />
          ) : (
            <Pressable onPress={startEdit} style={{ minWidth: 80, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, fontWeight: '900', color: colors.text.primary, textAlign: 'center' }}>
                {fmt(value)}
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => handleButton(value + step)}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 20, color: colors.text.secondary, fontWeight: '700', lineHeight: 22 }}>+</Text>
          </Pressable>
        </View>
        {suffix && (
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
            {suffix}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
      <Pressable
        onPress={() => handleButton(value - step)}
        style={{ paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontSize: 16, color: colors.text.secondary, fontWeight: '700' }}>−</Text>
      </Pressable>

      {editing ? (
        <TextInput
          autoFocus
          style={{ fontSize: 16, fontWeight: '700', color: colors.text.primary, textAlign: 'center', minWidth: 44 }}
          value={editText}
          onChangeText={(t) => { editTextRef.current = t; setEditText(t); }}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType="numeric"
          selectTextOnFocus
        />
      ) : (
        <Pressable onPress={startEdit} style={{ minWidth: 44, alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text.primary, textAlign: 'center' }}>
            {fmt(value)}
          </Text>
        </Pressable>
      )}

      {suffix && (
        <Text style={{ fontSize: 11, color: colors.text.muted, paddingRight: 4 }}>{suffix}</Text>
      )}

      <Pressable
        onPress={() => handleButton(value + step)}
        style={{ paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontSize: 16, color: colors.text.secondary, fontWeight: '700' }}>+</Text>
      </Pressable>
    </View>
  );
}
