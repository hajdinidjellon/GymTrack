import React from 'react';
import { colors } from '@/constants/theme';
import { loadHint, type Loading } from '@/domain/loading';
import { useGym } from '@/hooks/useGym';
import { Text } from '@/components/ui/Text';

/** The line under the weight: plates per side, "De chaque côté", "Par haltère". Nothing for a stack. */
export function LoadHint({ loading, weight }: { loading: Loading; weight: number }) {
  const hint = loadHint(loading, weight, useGym());
  if (!hint) return null;
  return (
    <Text size={14} weight="bold" color={colors.inkMuted} align="center">
      {hint}
    </Text>
  );
}
