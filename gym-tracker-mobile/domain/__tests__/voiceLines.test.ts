import { describe, expect, it } from '@jest/globals';
import { findCurrent } from '@/domain/sessionCursor';
import { nextExerciseLine, platesLine, restOverLine, setLine } from '@/domain/voiceLines';
import { active } from './fixtures';

const gym = { barWeight: 20, plates: [20, 15, 10, 5, 2.5, 1.25] };
const cursor = (ex = active('Squat', [{ weight: 62.5, reps: 10 }])) => findCurrent([ex])!;

describe('voice lines', () => {
  it('says the plates per side', () => {
    expect(platesLine(cursor(), gym)).toBe('Mets 20 et 1,25 de chaque côté.');
    expect(platesLine(cursor(active('Squat', [{ weight: 30, reps: 5 }])), gym)).toBe('Mets 5 de chaque côté.');
    expect(platesLine(cursor(active('Squat', [{ weight: 20, reps: 5 }])), gym)).toBe('Barre à vide.');
  });

  it('says nothing about plates off the barbell', () => {
    expect(platesLine(cursor(active('Curl', [{ weight: 12, reps: 10 }], { equipment: 'dumbbell' })), gym)).toBeNull();
  });

  it('announces a set', () => {
    expect(setLine(cursor())).toBe('Série 1. 62,5 kilos, 10 reps.');
    expect(setLine(cursor(active('Dips', [{ weight: 0, reps: 12 }], { equipment: 'bodyweight' })))).toBe(
      'Série 1. 12 reps.',
    );
    expect(restOverLine(cursor())).toBe("C'est reparti. Série 1. 62,5 kilos, 10 reps.");
  });

  it('announces the next exercise with what to load', () => {
    expect(nextExerciseLine(cursor(), gym)).toBe('Prochain exercice : Squat. Mets 20 et 1,25 de chaque côté.');
    const curl = active('Curl', [{ weight: 12, reps: 10 }], { equipment: 'dumbbell' });
    expect(nextExerciseLine(cursor(curl), gym)).toBe('Prochain exercice : Curl. Série 1. 12 kilos, 10 reps.');
    const fresh = active('Row', [{ weight: 0, reps: 8 }], { needsWeight: true });
    expect(nextExerciseLine(cursor(fresh), gym)).toBe('Prochain exercice : Row. Choisis ta charge de départ.');
  });

  it('reads the note on the exercise last', () => {
    const notes = { exerciseNotes: { Squat: 'pieds écartés.' } };
    expect(nextExerciseLine(cursor(), { ...gym, ...notes })).toBe(
      'Prochain exercice : Squat. Mets 20 et 1,25 de chaque côté. Note : pieds écartés.',
    );
  });
});
