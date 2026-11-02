import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type Listener = (event: unknown) => void;
const mockListeners: Record<string, Listener> = {};
const mockRecognition = {
  isRecognitionAvailable: jest.fn(() => true),
  supportsOnDeviceRecognition: jest.fn(() => true),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  start: jest.fn(),
  abort: jest.fn(),
  addListener: jest.fn((name: string, fn: Listener) => {
    mockListeners[name] = fn;
    return { remove: jest.fn() };
  }),
};
jest.mock('expo-speech-recognition', () => ({ ExpoSpeechRecognitionModule: mockRecognition }));

// eslint-disable-next-line import/first
import { requestVoicePermission, startListening, voiceInputAvailable } from '@/services/voiceInput';

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

describe('voiceInput', () => {
  it('says when the phone can listen, and asks for the permission', async () => {
    expect(voiceInputAvailable()).toBe(true);
    mockRecognition.isRecognitionAvailable.mockImplementationOnce(() => {
      throw new Error('no service');
    });
    expect(voiceInputAvailable()).toBe(false);
    await expect(requestVoicePermission()).resolves.toBe(true);
    mockRecognition.requestPermissionsAsync.mockRejectedValueOnce(new Error('denied'));
    await expect(requestVoicePermission()).resolves.toBe(false);
  });

  it('listens on the phone, hands over final phrases, and starts again after a stop', () => {
    const heard: string[] = [];
    const stop = startListening('fr-FR', ['fait'], (text) => heard.push(text));
    expect(mockRecognition.start).toHaveBeenCalledWith(
      expect.objectContaining({
        lang: 'fr-FR',
        continuous: true,
        requiresOnDeviceRecognition: true,
        contextualStrings: ['fait'],
      }),
    );
    mockListeners.result!({ isFinal: false, results: [{ transcript: 'fa' }] });
    mockListeners.result!({ isFinal: true, results: [{ transcript: 'fait' }] });
    expect(heard).toEqual(['fait']);
    mockListeners.end!(null);
    jest.advanceTimersByTime(400);
    expect(mockRecognition.start).toHaveBeenCalledTimes(2);
    mockListeners.error!({ error: 'no-speech' });
    stop();
    expect(mockRecognition.abort).toHaveBeenCalled();
    mockListeners.end!(null);
    jest.advanceTimersByTime(400);
    expect(mockRecognition.start).toHaveBeenCalledTimes(2);
  });

  it('survives a start that fails', () => {
    mockRecognition.start.mockImplementationOnce(() => {
      throw new Error('busy');
    });
    mockRecognition.abort.mockImplementationOnce(() => {
      throw new Error('not started');
    });
    const stop = startListening('fr-FR', [], () => undefined);
    expect(() => stop()).not.toThrow();
  });
});
