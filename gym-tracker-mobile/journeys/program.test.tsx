import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { buildHistory } from '@/scripts/personas/history';
import { PERSONAS } from '@/scripts/personas/personas';
import { DEFAULT_SETTINGS } from '@/domain/settings';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { UserProfile } from '@/types';
import { Journey, PROFILE, screen, seed } from './harness';

jest.setTimeout(120_000);

const GROUP = 'Programme';

beforeEach(() => {
  jest.useFakeTimers();
  const p = PERSONAS.find((x) => x.username === 'test-inter')!;
  const settings = { ...DEFAULT_SETTINGS, warmups: false };
  const profile: UserProfile = {
    ...PROFILE,
    goal: p.profile.goal,
    program: p.profile.program,
    experience: p.profile.experience,
  };
  seed({ profile, workouts: buildHistory(p, profile, settings, new Date()) });
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const firstChoice = () =>
  screen.getAllByRole('button').find((b) => /^Choisir /.test(b.props.accessibilityLabel ?? ''))!.props
    .accessibilityLabel as string;

describe('program', () => {
  it('switches to another ready-made program', async () => {
    const j = await new Journey('program-change', 'Changer de programme (Push · Pull · Legs → Haut · Bas)', GROUP).open(
      '/',
    );
    await j.tap('Profil', 'tab');
    await j.tap(/^Programme :/);
    await j.tap(/^Haut · Bas/, 'radio');
    await j.tap('Enregistrer');
    expect(useProfileStore.getState().profile?.program.split).toBe('ul');
    j.save();
  });

  it('builds a program of their own from a copy, every session renamed', async () => {
    const j = await new Journey(
      'program-custom',
      'Créer « Mon programme » à partir d’un programme copié, 3 séances renommées',
      GROUP,
    ).open('/');
    await j.tap('Profil', 'tab');
    await j.tap(/^Programme :/);
    await j.tap(/^Mon programme/, 'radio');
    await j.type('Nom du programme (facultatif)', 'Ma prise de masse');
    await j.tap('Push · Pull · Legs', 'radio');
    await j.type('Nom de la séance 1', 'Pecs');
    await j.type('Nom de la séance 2', 'Dos');
    await j.type('Nom de la séance 3', 'Jambes');
    await j.tap('Enregistrer');
    expect(useSettingsStore.getState().settings.programName).toBe('Ma prise de masse');
    j.save();
  });

  it('adds an exercise to a session of the program', async () => {
    const j = await new Journey('day-add-exercise', 'Ajouter un exercice à une séance du programme', GROUP).open('/');
    await j.tap('Profil', 'tab');
    await j.tap(/^Mes séances :/);
    await j.tap(/^Modifier la séance Push/);
    await j.tap('Ajouter un exercice');
    j.sheet('choix d’exercice');
    await j.tap(firstChoice());
    j.save();
  });

  it('gives an exercise their own name', async () => {
    const j = await new Journey('exercise-rename', 'Renommer un exercice du catalogue', GROUP).open('/');
    const lift = screen.getAllByRole('button').find((b) => /^Squat, /.test(b.props.accessibilityLabel ?? ''))!;
    await j.tap(lift.props.accessibilityLabel as string);
    await j.tap('Renommer');
    await j.type('Ton nom pour cet exercice', 'Squat lourd');
    await j.tap('Enregistrer');
    expect(useSettingsStore.getState().settings.exerciseNicknames.Squat).toBe('Squat lourd');
    j.save();
  });

  it('looks at the last session', async () => {
    const j = await new Journey('history-last', 'Revoir la dernière séance', GROUP).open('/');
    const last = screen.getAllByRole('button').find((b) => /^Voir la séance /.test(b.props.accessibilityLabel ?? ''))!;
    await j.tap(last.props.accessibilityLabel as string);
    expect(j.pathname).toMatch(/^\/history\//);
    j.save();
  });
});
