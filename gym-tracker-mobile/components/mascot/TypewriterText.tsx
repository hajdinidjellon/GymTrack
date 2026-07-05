/**
 * TYPEWRITER — le texte de NEXUS s'écrit caractère par caractère
 * (MOBILE_PREMIUM.md règle 4 : 20-30ms/caractère, TOUJOURS skippable au tap).
 * Curseur bloc cyan visible pendant la frappe.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, type StyleProp, type TextStyle } from 'react-native';
import { hud } from '@/constants/theme';

export type TypewriterTextProps = {
  text: string;
  /** ms par caractère. */
  speed?: number;
  /** Délai avant le début de la frappe. */
  delay?: number;
  style?: StyleProp<TextStyle>;
  /** Appelé quand la frappe démarre (→ NEXUS passe en talking). */
  onStart?: () => void;
  /** Appelé quand le texte est complet (frappe finie ou skip). */
  onDone?: () => void;
};

export function TypewriterText({
  text,
  speed = 24,
  delay = 0,
  style,
  onStart,
  onDone,
}: TypewriterTextProps) {
  const [count, setCount] = useState(0);
  const doneRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const typing = count < text.length;

  useEffect(() => {
    setCount(0);
    doneRef.current = false;

    delayRef.current = setTimeout(() => {
      onStart?.();
      timerRef.current = setInterval(() => {
        setCount((prev) => {
          if (prev + 1 >= text.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (!doneRef.current) {
              doneRef.current = true;
              onDone?.();
            }
            return text.length;
          }
          return prev + 1;
        });
      }, speed);
    }, delay);

    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text]);

  const skip = () => {
    if (!typing) return;
    if (delayRef.current) clearTimeout(delayRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setCount(text.length);
    if (!doneRef.current) {
      doneRef.current = true;
      onDone?.();
    }
  };

  return (
    <Pressable onPress={skip} disabled={!typing}>
      <Text style={style}>
        {text.slice(0, count)}
        {typing ? <Text style={{ color: hud.cyan.bright }}>▍</Text> : null}
      </Text>
    </Pressable>
  );
}
