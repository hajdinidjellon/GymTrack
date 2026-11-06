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

/** WCAG contrast ratio of two #RRGGBB colours, from 1 to 21. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, bl] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe('contrast', () => {
  it('measures like WCAG', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrast('#FFFFFF', '#FFFFFF')).toBe(1);
  });

  for (const [mode, p] of [
    ['light', lightPalette],
    ['dark', darkPalette],
  ] as const) {
    it(`keeps every text readable (4.5:1) in ${mode} mode`, () => {
      const text: (keyof typeof p)[] = ['ink', 'inkMuted', 'inkFaint', 'successText', 'danger'];
      for (const fg of text)
        for (const bg of ['paper', 'card', 'inset'] as const) {
          expect([fg, bg, contrast(p[fg], p[bg]) >= 4.5]).toEqual([fg, bg, true]);
        }
      const filled: [keyof typeof p, keyof typeof p][] = [
        ['ink', 'coralSoft'],
        ['inkMuted', 'coralSoft'],
        ['inkMuted', 'successSoft'],
        ['successText', 'successSoft'],
        ['onCoral', 'coral'],
        ['onSun', 'sun'],
        ['onSunPanel', 'sunPanel'],
        ['onDayToday', 'dayToday'],
      ];
      for (const [fg, bg] of filled) expect([fg, bg, contrast(p[fg], p[bg]) >= 4.5]).toEqual([fg, bg, true]);
    });

    it(`outlines what can be tapped at 3:1 at least in ${mode} mode`, () => {
      // At night the stickers keep their black outline: they stand out by their fill and their ledge
      const borders =
        mode === 'light' ? (['outline', 'outlineStrong', 'outlineSoft'] as const) : (['outlineSoft'] as const);
      for (const border of borders)
        for (const bg of ['paper', 'card', 'inset'] as const) {
          expect([border, bg, contrast(p[border], p[bg]) >= 3]).toEqual([border, bg, true]);
        }
    });
  }
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

  it('shows what is selected on its own tint, never the colour of a card', () => {
    for (const palette of [lightPalette, darkPalette]) {
      expect(palette.coralSoft).not.toBe(palette.card);
      expect(palette.coralSoft).not.toBe(palette.inset);
    }
  });

  it('outlines every sticker in black, like by day', async () => {
    setColorScheme('dark');
    await render(
      <StickerCard testID="card">
        <StickerButton label="Valider" onPress={() => undefined} />
      </StickerCard>,
    );
    expect(screen.getByTestId('card')).toHaveStyle({ borderColor: darkPalette.frame });
    setColorScheme('light');
    await render(<StickerCard testID="light-card" />);
    expect(screen.getByTestId('light-card')).toHaveStyle({ borderColor: lightPalette.ink });
  });
});
