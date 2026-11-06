import { describe, expect, it } from '@jest/globals';
import { findCurrent } from '@/domain/sessionCursor';
import {
  holdGoLine,
  nextExerciseLine,
  nextSetLine,
  platesLine,
  restOverLine,
  sessionDoneLine,
  setLine,
  setsLeftLine,
  voiceHelloLine,
} from '@/domain/voiceLines';
import { active } from './fixtures';

const gym = { barWeight: 20, plates: [20, 15, 10, 5, 2.5, 1.25] };
const cursor = (ex = active('Squat', [{ weight: 62.5, reps: 10 }])) => findCurrent([ex])!;

describe('voice lines', () => {
  it('says the plates per side', () => {
    expect(platesLine(cursor(), gym)).toHaveProperty('text', 'Mets 20 et 1,25 de chaque côté.');
    expect(platesLine(cursor(active('Squat', [{ weight: 30, reps: 5 }])), gym)).toHaveProperty(
      'text',
      'Mets 5 de chaque côté.',
    );
    expect(platesLine(cursor(active('Squat', [{ weight: 20, reps: 5 }])), gym)).toHaveProperty('text', 'Barre à vide.');
    expect(platesLine(cursor(), { barWeight: 20, plates: [20, 10, 5, 2.5] })).toHaveProperty(
      'text',
      'Mets 20 de chaque côté. Il manque 1,25 de chaque côté.',
    );
  });

  it('says the plates of a plate-loaded machine, the weight being per side', () => {
    const press = active('Chest press', [{ weight: 25, reps: 10 }], { equipment: 'machine', plateLoaded: true });
    expect(platesLine(cursor(press), gym)).toHaveProperty('text', 'Mets 20 et 5 de chaque côté.');
    const empty = active('Chest press', [{ weight: 0.5, reps: 10 }], { equipment: 'machine', plateLoaded: true });
    expect(platesLine(cursor(empty), gym)).toBeNull();
  });

  it('says nothing about plates off the barbell and the plate-loaded machines', () => {
    expect(platesLine(cursor(active('Curl', [{ weight: 12, reps: 10 }], { equipment: 'dumbbell' })), gym)).toBeNull();
    expect(
      platesLine(cursor(active('Pec deck', [{ weight: 40, reps: 10 }], { equipment: 'machine' })), gym),
    ).toBeNull();
  });

  it('announces a set', () => {
    expect(setLine(cursor())).toHaveProperty('text', 'Série 1. 62,5 kilos, 10 reps.');
    expect(setLine(cursor(active('Dips', [{ weight: 0, reps: 12 }], { equipment: 'bodyweight' })))).toHaveProperty(
      'text',
      'Série 1. Poids du corps, 12 reps.',
    );
    expect(restOverLine(cursor())).toHaveProperty('text', "C'est reparti. Série 1. 62,5 kilos, 10 reps.");
  });

  it('says the help of an assisted machine as help', () => {
    const helped = active('Tractions assistées', [{ weight: 30, reps: 8 }], { equipment: 'machine', assisted: true });
    expect(setLine(cursor(helped))).toEqual({
      text: "Série 1. 30 kilos d'aide, 8 reps.",
      clips: ['set-1', 'kg-30', 'assist', 'reps-8'],
    });
    expect(platesLine(cursor(helped), gym)).toBeNull();
  });

  it('announces a warm-up apart from the working sets, plates first when there is no rest', () => {
    const squat = active('Squat', [{ weight: 100, reps: 5 }]);
    squat.sets.unshift(
      { weight: 20, reps: 10, setType: 'warmup', completed: true },
      { weight: 40, reps: 5, setType: 'warmup' },
    );
    expect(setLine(cursor(squat))).toHaveProperty('text', 'Échauffement 2. 40 kilos, 5 reps.');
    expect(nextSetLine(cursor(squat), gym)).toHaveProperty(
      'text',
      'Mets 10 de chaque côté. Échauffement 2. 40 kilos, 5 reps.',
    );
    const curl = active('Curl', [{ weight: 12, reps: 10 }], { equipment: 'dumbbell' });
    expect(nextSetLine(cursor(curl), gym)).toHaveProperty('text', 'Série 1. 12 kilos par haltère, 10 reps.');
  });

  it('says when the weight is per dumbbell or per side', () => {
    const curl = active('Curl', [{ weight: 12, reps: 10 }], { equipment: 'dumbbell' });
    expect(setLine(cursor(curl))).toHaveProperty('text', 'Série 1. 12 kilos par haltère, 10 reps.');
    const press = active('Chest press', [{ weight: 30, reps: 8 }], { equipment: 'machine', plateLoaded: true });
    expect(setLine(cursor(press))).toHaveProperty('text', 'Série 1. 30 kilos de chaque côté, 8 reps.');
  });

  it('announces the next exercise with what to load', () => {
    expect(nextExerciseLine(cursor(), gym)).toHaveProperty(
      'text',
      'Prochain exercice : Squat. Mets 20 et 1,25 de chaque côté.',
    );
    const curl = active('Curl', [{ weight: 12, reps: 10 }], { equipment: 'dumbbell' });
    expect(nextExerciseLine(cursor(curl), gym)).toHaveProperty(
      'text',
      'Prochain exercice : Curl. Série 1. 12 kilos par haltère, 10 reps.',
    );
    const fresh = active('Row', [{ weight: 0, reps: 8 }], { needsWeight: true });
    expect(nextExerciseLine(cursor(fresh), gym)).toHaveProperty(
      'text',
      'Prochain exercice : Row. Choisis ta charge de départ.',
    );
  });

  it('reads the note on the exercise last', () => {
    const notes = { exerciseNotes: { Squat: 'pieds écartés.' } };
    expect(nextExerciseLine(cursor(), { ...gym, ...notes })).toHaveProperty(
      'text',
      'Prochain exercice : Squat. Mets 20 et 1,25 de chaque côté. Note : pieds écartés.',
    );
  });
});

