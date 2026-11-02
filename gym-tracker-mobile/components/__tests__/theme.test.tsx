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
  pressOffset,
  setColorScheme,
  text,
} from '@/constants/theme';
import { resolveScheme, useAppearance } from '@/hooks/useLocale';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { Chip } from '@/components/ui/Chip';
import { StickerCard } from '@/components/ui/StickerCard';
import { StickerButton } from '@/components/ui/StickerButton';
import { Check } from '@/components/ui/icons';

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

describe('Bleu nuit at night', () => {
  it('sits the stickers on a ledge and sinks them straight down', () => {
    expect(hardShadow(5).boxShadow).toBe(`5px 5px 0px ${lightPalette.shadow}`);
    expect(pressOffset(4)).toEqual({ translateX: 4, translateY: 4 });
    setColorScheme('dark');
    expect(hardShadow(5).boxShadow).toBe(`0px 4px 0px ${darkPalette.shadow}`);
    expect(hardShadow(2, colors.coralShadow).boxShadow).toBe(`0px 2px 0px ${darkPalette.coralShadow}`);
    expect(pressOffset(4)).toEqual({ translateX: 0, translateY: 4 });
  });

  it('turns the main action sky blue with dark text, no orange', async () => {
    setColorScheme('dark');
    expect(colors.coral).toBe('#5BC8F5');
    await render(<StickerButton label="Valider" icon={<Check size={20} />} onPress={() => undefined} />);
    expect(screen.getByText('Valider')).toHaveStyle({ color: darkPalette.onCoral });
  });

  it('outlines only what can be tapped', async () => {
    setColorScheme('dark');
    await render(
      <StickerCard testID="card">
        <StickerButton label="Valider" onPress={() => undefined} />
      </StickerCard>,
    );
    expect(screen.getByTestId('card')).toHaveStyle({ borderColor: 'transparent' });
    setColorScheme('light');
    await render(<StickerCard testID="light-card" />);
    expect(screen.getByTestId('light-card')).toHaveStyle({ borderColor: lightPalette.ink });
  });
});
