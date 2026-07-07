/**
 * Écran d'erreur générique — utilisé par les ErrorBoundary d'Expo Router
 * et par l'écran d'échec de boot. Volontairement minimaliste : il doit
 * pouvoir se rendre même si le reste de l'app (stores, fonts) est en panne.
 * N'affiche JAMAIS le message technique de l'erreur à l'utilisateur.
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors, spacing, radius } from '@/constants/theme';
import { tStatic } from '@/lib/i18n';

interface ErrorFallbackProps {
  error?: Error;
  /** Contexte pour le log ('[boundary:root]', '[boot]'…) */
  context?: string;
  /** Clés i18n — par défaut l'erreur générique */
  titleKey?: 'error.generic.title' | 'error.boot.title';
  messageKey?: 'error.generic.message' | 'error.boot.message';
  retry: () => void | Promise<void>;
}

export function ErrorFallback({
  error,
  context = '[boundary]',
  titleKey = 'error.generic.title',
  messageKey = 'error.generic.message',
  retry,
}: ErrorFallbackProps) {
  useEffect(() => {
    if (error) console.error(`${context} render error:`, error);
    // TODO Sentry (roadmap I4) : captureException(error, { tags: { context } })
  }, [error, context]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.primary,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.md,
      }}
    >
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 20,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        {tStatic(titleKey)}
      </Text>
      <Text
        style={{
          color: colors.text.secondary,
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        {tStatic(messageKey)}
      </Text>
      <Pressable
        onPress={() => {
          void retry();
        }}
        style={({ pressed }) => ({
          marginTop: spacing.lg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing['3xl'],
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.brand.primary,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: colors.brand.primary, fontSize: 15, fontWeight: '600' }}>
          {tStatic('error.generic.retry')}
        </Text>
      </Pressable>
    </View>
  );
}