describe('timed voice lines', () => {
  it('says seconds for a hold', () => {
    const plank = active('Gainage', [{ weight: 0, reps: 45 }], { equipment: 'bodyweight', timed: true });
    expect(setLine(cursor(plank))).toHaveProperty('text', 'Série 1. 45 secondes.');
    const weighted = active('Gainage', [{ weight: 10, reps: 45 }], { equipment: 'machine', timed: true });
    expect(setLine(cursor(weighted))).toHaveProperty('text', 'Série 1. 10 kilos, 45 secondes.');
  });
});

describe('drop set voice line', () => {
  it('names the drop set instead of numbering it', () => {
    const press = active('Squat', [{ weight: 100, reps: 5, completed: true }]);
    press.sets.push({ weight: 80, reps: 5, setType: 'drop' });
    expect(setLine(cursor(press))).toHaveProperty('text', 'Dégressive. 80 kilos, 5 reps.');
  });
});

describe('recorded voice clips', () => {
  it('chains the clips of a set, the weight and the reps', () => {
    expect(setLine(cursor()).clips).toEqual(['set-1', 'kg-62.5', 'reps-10']);
    const curl = active('Curl', [{ weight: 12, reps: 10 }], { equipment: 'dumbbell' });
    expect(setLine(cursor(curl)).clips).toEqual(['set-1', 'kg-12', 'per-hand', 'reps-10']);
    const plank = active('Gainage', [{ weight: 0, reps: 45 }], { equipment: 'bodyweight', timed: true });
    expect(setLine(cursor(plank)).clips).toEqual(['set-1', 'sec-45']);
  });

  it('groups the plates of a side and says the last one after « et »', () => {
    expect(platesLine(cursor(), gym)?.clips).toEqual(['put-on', 'plate-1x20', 'plate-and-1x1.25', 'each-side']);
    const heavy = active('Squat', [{ weight: 110, reps: 5 }]);
    expect(platesLine(cursor(heavy), gym)?.clips).toEqual(['put-on', 'plate-2x20', 'plate-and-1x5', 'each-side']);
    const one = active('Squat', [{ weight: 30, reps: 5 }]);
    expect(platesLine(cursor(one), gym)?.clips).toEqual(['put-on', 'plate-1x5', 'each-side']);
    expect(platesLine(cursor(active('Squat', [{ weight: 20, reps: 5 }])), gym)?.clips).toEqual(['empty-bar']);
  });

  it("leaves to the phone's voice what was not recorded", () => {
    expect(platesLine(cursor(), { barWeight: 20, plates: [20, 10, 5, 2.5] })?.clips).toBeNull();
    const odd = active('Pec deck', [{ weight: 13.6, reps: 10 }], { equipment: 'machine' });
    expect(setLine(cursor(odd)).clips).toBeNull();
    const own = active('Mon exercice à moi', [{ weight: 40, reps: 10 }]);
    expect(nextExerciseLine(cursor(own), gym).clips).toBeNull();
  });

  it('keeps the note for the end, in the phone voice', () => {
    const line = nextExerciseLine(cursor(), { ...gym, exerciseNotes: { Squat: 'pieds écartés.' } });
    expect(line.clips).toEqual(['next-squat', 'put-on', 'plate-1x20', 'plate-and-1x1.25', 'each-side']);
    expect(line.tail).toBe('Note : pieds écartés.');
  });

  it("says « C'est reparti » a different way from one set to the next", () => {
    expect(restOverLine(cursor(), 0).clips?.[0]).toBe('rest-over-1');
    expect(restOverLine(cursor(), 4).clips?.[0]).toBe('rest-over-2');
  });
});

describe('sets left and the last set', () => {
  const three = () =>
    active('Squat', [
      { weight: 100, reps: 5, completed: true },
      { weight: 100, reps: 5, completed: true },
      { weight: 100, reps: 5 },
    ]);

  it('announces the last working set as such', () => {
    const line = setLine(cursor(three()));
    expect(line.text).toBe('Dernière série ! 100 kilos, 5 reps.');
    expect(line.clips?.[0]).toMatch(/^last-set-/);
    const dips = active(
      'Dips',
      [
        { weight: 0, reps: 12, completed: true },
        { weight: 0, reps: 12 },
      ],
      {
        equipment: 'bodyweight',
      },
    );
    expect(setLine(cursor(dips))).toEqual({
      text: 'Dernière série ! Poids du corps, 12 reps.',
      clips: [expect.stringMatching(/^last-set-/), 'bodyweight', 'reps-12'],
    });
  });

  it('does not call a single set « the last »', () => {
    expect(setLine(cursor()).text).toBe('Série 1. 62,5 kilos, 10 reps.');
  });

  it('counts the working sets left', () => {
    const ex = three();
    expect(setsLeftLine(ex)).toEqual({ text: 'Plus qu’une série !', clips: ['left-1'] });
    ex.sets[1]!.completed = false;
    expect(setsLeftLine(ex)).toEqual({ text: 'Plus que 2 séries.', clips: ['left-2'] });
    ex.sets.forEach((s) => (s.completed = true));
    expect(setsLeftLine(ex)).toBeNull();
  });

  it('ends the session with one of the recorded lines', () => {
    expect(sessionDoneLine(0)).toEqual({ text: 'Séance terminée. Énorme travail aujourd’hui !', clips: ['done-1'] });
    expect(sessionDoneLine(2).clips).toEqual(['done-3']);
    expect(holdGoLine().clips).toEqual(['hold-go']);
    expect(voiceHelloLine().clips).toEqual(['hello']);
  });
});
