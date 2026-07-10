import { SESSION_TEMPLATES, buildExercisesFromTemplate } from '@/lib/sessionTemplates';
import { findExercise } from '@/lib/exerciseDatabase';

// ── Intégrité des templates ──────────────────────────────────────

describe('SESSION_TEMPLATES — intégrité', () => {
  it('expose les 3 templates Push / Pull / Legs', () => {
    expect(SESSION_TEMPLATES.map((t) => t.id)).toEqual(['push', 'pull', 'legs']);
  });

  it('chaque exercice de template existe dans la base d’exercices (anti-drift)', () => {
    for (const template of SESSION_TEMPLATES) {
      for (const ex of template.exercises) {
        expect(findExercise(ex.name)).toBeDefined();
      }
    }
  });

  it('sets et reps sont des entiers positifs', () => {
    for (const template of SESSION_TEMPLATES) {
      for (const ex of template.exercises) {
        expect(ex.sets).toBeGreaterThan(0);
        expect(ex.reps).toBeGreaterThan(0);
        expect(Number.isInteger(ex.sets)).toBe(true);
        expect(Number.isInteger(ex.reps)).toBe(true);
      }
    }
  });

  it('chaque template a une durée estimée et au moins un muscle ciblé', () => {
    for (const template of SESSION_TEMPLATES) {
      expect(template.estimatedDuration).toBeGreaterThan(0);
      expect(template.focus.length).toBeGreaterThan(0);
      expect(template.exercises.length).toBeGreaterThan(0);
    }
  });
});

// ── buildExercisesFromTemplate ───────────────────────────────────

describe('buildExercisesFromTemplate', () => {
  const push = SESSION_TEMPLATES[0]!;

  it('produit un ActiveExercise par exercice du template', () => {
    const built = buildExercisesFromTemplate(push, 90);
    expect(built).toHaveLength(push.exercises.length);
    built.forEach((ex, i) => {
      expect(ex.name).toBe(push.exercises[i]!.name);
    });
  });

  it('génère le bon nombre de séries, non complétées, au repos demandé', () => {
    const built = buildExercisesFromTemplate(push, 120);
    built.forEach((ex, i) => {
      expect(ex.sets).toHaveLength(push.exercises[i]!.sets);
      for (const set of ex.sets) {
        expect(set).toMatchObject({
          reps: push.exercises[i]!.reps,
          weight: 0, // pas de poids dans le template → 0 par défaut
          setType: 'normal',
          restTime: 120,
          completed: false,
        });
      }
    });
  });

  it('récupère category et muscleGroups depuis la base d’exercices', () => {
    const legs = SESSION_TEMPLATES[2]!;
    const built = buildExercisesFromTemplate(legs, 90);
    const squat = built.find((e) => e.name === 'Squat barre');
    expect(squat).toMatchObject({
      category: 'compound',
      muscleGroups: ['legs', 'glutes'],
    });
  });

  it('les ids générés sont uniques au sein d’une même construction', () => {
    const built = buildExercisesFromTemplate(push, 90);
    const ids = built.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque série est un objet indépendant (pas de référence partagée)', () => {
    const built = buildExercisesFromTemplate(push, 90);
    const first = built[0]!;
    first.sets[0]!.completed = true;
    expect(first.sets[1]!.completed).toBe(false);
  });
});
