/** Pectoraux. */

import { ex, helped, onCable, onSmith, withPlates, type ExerciseDef } from '@/domain/catalog/define';

export const CHEST = {
  bench: ex('Développé couché', 'barbell', 'compound', ['chest', 'shoulders', 'triceps'], ['Développé couché barre']),
  dbbench: ex('Développé couché haltères', 'dumbbell', 'compound', ['chest', 'shoulders', 'triceps']),
  smithbench: onSmith(
    ex('Développé couché Smith', 'machine', 'compound', ['chest', 'shoulders', 'triceps'], ['Smith bench']),
  ),
  widebench: ex('Développé couché prise large', 'barbell', 'compound', ['chest', 'shoulders', 'triceps']),
  inclinebar: ex('Développé incliné barre', 'barbell', 'compound', ['chest', 'shoulders', 'triceps']),
  incline: ex('Développé incliné haltères', 'dumbbell', 'compound', ['chest', 'shoulders']),
  inclinesmith: onSmith(ex('Développé incliné Smith', 'machine', 'compound', ['chest', 'shoulders'])),
  decline: ex('Développé décliné', 'barbell', 'compound', ['chest', 'triceps'], ['Développé décliné barre']),
  declinedb: ex('Développé décliné haltères', 'dumbbell', 'compound', ['chest', 'triceps']),
  declinesmith: onSmith(ex('Développé décliné Smith', 'machine', 'compound', ['chest', 'triceps'])),
  declinemachine: withPlates(ex('Développé décliné machine', 'machine', 'compound', ['chest', 'triceps'])),
  floorpress: ex('Floor press', 'barbell', 'compound', ['chest', 'triceps'], ['Développé au sol']),
  dbfloorpress: ex('Floor press haltères', 'dumbbell', 'compound', ['chest', 'triceps'], ['Développé au sol haltères']),
  squeezepress: ex('Squeeze press haltères', 'dumbbell', 'compound', ['chest', 'triceps'], ['Hex press']),
  convergent: withPlates(
    ex(
      'Développé convergent machine',
      'machine',
      'compound',
      ['chest', 'shoulders', 'triceps'],
      ['Bench press convergent', 'Chest press convergente', 'Iso-lateral chest press'],
    ),
  ),
  chestpress: withPlates(
    ex('Chest press', 'machine', 'compound', ['chest', 'triceps'], ['Développé assis machine', 'Presse pectoraux']),
  ),
  inclinemachine: withPlates(
    ex('Développé incliné machine', 'machine', 'compound', ['chest', 'shoulders'], ['Incline chest press']),
  ),
  dips: ex('Dips', 'bodyweight', 'compound', ['chest', 'triceps'], ['Dips barres parallèles']),
  assisteddips: helped(ex('Dips assistés', 'machine', 'compound', ['chest', 'triceps'], ['Dips assistés machine'])),
  ringdips: ex('Dips anneaux', 'bodyweight', 'compound', ['chest', 'triceps'], ['Dips aux anneaux']),
  pushup: ex('Pompes', 'bodyweight', 'compound', ['chest', 'triceps'], ['Pompe']),
  inclinepushup: ex('Pompes inclinées', 'bodyweight', 'compound', ['chest', 'triceps'], ['Pompes mains surélevées']),
  declinepushup: ex(
    'Pompes déclinées',
    'bodyweight',
    'compound',
    ['chest', 'shoulders', 'triceps'],
    ['Pompes pieds surélevés'],
  ),
  kneepushup: ex('Pompes sur les genoux', 'bodyweight', 'compound', ['chest', 'triceps'], ['Pompes genoux']),
  clappushup: ex('Pompes claquées', 'bodyweight', 'compound', ['chest', 'triceps'], ['Pompes plyométriques']),
  archerpushup: ex('Pompes archer', 'bodyweight', 'compound', ['chest', 'triceps']),
  onearmpushup: ex('Pompes à une main', 'bodyweight', 'compound', ['chest', 'triceps', 'core'], ['Pompes une main']),
  fly: onCable(ex('Écarté poulie', 'machine', 'isolation', ['chest'], ['Crossover poulie', 'Vis-à-vis poulie'])),
  lowfly: onCable(ex('Écarté poulie basse', 'machine', 'isolation', ['chest'], ['Crossover poulie basse'])),
  highfly: onCable(ex('Écarté poulie haute', 'machine', 'isolation', ['chest'], ['Crossover poulie haute'])),
  pecdeck: ex('Pec deck', 'machine', 'isolation', ['chest'], ['Butterfly', 'Pec fly', 'Écarté machine']),
  dbfly: ex('Écarté haltères', 'dumbbell', 'isolation', ['chest'], ['Écarté couché haltères']),
  inclinefly: ex('Écarté incliné haltères', 'dumbbell', 'isolation', ['chest']),
  dbpullover: ex('Pull-over haltère', 'dumbbell', 'isolation', ['chest', 'back'], ['Pullover haltère']),
} satisfies Record<string, ExerciseDef>;
