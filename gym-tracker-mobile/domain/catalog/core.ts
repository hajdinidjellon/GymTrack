/** Abdos et gainage, puis les mouvements du corps entier (haltérophilie, kettlebell, cross-training). */

import { ex, held, kettlebell, onCable, type ExerciseDef } from '@/domain/catalog/define';

export const CORE = {
  cablecrunch: onCable(ex('Crunch poulie', 'machine', 'isolation', ['core'], ['Crunch à genoux poulie'])),
  machinecrunch: ex('Crunch machine', 'machine', 'isolation', ['core'], ['Abdos machine']),
  crunch: ex('Crunch', 'bodyweight', 'isolation', ['core'], ['Crunchs']),
  declinecrunch: ex('Crunch décliné', 'bodyweight', 'isolation', ['core']),
  reversecrunch: ex('Crunch inversé', 'bodyweight', 'isolation', ['core']),
  obliquecrunch: ex('Crunch oblique', 'bodyweight', 'isolation', ['core'], ['Crunch obliques']),
  bicyclecrunch: ex('Crunch vélo', 'bodyweight', 'isolation', ['core'], ['Crunch bicyclette']),
  situp: ex('Sit-up', 'bodyweight', 'isolation', ['core'], ['Redressements assis']),
  vup: ex('V-up', 'bodyweight', 'isolation', ['core'], ['Relevé en V']),
  legraise: ex('Relevés de jambes', 'bodyweight', 'isolation', ['core'], ['Relevés de jambes au sol']),
  hangingknee: ex('Relevés de genoux suspendu', 'bodyweight', 'isolation', ['core'], ['Relevés de genoux']),
  hangingleg: ex('Relevés de jambes suspendu', 'bodyweight', 'isolation', ['core']),
  captainchair: ex('Relevés de jambes chaise romaine', 'bodyweight', 'isolation', ['core'], ['Chaise romaine']),
  toestobar: ex('Toes to bar', 'bodyweight', 'isolation', ['core']),
  abwheel: ex('Roue abdominale', 'bodyweight', 'isolation', ['core'], ['Ab wheel rollout']),
  russiantwist: ex('Russian twist', 'bodyweight', 'isolation', ['core'], ['Rotations russes']),
  flutterkicks: ex('Battements de jambes', 'bodyweight', 'isolation', ['core'], ['Ciseaux']),
  deadbug: ex('Dead bug', 'bodyweight', 'isolation', ['core']),
  dragonflag: ex('Dragon flag', 'bodyweight', 'isolation', ['core']),
  mountainclimber: ex('Mountain climbers', 'bodyweight', 'compound', ['core', 'shoulders', 'legs'], ['Grimpeur']),
  woodchopper: onCable(ex('Bûcheron poulie', 'machine', 'isolation', ['core'], ['Woodchopper'])),
  pallof: onCable(ex('Pallof press', 'machine', 'isolation', ['core'])),
  torsorotation: ex('Rotation du buste machine', 'machine', 'isolation', ['core'], ['Rotary torso']),
  sidebend: ex('Flexion latérale haltère', 'dumbbell', 'isolation', ['core'], ['Inclinaisons latérales']),
  plank: held(ex('Gainage', 'bodyweight', 'isolation', ['core'], ['Planche'])),
  sideplank: held(ex('Gainage latéral', 'bodyweight', 'isolation', ['core'], ['Planche latérale'])),
  reverseplank: held(ex('Gainage inversé', 'bodyweight', 'isolation', ['core'], ['Planche inversée'])),
  hollow: held(ex('Gainage creux', 'bodyweight', 'isolation', ['core'], ['Hollow hold'])),
  lsit: held(ex('L-sit', 'bodyweight', 'isolation', ['core'])),
  wallsit: held(ex('Chaise', 'bodyweight', 'isolation', ['legs'], ['Chaise contre le mur'])),
  deadhang: held(ex('Suspension barre', 'bodyweight', 'isolation', ['back'])),
  farmer: held(ex('Marche du fermier', 'dumbbell', 'compound', ['arms', 'back', 'core'], ['Farmer walk'])),
} satisfies Record<string, ExerciseDef>;

export const FULL_BODY = {
  powerclean: ex('Power clean', 'barbell', 'compound', ['legs', 'back', 'shoulders'], ['Épaulé']),
  cleanjerk: ex('Épaulé-jeté', 'barbell', 'compound', ['legs', 'shoulders', 'back']),
  snatch: ex('Arraché', 'barbell', 'compound', ['legs', 'shoulders', 'back']),
  thruster: ex('Thruster', 'barbell', 'compound', ['legs', 'shoulders', 'triceps'], ['Thruster barre']),
  burpee: ex('Burpees', 'bodyweight', 'compound', ['legs', 'chest', 'core'], ['Burpee']),
  getup: kettlebell(ex('Turkish get-up', 'dumbbell', 'compound', ['core', 'shoulders', 'legs'], ['Relevé turc'])),
} satisfies Record<string, ExerciseDef>;
