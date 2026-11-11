import { describe, expect, it } from '@jest/globals';
import { displayName, isEvening } from '@/domain/greeting';

describe('greeting', () => {
  it.each([
    [4, true],
    [5, false],
    [12, false],
    [17, false],
    [18, true],
    [23, true],
  ])('%i h → evening %s', (hour, evening) => {
    expect(isEvening(hour)).toBe(evening);
  });

  it('shows a username as a first name', () => {
    expect(displayName('djellon')).toBe('Djellon');
    expect(displayName(' éva ')).toBe('Éva');
    expect(displayName('')).toBeNull();
    expect(displayName(null)).toBeNull();
  });
});
