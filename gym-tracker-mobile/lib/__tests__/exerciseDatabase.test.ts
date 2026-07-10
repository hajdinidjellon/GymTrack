import {
  EXERCISE_GROUPS,
  ALL_EXERCISES,
  findExercise,
  filterGroups,
} from '@/lib/exerciseDatabase';

// ── Intégrité des données ────────────────────────────────────────

describe('EXERCISE_GROUPS — intégrité', () => {
  it('les ids de groupes sont uniques', () => {
    const ids = EXERCISE_GROUPS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('aucun groupe vide', () => {
    for (const group of EXERCISE_GROUPS) {
      expect(group.exercises.length).toBeGreaterThan(0);
    }
  });

  it('chaque exercice a un nom non vide et au moins un muscle', () => {
    for (const ex of ALL_EXERCISES) {
      expect(ex.name.trim().length).toBeGreaterThan(0);
      expect(ex.muscleGroups.length).toBeGreaterThan(0);
    }
  });

  it('chaque groupe a label, hint, icon et couleur renseignés', () => {
    for (const group of EXERCISE_GROUPS) {
      expect(group.label.length).toBeGreaterThan(0);
      expect(group.hint.length).toBeGreaterThan(0);
      expect(group.icon.length).toBeGreaterThan(0);
      expect(group.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('ALL_EXERCISES agrège bien tous les groupes', () => {
    const total = EXERCISE_GROUPS.reduce((sum, g) => sum + g.exercises.length, 0);
    expect(ALL_EXERCISES).toHaveLength(total);
  });
});

// ── findExercise ─────────────────────────────────────────────────

describe('findExercise', () => {
  it('trouve un exercice par son nom exact', () => {
    expect(findExercise('Squat barre')).toMatchObject({
      category: 'compound',
      muscleGroups: ['legs', 'glutes'],
    });
  });

  it('est insensible à la casse et aux espaces autour', () => {
    expect(findExercise('  sQuAt BARRE ')?.name).toBe('Squat barre');
  });

  it('trouve via un alias (insensible à la casse)', () => {
    expect(findExercise('bench press')?.name).toBe('Développé couché barre');
    expect(findExercise('DEADLIFT')?.name).toBe('Soulevé de terre');
    expect(findExercise('romanian deadlift')?.name).toBe('Soulevé de terre roumain');
  });

  it('retourne undefined pour un exercice inconnu', () => {
    expect(findExercise('Curl fantôme')).toBeUndefined();
    expect(findExercise('')).toBeUndefined();
  });

  it('ne matche pas sur une sous-chaîne (match exact uniquement)', () => {
    expect(findExercise('Squat')).toBeUndefined();
  });
});

// ── filterGroups ─────────────────────────────────────────────────

describe('filterGroups', () => {
  it('recherche vide (ou espaces) retourne tous les groupes intacts', () => {
    expect(filterGroups('')).toBe(EXERCISE_GROUPS);
    expect(filterGroups('   ')).toBe(EXERCISE_GROUPS);
  });

  it('filtre par sous-chaîne de nom, sans laisser de groupe vide', () => {
    const groups = filterGroups('curl');
    expect(groups.length).toBeGreaterThan(0);
    for (const g of groups) {
      expect(g.exercises.length).toBeGreaterThan(0);
      for (const ex of g.exercises) {
        const inName = ex.name.toLowerCase().includes('curl');
        const inAlias = ex.aliases?.some((a) => a.toLowerCase().includes('curl')) ?? false;
        expect(inName || inAlias).toBe(true);
      }
    }
  });

  it('matche aussi les aliases', () => {
    const groups = filterGroups('crossover');
    expect(groups).toHaveLength(1);
    expect(groups[0]!.id).toBe('chest');
    expect(groups[0]!.exercises[0]!.name).toBe('Poulie vis-à-vis (mid)');
  });

  it('terme introuvable → aucun groupe', () => {
    expect(filterGroups('zzzzz')).toHaveLength(0);
  });

  it('ne mute pas EXERCISE_GROUPS', () => {
    const before = EXERCISE_GROUPS.map((g) => g.exercises.length);
    filterGroups('curl');
    const after = EXERCISE_GROUPS.map((g) => g.exercises.length);
    expect(after).toEqual(before);
  });
});
