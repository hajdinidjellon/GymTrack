/** Épaules. */

import { ex, held, kettlebell, onCable, onSmith, withPlates, type ExerciseDef } from '@/domain/catalog/define';

export const SHOULDERS = {
  ohp: ex('Développé militaire', 'barbell', 'compound', ['shoulders', 'triceps'], ['Développé militaire barre']),
  seatedohp: ex('Développé militaire assis', 'barbell', 'compound', ['shoulders', 'triceps']),
  dbpress: ex(
    'Développé épaules haltères',
    'dumbbell',
    'compound',
    ['shoulders', 'triceps'],
    ['Développé haltères assis', 'Développé militaire haltères'],
  ),
  smithpress: onSmith(
    ex('Développé épaules Smith', 'machine', 'compound', ['shoulders', 'triceps'], ['Développé militaire Smith']),
  ),
  shoulderpress: withPlates(
    ex('Shoulder press machine', 'machine', 'compound', ['shoulders', 'triceps'], ['Développé épaules machine']),
  ),
  arnold: ex('Développé Arnold', 'dumbbell', 'compound', ['shoulders', 'triceps'], ['Arnold press']),
  pushpress: ex('Push press', 'barbell', 'compound', ['shoulders', 'triceps', 'legs']),
  landminepress: ex('Développé landmine', 'barbell', 'compound', ['shoulders', 'chest', 'triceps']),
  kbpress: kettlebell(ex('Développé kettlebell', 'dumbbell', 'compound', ['shoulders', 'triceps'])),
  pikepushup: ex('Pompes pike', 'bodyweight', 'compound', ['shoulders', 'triceps'], ['Pompes piquées']),
  hspu: ex('Pompes en équilibre', 'bodyweight', 'compound', ['shoulders', 'triceps'], ['Pompes poirier']),
  handstand: held(ex('Équilibre sur les mains', 'bodyweight', 'isolation', ['shoulders', 'core'], ['Poirier'])),
  lateral: ex('Élévations latérales', 'dumbbell', 'isolation', ['shoulders'], ['Élévations latérales haltères']),
  cablelateral: onCable(ex('Élévations latérales poulie', 'machine', 'isolation', ['shoulders'])),
  machinelateral: ex('Élévations latérales machine', 'machine', 'isolation', ['shoulders']),
  frontraise: ex('Élévations frontales', 'dumbbell', 'isolation', ['shoulders'], ['Élévations frontales haltères']),
  cablefront: onCable(ex('Élévations frontales poulie', 'machine', 'isolation', ['shoulders'])),
  barfront: ex('Élévations frontales barre', 'barbell', 'isolation', ['shoulders']),
  reardelt: ex('Oiseau haltères', 'dumbbell', 'isolation', ['shoulders'], ['Oiseau', 'Écarté inversé haltères']),
  cablereardelt: onCable(ex('Oiseau poulie', 'machine', 'isolation', ['shoulders', 'back'], ['Écarté inversé poulie'])),
  reversepec: ex(
    'Reverse pec deck',
    'machine',
    'isolation',
    ['shoulders', 'back'],
    ['Oiseau machine', 'Butterfly inversé'],
  ),
  facepull: onCable(ex('Face pull', 'machine', 'isolation', ['shoulders', 'back'], ['Face pulls'])),
  uprightrow: ex('Rowing menton', 'barbell', 'compound', ['shoulders', 'back'], ['Tirage menton']),
  dbupright: ex('Rowing menton haltères', 'dumbbell', 'compound', ['shoulders', 'back']),
  cableupright: onCable(ex('Rowing menton poulie', 'machine', 'compound', ['shoulders', 'back'])),
} satisfies Record<string, ExerciseDef>;
