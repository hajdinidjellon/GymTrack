import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { buildHistory } from '@/scripts/personas/history';
import { PERSONAS } from '@/scripts/personas/personas';
import { DEFAULT_SETTINGS } from '@/domain/settings';
import { useSessionStore } from '@/stores/sessionStore';
import type { UserProfile } from '@/types';
import { Journey, PROFILE, screen, seed } from './harness';

jest.setTimeout(120_000);

const GROUP = 'Séance';

/** A user with two months of history: no first-time weights to choose. */
function regular() {
  const p = PERSONAS.find((x) => x.username === 'test-inter')!;
  const settings = { ...DEFAULT_SETTINGS, warmups: false };
  const profile: UserProfile = {
    ...PROFILE,
    goal: p.profile.goal,
    program: p.profile.program,
    experience: p.profile.experience,
  };
  seed({ profile, workouts: buildHistory(p, profile, settings, new Date()) });
}

const validate = () => screen.queryByRole('button', { name: 'Valider la série' });
const sets = () => useSessionStore.getState().activeSession?.exercises.reduce((n, e) => n + e.sets.length, 0) ?? 0;

/** Every set of the session, one « Valider » each, the rest left to run out. */
async function logEverySet(j: Journey) {
  let guard = 200;
  let shown = currentExercise();
  while (validate() && guard-- > 0) {
    await j.tap('Valider la série');
    if (useSessionStore.getState().activeSession?.restEndsAt) await j.restEnds();
    // A new exercise on screen: its name and target are read before the first set
    const now = currentExercise();
    if (now && now !== shown) j.view(now);
    shown = now;
  }
}

const currentExercise = () => screen.queryAllByRole('header')[0]?.props.children as string | undefined;

beforeEach(() => {
  jest.useFakeTimers();
  regular();
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('session', () => {
  it('a whole usual session, from the home to its summary', async () => {
    const j = await new Journey('session-full', 'Une séance habituelle entière, de l’accueil au bilan', GROUP).open(
      '/',
    );
    await j.tap('Lancer la séance');
    const planned = sets();
    await logEverySet(j);
    j.note(`${planned} séries prévues : 1 tap « Valider » par série, le repos se ferme tout seul.`);
    j.view('séance finie');
    await j.tap('Terminer la séance');
    expect(j.pathname).toBe('/session/summary');
    j.save();
  });

  it('a first session: each exercise starts with choosing its weight', async () => {
    seed({ profile: { ...PROFILE, experience: 'new' }, workouts: [] });
    const j = await new Journey(
      'session-first',
      'Première séance (débutant) : charge à choisir à chaque exercice',
      GROUP,
    ).open('/');
    await j.tap('Lancer la séance');
    let guard = 60;
    let exercises = 0;
    while (guard-- > 0) {
      const start = screen.queryAllByRole('button').find((b) => /^Commencer à /.test(b.props.accessibilityLabel ?? ''));
      if (start) {
        exercises++;
        j.view('choix de la charge');
        await j.tap(start.props.accessibilityLabel as string);
      } else if (validate()) {
        await j.tap('Valider la série');
        if (useSessionStore.getState().activeSession?.restEndsAt) await j.restEnds();
      } else break;
    }
    j.note(`${exercises} exercices : 1 tap « Commencer à … kg » chacun en plus des séries.`);
    j.save();
  });

  it('a set done at another weight than planned', async () => {
    const j = await new Journey('set-other-weight', 'Une série faite 2,5 kg plus lourd que prévu', GROUP).open('/');
    await j.tap('Lancer la séance');
    await j.tap(/^Plus 2,5 kg/);
    await j.tap('Valider la série');
    j.save();
  });

  it('one set, validated as planned', async () => {
    const j = await new Journey('set-validate', 'Lancer la séance et valider la 1ʳᵉ série', GROUP).open('/');
    await j.tap('Lancer la séance');
    await j.tap('Valider la série');
    expect(j.save().taps).toBe(2);
  });

  it('a set with fewer reps than planned', async () => {
    const j = await new Journey('set-missed', 'Noter une série ratée (moins de reps)', GROUP).open('/');
    await j.tap('Lancer la séance');
    const before = j.result().taps;
    await j.tap(/^Série ratée/);
    j.sheet('Combien de reps ?');
    await j.tap(/^7/, 'radio');
    await j.tap(/^Enregistrer 7 reps/);
    const r = j.save();
    expect(r.taps - before).toBeLessThanOrEqual(3);
  });

  it('swaps the exercise for another', async () => {
    const j = await new Journey('swap', 'Changer d’exercice (machine prise)', GROUP).open('/');
    await j.tap('Lancer la séance');
    await j.tap(/^Changer d'exercice/);
    j.sheet('choix d’exercice');
    const first = screen.getAllByRole('button').find((b) => /^Choisir /.test(b.props.accessibilityLabel ?? ''));
    await j.tap(first!.props.accessibilityLabel as string);
    j.save();
  });

  it('watches the demo and comes back', async () => {
    const j = await new Journey('demo', 'Voir la démo de l’exercice et revenir', GROUP).open('/');
    await j.tap('Lancer la séance');
    await j.tap(/^Voir la démo/);
    j.sheet('démo');
    await j.tap('J’ai compris');
    j.save();
  });

  it('corrects a set already validated', async () => {
    const j = await new Journey('set-edit', 'Corriger une série déjà validée', GROUP).open('/');
    await j.tap('Lancer la séance');
    await j.tap('Valider la série');
    await j.restEnds();
    await j.tap(screen.getAllByLabelText('Options de la série')[0]!.props.accessibilityLabel as string);
    j.sheet('menu de la série');
    await j.tap('Modifier le poids ou les reps');
    await j.pause();
    j.sheet('modifier la série');
    await j.tap('Moins une rep');
    await j.tap('Enregistrer');
    j.save();
  });

  it('adds an exercise to the session', async () => {
    const j = await new Journey('add-exercise', 'Ajouter un exercice à la séance', GROUP).open('/');
    await j.tap('Lancer la séance');
    await j.tap('Ajouter un exercice à la séance');
    j.sheet('choix d’exercice');
    const first = screen.getAllByRole('button').find((b) => /^Choisir /.test(b.props.accessibilityLabel ?? ''));
    await j.tap(first!.props.accessibilityLabel as string);
    j.save();
  });

  it('keeps the exercise for later (machine taken)', async () => {
    const j = await new Journey('do-later', 'Faire l’exercice plus tard (machine prise)', GROUP).open('/');
    await j.tap('Lancer la séance');
    await j.tap(/^Faire .* plus tard$/);
    j.save();
  });
});
