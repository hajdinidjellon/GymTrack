import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AppState, Vibration } from 'react-native';

const mockPlayer = {
  play: jest.fn(),
  pause: jest.fn(),
  loop: false,
  seekTo: jest.fn((_seconds: number) => Promise.resolve()),
};
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => mockPlayer),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));
jest.unmock('@/services/sound');

// eslint-disable-next-line import/first
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
// eslint-disable-next-line import/first
import { playRestBell, startRestAlarm, stopRestAlarm } from '@/services/sound';

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

describe('the rest alarm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlayer.loop = false;
    Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  });

  it('vibrates and rings in a loop until stopped, like a timer', () => {
    const vibrate = jest.spyOn(Vibration, 'vibrate');
    const cancel = jest.spyOn(Vibration, 'cancel');
    startRestAlarm(true);
    expect(vibrate).toHaveBeenCalledWith([0, 500, 400], true);
    expect(mockPlayer.loop).toBe(true);
    expect(mockPlayer.play).toHaveBeenCalled();
    stopRestAlarm();
    expect(cancel).toHaveBeenCalled();
    expect(mockPlayer.loop).toBe(false);
    expect(mockPlayer.pause).toHaveBeenCalled();
  });

  it('only vibrates with the bell off', () => {
    const vibrate = jest.spyOn(Vibration, 'vibrate');
    startRestAlarm(false);
    expect(vibrate).toHaveBeenCalled();
    expect(mockPlayer.play).not.toHaveBeenCalled();
  });

  it('stays still in the background', () => {
    Object.defineProperty(AppState, 'currentState', { value: 'background', configurable: true });
    const vibrate = jest.spyOn(Vibration, 'vibrate');
    startRestAlarm(true);
    expect(vibrate).not.toHaveBeenCalled();
    expect(mockPlayer.play).not.toHaveBeenCalled();
  });

  it('never crashes the session', () => {
    jest.spyOn(Vibration, 'vibrate').mockImplementationOnce(() => {
      throw new Error('no motor');
    });
    jest.spyOn(Vibration, 'cancel').mockImplementationOnce(() => {
      throw new Error('no motor');
    });
    mockPlayer.play.mockImplementationOnce(() => {
      throw new Error('no audio');
    });
    mockPlayer.pause.mockImplementationOnce(() => {
      throw new Error('no audio');
    });
    expect(() => startRestAlarm(true)).not.toThrow();
    expect(() => stopRestAlarm()).not.toThrow();
  });
});
