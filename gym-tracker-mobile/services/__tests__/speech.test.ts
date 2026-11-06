import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Speech from 'expo-speech';
import { setLocale } from '@/i18n';
import { appIsSpeaking, ECHO_GUARD_MS, speak } from '@/services/speech';
import { hasClips, playClips, stopClips } from '@/services/voicePack';

const line = { text: 'Série 1. 60 kilos, 10 reps.', clips: ['set-1', 'kg-60', 'reps-10'] };

beforeEach(() => {
  jest.clearAllMocks();
  setLocale('fr');
});

describe('speech', () => {
  it('knows when the app is talking, and a moment after', () => {
    const start = 1_000_000;
    speak('Série 1.');
    expect(Speech.stop).toHaveBeenCalled();
    expect(stopClips).toHaveBeenCalled();
    expect(appIsSpeaking(start)).toBe(true);
    const options = jest.mocked(Speech.speak).mock.calls.at(-1)![1]!;
    const now = jest.spyOn(Date, 'now').mockReturnValue(start);
    options.onDone!();
    expect(appIsSpeaking(start + ECHO_GUARD_MS - 1)).toBe(true);
    expect(appIsSpeaking(start + ECHO_GUARD_MS)).toBe(false);
    now.mockRestore();
  });

  it('says a recorded line in the recorded voice, the note after it in the phone voice', () => {
    jest.mocked(hasClips).mockReturnValue(true);
    speak({ ...line, tail: 'Note : siège cran 4.' });
    expect(playClips).toHaveBeenCalledWith(line.clips, expect.any(Function));
    expect(Speech.speak).not.toHaveBeenCalled();
    jest.mocked(playClips).mock.calls.at(-1)![1]();
    expect(Speech.speak).toHaveBeenCalledWith('Note : siège cran 4.', expect.anything());
  });

  it("falls back to the phone voice for the whole line when a clip is missing", () => {
    jest.mocked(hasClips).mockReturnValue(false);
    speak(line);
    expect(playClips).not.toHaveBeenCalled();
    expect(Speech.speak).toHaveBeenCalledWith(line.text, expect.anything());
  });

  it('keeps the phone voice in English: the recorded voice is French', () => {
    jest.mocked(hasClips).mockReturnValue(true);
    setLocale('en');
    speak(line);
    expect(playClips).not.toHaveBeenCalled();
    expect(Speech.speak).toHaveBeenCalledWith(line.text, expect.anything());
  });
});
