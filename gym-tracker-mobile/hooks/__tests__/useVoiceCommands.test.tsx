import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { appIsSpeaking } from '@/services/speech';
import { startListening, voiceInputAvailable } from '@/services/voiceInput';
import { useSessionStore } from '@/stores/sessionStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';

jest.mock('@/services/voiceInput', () => ({ voiceInputAvailable: jest.fn(() => true), startListening: jest.fn() }));
jest.mock('@/services/speech', () => ({ speak: jest.fn(), appIsSpeaking: jest.fn(() => false) }));

const stop = jest.fn();
const listen = jest.mocked(startListening);

function Probe({ active }: { active: boolean }) {
  return <Text>{useVoiceCommands(active) ? 'on' : 'off'}</Text>;
}

const heard = (text: string) => listen.mock.calls.at(-1)![2](text);

beforeEach(() => {
  jest.clearAllMocks();
  listen.mockReturnValue(stop);
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, voiceCommands: true, warmups: false } });
  useSessionStore.getState().startSession('Push', [
    {
      id: 'curl',
      name: 'Curl',
      category: 'isolation',
      muscleGroups: ['biceps'],
      equipment: 'dumbbell',
      needsWeight: false,
      sets: [{ weight: 12, reps: 10, setType: 'normal', restTime: 60, completed: false }],
    },
  ]);
});

describe('useVoiceCommands', () => {
  it('listens while active and turned on, and acts on a command', async () => {
    const view = await render(<Probe active />);
    expect(screen.getByText('on')).toBeOnTheScreen();
    expect(listen).toHaveBeenCalledWith('fr-FR', expect.arrayContaining(['fait']), expect.any(Function));
    heard('bonjour');
    jest.mocked(appIsSpeaking).mockReturnValueOnce(true);
    heard('fait');
    expect(useSessionStore.getState().activeSession!.exercises[0]!.sets[0]!.completed).toBe(false);
    heard('9');
    expect(useSessionStore.getState().activeSession).toBeTruthy();
    await view.unmount();
    expect(stop).toHaveBeenCalled();
  });

  it('stays closed when turned off, inactive, or not available', async () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, voiceCommands: false } });
    const off = await render(<Probe active />);
    expect(screen.getByText('off')).toBeOnTheScreen();
    await off.unmount();
    jest.mocked(voiceInputAvailable).mockReturnValueOnce(false);
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, voiceCommands: true } });
    const missing = await render(<Probe active />);
    await missing.unmount();
    await render(<Probe active={false} />);
    expect(listen).not.toHaveBeenCalled();
  });
});
