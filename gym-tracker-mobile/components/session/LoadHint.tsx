import React from 'react';
import { colors } from '@/constants/theme';
import { loadHint, type Loading } from '@/domain/loading';
import { useSettingsStore } from '@/stores/settingsStore';
import { Text } from '@/components/ui/Text';

/** The line under the weight: plates per side, "De chaque côté", "Par haltère". Nothing for a stack. */
export function LoadHint({ loading, weight }: { loading: Loading; weight: number }) {
  const barWeight = useSettingsStore((s) => s.settings.barWeight);
  const plates = useSettingsStore((s) => s.settings.plates);
  const hint = loadHint(loading, weight, { barWeight, plates });
  if (!hint) return null;
  return (
    <Text size={14} weight="bold" color={colors.inkMuted} align="center">
      {hint}
    </Text>
  );
}
