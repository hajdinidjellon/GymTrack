import type { ActiveExercise, ExerciseCategory, MuscleGroup, WorkoutSet, WorkoutType } from '@/types';
import { findExercise } from './exerciseDatabase';

/**
 * Templates de séances pré-définies — Push / Pull / Legs.
 * Chaque template peut être démarré en un tap depuis le planner.
 */

export type SessionTemplate = {
  id: 'push' | 'pull' | 'legs';
  name: string;
  title: string;
  hint: string;
  icon: string;
  color: string;
  type: WorkoutType;
  focus: MuscleGroup[];
  estimatedDuration: number;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight?: number;
  }>;
};

export const SESSION_TEMPLATES: SessionTemplate[] = [
  {
    id: 'push',
    name: 'Push',
    title: 'Push — Pousser',
    hint: 'Pecs · Épaules · Triceps',
    icon: 'arrow-up-circle',
    color: '#f87171',
    type: 'hypertrophy',
    focus: ['chest', 'shoulders', 'arms'],
    estimatedDuration: 60,
    exercises: [
      { name: 'Développé couché barre',       sets: 4, reps: 8 },
      { name: 'Développé incliné haltères',   sets: 3, reps: 10 },
      { name: 'Développé militaire haltères', sets: 3, reps: 10 },
      { name: 'Élévations latérales haltères', sets: 3, reps: 12 },
      { name: 'Pushdown corde',                sets: 3, reps: 12 },
      { name: 'Dips triceps',                  sets: 3, reps: 10 },
    ],
  },
  {
    id: 'pull',
    name: 'Pull',
    title: 'Pull — Tirer',
    hint: 'Dos · Biceps',
    icon: 'arrow-down-circle',
    color: '#38bdf8',
    type: 'hypertrophy',
    focus: ['back', 'arms'],
    estimatedDuration: 55,
    exercises: [
      { name: 'Tractions pronation',     sets: 4, reps: 8  },
      { name: 'Rowing barre',            sets: 4, reps: 8  },
      { name: 'Tirage vertical poulie',  sets: 3, reps: 10 },
      { name: 'Face pulls',              sets: 3, reps: 15 },
      { name: 'Curl barre EZ',           sets: 3, reps: 10 },
      { name: 'Curl haltères alternés',  sets: 3, reps: 12 },
    ],
  },
  {
    id: 'legs',
    name: 'Legs',
    title: 'Legs — Jambes',
    hint: 'Quads · Ischios · Mollets',
    icon: 'walk',
    color: '#34d399',
    type: 'hypertrophy',
    focus: ['legs', 'glutes', 'calves'],
    estimatedDuration: 65,
    exercises: [
      { name: 'Squat barre',                 sets: 4, reps: 8  },
      { name: 'Soulevé de terre roumain',    sets: 3, reps: 8  },
      { name: 'Leg press',                   sets: 3, reps: 12 },
      { name: 'Fentes bulgares',             sets: 3, reps: 10 },
      { name: 'Leg curl couché',             sets: 3, reps: 12 },
      { name: 'Mollets debout machine',      sets: 4, reps: 15 },
    ],
  },
];

/**
 * Construit la liste d'ActiveExercise prête à être ajoutée à une session
 * depuis un template. Récupère les muscles/category depuis la base d'exercices.
 */
export function buildExercisesFromTemplate(
  template: SessionTemplate,
  defaultRestTime: number,
): Array<Omit<ActiveExercise, 'isExpanded'>> {
  return template.exercises.map((ex, i) => {
    const def = findExercise(ex.name);
    const sets: WorkoutSet[] = Array.from({ length: ex.sets }, () => ({
      weight: ex.weight ?? 0,
      reps: ex.reps,
      setType: 'normal' as const,
      restTime: defaultRestTime,
      completed: false,
    }));

    return {
      id: `${ex.name}-${Date.now()}-${i}`,
      name: ex.name,
      category: (def?.category ?? 'compound') as ExerciseCategory,
      muscleGroups: (def?.muscleGroups ?? template.focus) as MuscleGroup[],
      sets,
    };
  });
}
