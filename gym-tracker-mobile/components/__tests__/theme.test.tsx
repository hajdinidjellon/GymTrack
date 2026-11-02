import { afterEach, describe, expect, it } from '@jest/globals';
import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import {
  colors,
  darkPalette,
  getColorScheme,
  hardShadow,
  lightPalette,
  plateInk,
  setColorScheme,
  text,
} from '@/constants/theme';
import { resolveScheme, useAppearance } from '@/hooks/useLocale';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { Chip } from '@/components/ui/Chip';
import { StickerCard } from '@/components/ui/StickerCard';

afterEach(() => {
  setColorScheme('light');
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
});

describe('dark mode', () => {
  it('switches every colour at once', () => {
    expect(colors.paper).toBe(lightPalette.paper);
    setColorScheme('dark');
    expect(getColorScheme()).toBe('dark');
    expect(colors.paper).toBe(darkPalette.paper);
    expect(colors.ink).toBe(darkPalette.ink);
    expect(hardShadow(5).boxShadow).toContain(darkPalette.shadow);
    expect(text.button.color).toBe(darkPalette.ink);
    expect({ ...colors }).toEqual(darkPalette);
  });

  it('keeps the plates readable whatever the mode', () => {
    setColorScheme('dark');
    expect(plateInk(20)).toBe('#FFFFFF');
    expect(plateInk(15)).toBe(lightPalette.ink);
  });

  it('follows the phone when set to auto', () => {
    expect(resolveScheme('auto', 'dark')).toBe('dark');
    expect(resolveScheme('auto', null)).toBe('light');
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
  });

  it('applies the choice before the components read their colours', async () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, theme: 'dark' } });
    function Probe() {
      const scheme = useAppearance();
      return (
        <StickerCard>
          <Text>{scheme}</Text>
          <Chip label="+2,5 kg" tone="sun" />
        </StickerCard>
      );
    }
    await render(<Probe />);
    expect(screen.getByText('dark')).toBeOnTheScreen();
    expect(colors.card).toBe(darkPalette.card);
  });
});
