import { describe, expect, it } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, parseSettings, useSettingsStore } from '@/stores/settingsStore';

describe('parseSettings', () => {
  it('returns the defaults when nothing is stored or the JSON is broken', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{oops')).toEqual(DEFAULT_SETTINGS);
  });

  it('merges stored values over the defaults', () => {
    expect(parseSettings(JSON.stringify({ voice: false, plates: [20, 10] }))).toMatchObject({
      voice: false,
      plates: [20, 10],
      defaultRestTime: 90,
    });
  });

  it('migrates the 5 s debug rest of the old version', () => {
    expect(parseSettings(JSON.stringify({ defaultRestTime: 5 })).defaultRestTime).toBe(90);
  });

  it('rejects tampered values', () => {
    expect(parseSettings(JSON.stringify({ barWeight: 'heavy' }))).toEqual(DEFAULT_SETTINGS);
  });
});

describe('settings store', () => {
  it('persists every change', async () => {
    useSettingsStore.getState().updateSettings({ voice: false });
    await Promise.resolve();
    const saved = await AsyncStorage.getItem('@gymtrack/settings');
    expect(JSON.parse(saved!)).toMatchObject({ voice: false });
  });

  it('toggles a plate and keeps them sorted heaviest first', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, plates: [20, 5] } });
    useSettingsStore.getState().togglePlate(10);
    expect(useSettingsStore.getState().settings.plates).toEqual([20, 10, 5]);
    useSettingsStore.getState().togglePlate(20);
    expect(useSettingsStore.getState().settings.plates).toEqual([10, 5]);
  });

  it('stores an increment per exercise', () => {
    useSettingsStore.getState().setIncrement('Curl haltères', 1);
    expect(useSettingsStore.getState().settings.increments).toMatchObject({ 'Curl haltères': 1 });
  });

  it('saves the exercises of a day, and goes back to the program', () => {
    const { setDayExercises } = useSettingsStore.getState();
    setDayExercises('ppl/Legs', ['Squat', 'Hip thrust']);
    expect(useSettingsStore.getState().settings.customDays).toEqual({ 'ppl/Legs': ['Squat', 'Hip thrust'] });
    setDayExercises('ppl/Legs', null);
    expect(useSettingsStore.getState().settings.customDays).toEqual({});
  });

  it('saves own sets and reps for an exercise, and removes them', () => {
    const { setRuleOverride } = useSettingsStore.getState();
    setRuleOverride('Squat', { sets: 5, repMin: 3, repMax: 5 });
    expect(useSettingsStore.getState().settings.ruleOverrides).toEqual({ Squat: { sets: 5, repMin: 3, repMax: 5 } });
    setRuleOverride('Squat', null);
    expect(useSettingsStore.getState().settings.ruleOverrides).toEqual({});
  });

  it('saves an own rest for an exercise, and lets the app choose again', () => {
    const { setRestOverride } = useSettingsStore.getState();
    setRestOverride('Squat', 150);
    expect(useSettingsStore.getState().settings.restOverrides).toEqual({ Squat: 150 });
    setRestOverride('Squat', null);
    expect(useSettingsStore.getState().settings.restOverrides).toEqual({});
  });

  it('adds an own exercise', () => {
    const own = {
      name: 'Pec deck',
      equipment: 'machine' as const,
      category: 'isolation' as const,
      muscleGroups: ['chest' as const],
    };
    useSettingsStore.getState().addCustomExercise(own);
    expect(useSettingsStore.getState().settings.customExercises).toEqual([own]);
  });

  it('loads what was saved', async () => {
    await AsyncStorage.setItem('@gymtrack/settings', JSON.stringify({ defaultRestTime: 120 }));
    await useSettingsStore.getState().loadSettings();
    expect(useSettingsStore.getState()).toMatchObject({ isLoaded: true, settings: { defaultRestTime: 120 } });
  });
});
