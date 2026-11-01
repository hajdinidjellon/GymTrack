import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AppState } from 'react-native';

const mockPlayer = { play: jest.fn(), seekTo: jest.fn((_seconds: number) => Promise.resolve()) };
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => mockPlayer),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));
jest.unmock('@/services/sound');

// eslint-disable-next-line import/first
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
// eslint-disable-next-line import/first
import { playRestBell } from '@/services/sound';

describe('playRestBell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  });

  it('rings from the start, even on silent, over the music', () => {
    // Les erreurs de l'audio sont avalées
    jest.mocked(setAudioModeAsync).mockRejectedValueOnce(new Error('busy'));
    mockPlayer.seekTo.mockRejectedValueOnce(new Error('not loaded'));
    playRestBell();
    playRestBell();
    expect(setAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(0);
    expect(mockPlayer.play).toHaveBeenCalledTimes(2);
  });

  it('leaves the background to the notification', () => {
    Object.defineProperty(AppState, 'currentState', { value: 'background', configurable: true });
    playRestBell();
    expect(mockPlayer.play).not.toHaveBeenCalled();
  });

  it('never crashes the session', () => {
    mockPlayer.play.mockImplementationOnce(() => {
      throw new Error('no audio');
    });
    expect(() => playRestBell()).not.toThrow();
  });
});
