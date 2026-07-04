import type { ExerciseCategory, MuscleGroup } from '@/types';

/**
 * Base d'exercices catégorisée par groupe musculaire principal.
 * Chaque exercice est associé à ses muscles travaillés + sa catégorie
 * (compound = polyarticulaire, isolation = monoarticulaire, accessory = annexe).
 */

export type ExerciseDefinition = {
  /** Nom affiché à l'utilisateur */
  name: string;
  /** Type d'exercice — compound / isolation / accessory */
  category: ExerciseCategory;
  /** Muscles travaillés (le premier est le muscle principal) */
  muscleGroups: MuscleGroup[];
  /** Aliases pour la recherche (optionnel) */
  aliases?: string[];
};

export type ExerciseGroup = {
  /** Identifiant unique du groupe */
  id: string;
  /** Nom affiché */
  label: string;
  /** Description courte */
  hint: string;
  /** Icône Ionicons */
  icon: string;
  /** Couleur d'accent du groupe */
  color: string;
  /** Exercices dans cette catégorie */
  exercises: ExerciseDefinition[];
};

export const EXERCISE_GROUPS: ExerciseGroup[] = [
  // ───── PECTORAUX ─────────────────────────────────────────────
  {
    id: 'chest',
    label: 'Pectoraux',
    hint: 'Poitrine — pousser',
    icon: 'body-outline',
    color: '#f87171',
    exercises: [
      { name: 'Développé couché barre',      category: 'compound',  muscleGroups: ['chest', 'shoulders', 'arms'], aliases: ['bench press'] },
      { name: 'Développé couché haltères',   category: 'compound',  muscleGroups: ['chest', 'shoulders', 'arms'] },
      { name: 'Développé incliné barre',     category: 'compound',  muscleGroups: ['chest', 'shoulders', 'arms'] },
      { name: 'Développé incliné haltères',  category: 'compound',  muscleGroups: ['chest', 'shoulders', 'arms'] },
      { name: 'Développé décliné',           category: 'compound',  muscleGroups: ['chest', 'arms'] },
      { name: 'Écarté haltères couché',      category: 'isolation', muscleGroups: ['chest'] },
      { name: 'Écarté incliné haltères',     category: 'isolation', muscleGroups: ['chest'] },
      { name: 'Poulie vis-à-vis (mid)',      category: 'isolation', muscleGroups: ['chest'], aliases: ['cable crossover'] },
      { name: 'Poulie vis-à-vis (bas)',      category: 'isolation', muscleGroups: ['chest'] },
      { name: 'Poulie vis-à-vis (haut)',     category: 'isolation', muscleGroups: ['chest'] },
      { name: 'Pec deck',                    category: 'isolation', muscleGroups: ['chest'], aliases: ['butterfly'] },
      { name: 'Dips poitrine',               category: 'compound',  muscleGroups: ['chest', 'arms'] },
      { name: 'Pompes',                      category: 'compound',  muscleGroups: ['chest', 'arms', 'shoulders'] },
      { name: 'Pull-over haltère',           category: 'isolation', muscleGroups: ['chest', 'back'] },
    ],
  },

  // ───── DOS ──────────────────────────────────────────────────
  {
    id: 'back',
    label: 'Dos',
    hint: 'Largeur & épaisseur',
    icon: 'arrow-up',
    color: '#38bdf8',
    exercises: [
      { name: 'Tractions pronation',         category: 'compound',  muscleGroups: ['back', 'arms'] },
      { name: 'Tractions supination',        category: 'compound',  muscleGroups: ['back', 'arms'] },
      { name: 'Tractions neutre',            category: 'compound',  muscleGroups: ['back', 'arms'] },
      { name: 'Tirage vertical poulie',      category: 'compound',  muscleGroups: ['back', 'arms'], aliases: ['lat pulldown'] },
      { name: 'Tirage prise large',          category: 'compound',  muscleGroups: ['back', 'arms'] },
      { name: 'Tirage horizontal poulie',    category: 'compound',  muscleGroups: ['back', 'arms'] },
      { name: 'Rowing barre',                category: 'compound',  muscleGroups: ['back', 'arms'] },
      { name: 'Rowing haltère',              category: 'compound',  muscleGroups: ['back', 'arms'] },
      { name: 'Rowing T-bar',                category: 'compound',  muscleGroups: ['back', 'arms'] },
      { name: 'Rowing yates',                category: 'compound',  muscleGroups: ['back', 'arms'] },
      { name: 'Soulevé de terre',            category: 'compound',  muscleGroups: ['back', 'legs', 'glutes'], aliases: ['deadlift'] },
      { name: 'Soulevé de terre sumo',       category: 'compound',  muscleGroups: ['back', 'legs', 'glutes'] },
      { name: 'Shrugs barre',                category: 'isolation', muscleGroups: ['back', 'shoulders'] },
      { name: 'Shrugs haltères',             category: 'isolation', muscleGroups: ['back', 'shoulders'] },
      { name: 'Pull-over poulie',            category: 'isolation', muscleGroups: ['back', 'chest'] },
      { name: 'Face pulls',                  category: 'accessory', muscleGroups: ['back', 'shoulders'] },
    ],
  },

  // ───── ÉPAULES ──────────────────────────────────────────────
  {
    id: 'shoulders',
    label: 'Épaules',
    hint: 'Deltoïdes — tous les angles',
    icon: 'triangle',
    color: '#a78bfa',
    exercises: [
      { name: 'Développé militaire barre',    category: 'compound',  muscleGroups: ['shoulders', 'arms'], aliases: ['overhead press'] },
      { name: 'Développé militaire haltères', category: 'compound',  muscleGroups: ['shoulders', 'arms'] },
      { name: 'Développé Arnold',             category: 'compound',  muscleGroups: ['shoulders', 'arms'] },
      { name: 'Élévations latérales haltères', category: 'isolation', muscleGroups: ['shoulders'] },
      { name: 'Élévations latérales poulie',  category: 'isolation', muscleGroups: ['shoulders'] },
      { name: 'Élévations frontales',         category: 'isolation', muscleGroups: ['shoulders'] },
      { name: 'Oiseau haltères',              category: 'isolation', muscleGroups: ['shoulders', 'back'], aliases: ['rear delt fly'] },
      { name: 'Oiseau machine',               category: 'isolation', muscleGroups: ['shoulders', 'back'] },
      { name: 'Upright row',                  category: 'compound',  muscleGroups: ['shoulders', 'arms'], aliases: ['tirage menton'] },
      { name: 'Face pulls',                   category: 'accessory', muscleGroups: ['shoulders', 'back'] },
    ],
  },

  // ───── BICEPS ───────────────────────────────────────────────
  {
    id: 'biceps',
    label: 'Biceps',
    hint: 'Bras — flexion',
    icon: 'fitness',
    color: '#f59e0b',
    exercises: [
      { name: 'Curl barre EZ',                category: 'isolation', muscleGroups: ['arms'] },
      { name: 'Curl barre droite',            category: 'isolation', muscleGroups: ['arms'] },
      { name: 'Curl haltères alternés',       category: 'isolation', muscleGroups: ['arms'] },
      { name: 'Curl marteau',                 category: 'isolation', muscleGroups: ['arms'], aliases: ['hammer curl'] },
      { name: 'Curl pupitre (preacher)',      category: 'isolation', muscleGroups: ['arms'] },
      { name: 'Curl incliné haltères',        category: 'isolation', muscleGroups: ['arms'] },
      { name: 'Curl poulie basse',            category: 'isolation', muscleGroups: ['arms'] },
      { name: 'Curl concentré',               category: 'isolation', muscleGroups: ['arms'] },
      { name: 'Curl spider',                  category: 'isolation', muscleGroups: ['arms'] },
      { name: 'Curl Zottman',                 category: 'isolation', muscleGroups: ['arms'] },
    ],
  },

  // ───── TRICEPS ──────────────────────────────────────────────
  {
    id: 'triceps',
    label: 'Triceps',
    hint: 'Bras — extension',
    icon: 'flash',
    color: '#fb923c',
    exercises: [
      { name: 'Dips triceps',                 category: 'compound',  muscleGroups: ['arms', 'chest'] },
      { name: 'Développé couché prise serrée', category: 'compound', muscleGroups: ['arms', 'chest'] },
      { name: 'Pushdown corde',               category: 'isolation', muscleGroups: ['arms'] },
      { name: 'Pushdown barre',               category: 'isolation', muscleGroups: ['arms'] },
      { name: 'Extensions au-dessus de tête', category: 'isolation', muscleGroups: ['arms'], aliases: ['overhead extension'] },
      { name: 'Skull crushers',               category: 'isolation', muscleGroups: ['arms'], aliases: ['barre au front'] },
      { name: 'Kickback haltère',             category: 'isolation', muscleGroups: ['arms'] },
      { name: 'Extensions haltère assis',     category: 'isolation', muscleGroups: ['arms'] },
    ],
  },

  // ───── QUADRICEPS ───────────────────────────────────────────
  {
    id: 'quads',
    label: 'Quadriceps',
    hint: 'Jambes — avant',
    icon: 'walk',
    color: '#34d399',
    exercises: [
      { name: 'Squat barre',                  category: 'compound',  muscleGroups: ['legs', 'glutes'] },
      { name: 'Front squat',                  category: 'compound',  muscleGroups: ['legs', 'glutes'] },
      { name: 'Hack squat machine',           category: 'compound',  muscleGroups: ['legs', 'glutes'] },
      { name: 'Leg press',                    category: 'compound',  muscleGroups: ['legs', 'glutes'] },
      { name: 'Fentes marchées',              category: 'compound',  muscleGroups: ['legs', 'glutes'] },
      { name: 'Fentes bulgares',              category: 'compound',  muscleGroups: ['legs', 'glutes'] },
      { name: 'Step-ups',                     category: 'compound',  muscleGroups: ['legs', 'glutes'] },
      { name: 'Leg extensions',               category: 'isolation', muscleGroups: ['legs'] },
      { name: 'Sissy squat',                  category: 'isolation', muscleGroups: ['legs'] },
      { name: 'Goblet squat',                 category: 'compound',  muscleGroups: ['legs', 'glutes'] },
    ],
  },

  // ───── ISCHIOS / FESSIERS ───────────────────────────────────
  {
    id: 'hamstrings',
    label: 'Ischios & fessiers',
    hint: 'Jambes — arrière, glutes',
    icon: 'ellipse',
    color: '#e879f9',
    exercises: [
      { name: 'Soulevé de terre roumain',     category: 'compound',  muscleGroups: ['glutes', 'legs', 'back'], aliases: ['romanian deadlift'] },
      { name: 'Soulevé de terre jambes tendues', category: 'compound', muscleGroups: ['glutes', 'legs', 'back'] },
      { name: 'Hip thrust',                   category: 'compound',  muscleGroups: ['glutes', 'legs'] },
      { name: 'Glute bridge',                 category: 'compound',  muscleGroups: ['glutes'] },
      { name: 'Leg curl couché',              category: 'isolation', muscleGroups: ['legs'] },
      { name: 'Leg curl assis',               category: 'isolation', muscleGroups: ['legs'] },
      { name: 'Good morning',                 category: 'compound',  muscleGroups: ['glutes', 'back'] },
      { name: 'Cable kickback',               category: 'isolation', muscleGroups: ['glutes'] },
      { name: 'Abductions debout',            category: 'isolation', muscleGroups: ['glutes'] },
    ],
  },

  // ───── MOLLETS ──────────────────────────────────────────────
  {
    id: 'calves',
    label: 'Mollets',
    hint: 'Bas de jambe',
    icon: 'caret-down',
    color: '#60a5fa',
    exercises: [
      { name: 'Mollets debout machine',       category: 'isolation', muscleGroups: ['calves'] },
      { name: 'Mollets assis machine',        category: 'isolation', muscleGroups: ['calves'] },
      { name: 'Mollets debout haltères',      category: 'isolation', muscleGroups: ['calves'] },
      { name: 'Mollets jambes tendues press', category: 'isolation', muscleGroups: ['calves'] },
      { name: 'Donkey calf raise',            category: 'isolation', muscleGroups: ['calves'] },
    ],
  },

  // ───── ABDOS / CORE ─────────────────────────────────────────
  {
    id: 'core',
    label: 'Abdos & core',
    hint: 'Sangle abdominale',
    icon: 'shield',
    color: '#fbbf24',
    exercises: [
      { name: 'Planche',                      category: 'accessory', muscleGroups: ['core'] },
      { name: 'Crunchs',                      category: 'isolation', muscleGroups: ['core'] },
      { name: 'Crunchs poulie',               category: 'isolation', muscleGroups: ['core'] },
      { name: 'Relevés de jambes',            category: 'isolation', muscleGroups: ['core'] },
      { name: 'Hanging leg raises',           category: 'isolation', muscleGroups: ['core'] },
      { name: 'Russian twist',                category: 'isolation', muscleGroups: ['core'] },
      { name: 'Ab wheel',                     category: 'compound',  muscleGroups: ['core'] },
      { name: 'Mountain climbers',            category: 'accessory', muscleGroups: ['core', 'legs'] },
      { name: 'Dead bug',                     category: 'accessory', muscleGroups: ['core'] },
      { name: 'Hollow body hold',             category: 'accessory', muscleGroups: ['core'] },
    ],
  },

  // ───── CARDIO ───────────────────────────────────────────────
  {
    id: 'cardio',
    label: 'Cardio',
    hint: 'Endurance & cardio-vasculaire',
    icon: 'pulse',
    color: '#10b981',
    exercises: [
      { name: 'Course extérieure',            category: 'accessory', muscleGroups: ['legs'] },
      { name: 'Tapis de course',              category: 'accessory', muscleGroups: ['legs'] },
      { name: 'Vélo d\'appartement',          category: 'accessory', muscleGroups: ['legs'] },
      { name: 'Vélo elliptique',              category: 'accessory', muscleGroups: ['legs', 'arms'] },
      { name: 'Rameur',                       category: 'accessory', muscleGroups: ['back', 'legs', 'arms'] },
      { name: 'Corde à sauter',               category: 'accessory', muscleGroups: ['legs', 'calves'] },
      { name: 'Stairmaster',                  category: 'accessory', muscleGroups: ['legs', 'glutes'] },
      { name: 'Marche inclinée',              category: 'accessory', muscleGroups: ['legs'] },
    ],
  },
];

/** Tous les exercices à plat (utile pour la recherche globale) */
export const ALL_EXERCISES: ExerciseDefinition[] = EXERCISE_GROUPS.flatMap((g) => g.exercises);

/** Cherche un exercice par son nom (insensible à la casse + aliases) */
export function findExercise(query: string): ExerciseDefinition | undefined {
  const q = query.toLowerCase().trim();
  return ALL_EXERCISES.find((ex) =>
    ex.name.toLowerCase() === q ||
    ex.aliases?.some((a) => a.toLowerCase() === q)
  );
}

/** Filtre les groupes en ne gardant que les exos qui matchent la recherche */
export function filterGroups(search: string): ExerciseGroup[] {
  const q = search.toLowerCase().trim();
  if (!q) return EXERCISE_GROUPS;

  return EXERCISE_GROUPS
    .map((g) => ({
      ...g,
      exercises: g.exercises.filter((ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.aliases?.some((a) => a.toLowerCase().includes(q))
      ),
    }))
    .filter((g) => g.exercises.length > 0);
}
