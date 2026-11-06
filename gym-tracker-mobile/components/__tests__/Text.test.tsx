import { describe, expect, it } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { maxScaleFor, Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';

describe('large text', () => {
  it('lets reading text grow the most, the big numbers a little', () => {
    expect(maxScaleFor(15)).toBe(1.7);
    expect(maxScaleFor(22)).toBe(1.35);
    expect(maxScaleFor(88)).toBe(1.2);
  });

  it('caps every text by its size, unless the screen asks for less', async () => {
    await render(
      <>
        <Text size={14}>Dernière fois</Text>
        <Text size={88}>1:30</Text>
        <Text size={13} maxFontSizeMultiplier={1.3}>
          3
        </Text>
      </>,
    );
    expect(screen.getByText('Dernière fois').props.maxFontSizeMultiplier).toBe(1.7);
    expect(screen.getByText('1:30').props.maxFontSizeMultiplier).toBe(1.2);
    expect(screen.getByText('3').props.maxFontSizeMultiplier).toBe(1.3);
  });

  it('grows the buttons instead of cutting their label', async () => {
    await render(<StickerButton label="Valider" size="xl" testID="b" onPress={() => undefined} />);
    expect(screen.getByTestId('b')).toHaveStyle({ minHeight: 76 });
    expect(screen.getByTestId('b')).not.toHaveStyle({ height: 76 });
  });
});
