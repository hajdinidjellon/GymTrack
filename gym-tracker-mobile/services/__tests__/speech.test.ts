import { describe, expect, it, jest } from '@jest/globals';
import * as Speech from 'expo-speech';
import { appIsSpeaking, ECHO_GUARD_MS, speak } from '@/services/speech';

describe('speech', () => {
  it('knows when the app is talking, and a moment after', () => {
    const start = 1_000_000;
    speak('Série 1.');
    expect(Speech.stop).toHaveBeenCalled();
    expect(appIsSpeaking(start)).toBe(true);
    const options = jest.mocked(Speech.speak).mock.calls.at(-1)![1]!;
    const now = jest.spyOn(Date, 'now').mockReturnValue(start);
    options.onDone!();
    expect(appIsSpeaking(start + ECHO_GUARD_MS - 1)).toBe(true);
    expect(appIsSpeaking(start + ECHO_GUARD_MS)).toBe(false);
    now.mockRestore();
  });
});
