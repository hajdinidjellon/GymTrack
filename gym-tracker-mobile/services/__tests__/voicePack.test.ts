import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type Listener = (status: { didJustFinish: boolean }) => void;
let mockListener: Listener = () => undefined;
const mockPlayer = {
  replace: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  addListener: jest.fn((_event: string, listener: Listener) => {
    mockListener = listener;
  }),
};
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => mockPlayer),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/assets/voice/fr/clips', () => ({ VOICE_CLIPS: { a: 11, b: 22 } }));
jest.unmock('@/services/voicePack');

// eslint-disable-next-line import/first
import { setAudioModeAsync } from 'expo-audio';
// eslint-disable-next-line import/first
import { hasClips, playClips, stopClips } from '@/services/voicePack';

const finish = () => mockListener({ didJustFinish: true });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('voice pack', () => {
  it('knows which lines it can say', () => {
    expect(hasClips(['a', 'b'])).toBe(true);
    expect(hasClips(['a', 'zzz'])).toBe(false);
    expect(hasClips([])).toBe(false);
  });

  it('plays the clips one after the other, then says it is done', () => {
    const done = jest.fn();
    playClips(['a', 'b'], done);
    expect(setAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
    expect(mockPlayer.replace).toHaveBeenLastCalledWith(11);
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    finish();
    expect(mockPlayer.replace).toHaveBeenLastCalledWith(22);
    expect(done).not.toHaveBeenCalled();
    finish();
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('cuts off a line, and drops what was to follow it', () => {
    const done = jest.fn();
    playClips(['a', 'b'], done);
    stopClips();
    expect(mockPlayer.pause).toHaveBeenCalled();
    finish();
    expect(done).not.toHaveBeenCalled();
    expect(mockPlayer.replace).toHaveBeenCalledTimes(1);
  });

  it('gives up quietly when a clip cannot play', () => {
    const done = jest.fn();
    mockPlayer.play.mockImplementationOnce(() => {
      throw new Error('no audio');
    });
    playClips(['a', 'b'], done);
    expect(done).toHaveBeenCalledTimes(1);
  });
});
