/**
 * The part of the main muscle an exercise works most: the high, middle or low
 * chest, the lats or the traps… The picker shows them as tabs inside a muscle.
 * Only where gym-goers think that way: arms and calves have none.
 */

import type { CustomExercise, MuscleGroup, MuscleRegion } from '@/types';

/** The order of the tabs, the most asked first. */
export const REGIONS: Partial<Record<MuscleGroup, readonly MuscleRegion[]>> = {
  chest: ['upperChest', 'midChest', 'lowerChest'],
  back: ['lats', 'midBack', 'traps', 'lowerBack'],
  shoulders: ['frontDelts', 'sideDelts', 'rearDelts'],
  legs: ['quads', 'hamstrings', 'adductors', 'power'],
  glutes: ['gluteMax', 'gluteMed'],
  core: ['abs', 'lowerAbs', 'obliques', 'plank'],
};

const named = (region: MuscleRegion, names: string[]) => names.map((n) => [n, region] as const);

/** Catalog names (stored, never renamed) → region. A test checks none is missing. */
const BY_NAME: ReadonlyMap<string, MuscleRegion> = new Map([
  ...named('upperChest', [
    'Développé incliné barre',
    'Développé incliné haltères',
    'Développé incliné Smith',
    'Développé incliné machine',
    'Écarté incliné haltères',
    // De bas en haut : le haut des pecs
    'Écarté poulie basse',
    // Pieds surélevés : le haut des pecs
    'Pompes déclinées',
  ]),
  ...named('midChest', [
    'Développé couché',
    'Développé couché haltères',
    'Développé couché Smith',
    'Développé couché prise large',
    'Développé convergent machine',
    'Chest press',
    'Floor press',
    'Floor press haltères',
    'Squeeze press haltères',
    'Pompes',
    'Pompes sur les genoux',
    'Pompes claquées',
    'Pompes archer',
    'Pompes à une main',
    'Écarté poulie',
    'Écarté haltères',
    'Pec deck',
    'Pull-over haltère',
  ]),
  ...named('lowerChest', [
    'Développé décliné',
    'Développé décliné haltères',
    'Développé décliné Smith',
    'Développé décliné machine',
    'Dips',
    'Dips assistés',
    'Dips anneaux',
    // De haut en bas : le bas des pecs
    'Écarté poulie haute',
    // Mains surélevées : le bas des pecs
    'Pompes inclinées',
  ]),
  ...named('lats', [
    'Tractions',
    'Tractions supination',
    'Tractions prise large',
    'Tractions prise neutre',
    'Tractions assistées',
    'Muscle-up',
    'Tirage vertical',
    'Tirage vertical machine',
    'Tirage vertical prise serrée',
    'Tirage vertical supination',
    'Tirage vertical unilatéral',
    'Pull-over machine',
    'Pull-over poulie',
    'Front lever',
    'Suspension barre',
  ]),
  ...named('midBack', [
    'Rowing barre',
    'Rowing Pendlay',
    'Rowing haltère',
    'Rowing buste appuyé haltères',
    'Rowing renegade',
    'Rowing Meadows',
    'Rowing assis poulie',
    'Rowing unilatéral poulie',
    'Rowing haut machine',
    'Rowing machine',
    'Rowing T-bar',
    'Tractions australiennes',
  ]),
  ...named('traps', ['Shrugs haltères', 'Shrugs barre', 'Shrugs machine', 'Shrugs Smith']),
  ...named('lowerBack', [
    'Soulevé de terre',
    'Soulevé de terre haltères',
    'Rack pull',
    'Extensions lombaires',
    'Extensions lombaires machine',
    'Superman',
  ]),
  ...named('frontDelts', [
    'Développé militaire',
    'Développé militaire assis',
    'Développé épaules haltères',
    'Développé épaules Smith',
    'Shoulder press machine',
    'Développé Arnold',
    'Push press',
    'Développé landmine',
    'Développé kettlebell',
    'Pompes pike',
    'Pompes en équilibre',
    'Équilibre sur les mains',
    'Élévations frontales',
    'Élévations frontales poulie',
    'Élévations frontales barre',
  ]),
  ...named('sideDelts', [
    'Élévations latérales',
    'Élévations latérales poulie',
    'Élévations latérales machine',
    'Rowing menton',
    'Rowing menton haltères',
    'Rowing menton poulie',
  ]),
  ...named('rearDelts', ['Oiseau haltères', 'Oiseau poulie', 'Reverse pec deck', 'Face pull']),
  ...named('quads', [
    'Squat',
    'Squat avant',
    'Squat Zercher',
    'Squat Smith',
    'Hack squat',
    'Pendulum squat',
    'Belt squat',
    'Goblet squat',
    'Squat haltères',
    'Squat sumo haltère',
    'Squat poids du corps',
    'Pistol squat',
    'Sissy squat',
    'Chaise',
    'Presse à cuisses',
    'Presse à cuisses horizontale',
    'Presse à cuisses unilatérale',
    'Leg extension',
    'Fentes haltères',
    'Fentes barre',
    'Fentes marchées',
    'Fentes arrière',
    'Fentes poids du corps',
    'Fentes latérales',
    'Fentes Smith',
    'Split squat haltères',
    'Fentes bulgares',
    'Step-up haltères',
    'Soulevé de terre trap bar',
  ]),
  ...named('hamstrings', [
    'Soulevé de terre roumain',
    'Soulevé de terre roumain haltères',
    'Soulevé de terre roumain unilatéral',
    'Soulevé de terre jambes tendues',
    'Soulevé de terre sumo',
    'Good morning',
    'Leg curl',
    'Leg curl assis',
    'Leg curl debout',
    'Nordic curl',
  ]),
  ...named('adductors', ['Adducteurs machine']),
  ...named('power', [
    'Arraché',
    'Épaulé-jeté',
    'Power clean',
    'Thruster',
    'Box jump',
    'Squat sauté',
    'Fentes sautées',
    'Burpees',
  ]),
  ...named('gluteMax', [
    'Hip thrust',
    'Hip thrust machine',
    'Hip thrust Smith',
    'Hip thrust unilatéral',
    'Pont fessier',
    'Pont fessier barre',
    'Kettlebell swing',
    'Pull-through poulie',
    'Kickback fessier poulie',
    'Kickback fessier machine',
    'Kickback fessier au sol',
  ]),
  ...named('gluteMed', ['Abducteurs machine', 'Abduction hanche poulie']),
  ...named('abs', ['Crunch', 'Crunch poulie', 'Crunch machine', 'Crunch décliné', 'Sit-up', 'V-up', 'Roue abdominale']),
  ...named('lowerAbs', [
    'Crunch inversé',
    'Relevés de jambes',
    'Relevés de genoux suspendu',
    'Relevés de jambes suspendu',
    'Relevés de jambes chaise romaine',
    'Toes to bar',
    'Battements de jambes',
    'Dragon flag',
    'L-sit',
  ]),
  ...named('obliques', [
    'Crunch oblique',
    'Crunch vélo',
    'Russian twist',
    'Flexion latérale haltère',
    'Bûcheron poulie',
    'Pallof press',
    'Rotation du buste machine',
    'Gainage latéral',
  ]),
  ...named('plank', ['Gainage', 'Gainage creux', 'Gainage inversé', 'Dead bug', 'Mountain climbers', 'Turkish get-up']),
]);

/** The regions of a muscle, in tab order; none for the arms and the calves. */
export function regionsOf(muscle: MuscleGroup): readonly MuscleRegion[] {
  return REGIONS[muscle] ?? [];
}

/** Where an exercise goes: the catalog's, or the one picked for an own exercise, if it fits its muscle. */
export function regionOf(def: Pick<CustomExercise, 'name' | 'muscleGroups' | 'region'>): MuscleRegion | undefined {
  const region = def.region ?? BY_NAME.get(def.name);
  const muscle = def.muscleGroups[0];
  return region && muscle && regionsOf(muscle).includes(region) ? region : undefined;
}
