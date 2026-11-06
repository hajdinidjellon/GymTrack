/** Biceps, triceps et avant-bras ("Bras"). */

import { ex, onCable, type ExerciseDef } from '@/domain/catalog/define';

export const BICEPS = {
  curl: ex('Curl haltères', 'dumbbell', 'isolation', ['biceps'], ['Curl biceps haltères', 'Curl alterné']),
  barcurl: ex('Curl barre', 'barbell', 'isolation', ['biceps'], ['Curl biceps barre']),
  ezcurl: ex('Curl barre EZ', 'barbell', 'isolation', ['biceps']),
  hammer: ex('Curl marteau', 'dumbbell', 'isolation', ['biceps'], ['Curl marteau haltères']),
  inclinecurl: ex('Curl incliné haltères', 'dumbbell', 'isolation', ['biceps']),
  concentration: ex('Curl concentré', 'dumbbell', 'isolation', ['biceps'], ['Curl concentration']),
  preacher: ex('Curl pupitre', 'machine', 'isolation', ['biceps'], ['Larry Scott']),
  barpreacher: ex('Curl pupitre barre', 'barbell', 'isolation', ['biceps'], ['Larry Scott barre']),
  dbpreacher: ex('Curl pupitre haltère', 'dumbbell', 'isolation', ['biceps'], ['Larry Scott haltère']),
  machinecurl: ex('Curl biceps machine', 'machine', 'isolation', ['biceps']),
  cablecurl: onCable(ex('Curl poulie', 'machine', 'isolation', ['biceps'], ['Curl poulie basse'])),
  ropehammer: onCable(ex('Curl marteau corde', 'machine', 'isolation', ['biceps'], ['Curl corde poulie'])),
  overheadcurl: onCable(ex('Curl poulie haute', 'machine', 'isolation', ['biceps'], ['Curl vis-à-vis'])),
  bayesian: onCable(ex('Curl Bayesian', 'machine', 'isolation', ['biceps'], ['Curl poulie derrière le corps'])),
  spider: ex('Spider curl', 'dumbbell', 'isolation', ['biceps']),
  zottman: ex('Curl Zottman', 'dumbbell', 'isolation', ['biceps', 'arms']),
  reversecurl: ex('Curl inversé barre', 'barbell', 'isolation', ['biceps', 'arms'], ['Curl pronation']),
  wristcurl: ex('Curl poignets', 'barbell', 'isolation', ['arms'], ['Flexion des poignets']),
  wristext: ex('Extension poignets', 'barbell', 'isolation', ['arms'], ['Curl poignets inversé']),
} satisfies Record<string, ExerciseDef>;

export const TRICEPS = {
  pushdown: onCable(
    ex('Extension triceps poulie', 'machine', 'isolation', ['triceps'], ['Pushdown', 'Extension triceps barre poulie']),
  ),
  ropepushdown: onCable(
    ex('Extension triceps corde', 'machine', 'isolation', ['triceps'], ['Pushdown corde', 'Triceps corde']),
  ),
  singlepushdown: onCable(ex('Extension triceps poulie unilatérale', 'machine', 'isolation', ['triceps'])),
  overhead: onCable(ex('Extension triceps nuque poulie', 'machine', 'isolation', ['triceps'])),
  dbext: ex('Extension triceps haltère', 'dumbbell', 'isolation', ['triceps'], ['Extension nuque haltère']),
  machineext: ex('Extension triceps machine', 'machine', 'isolation', ['triceps']),
  skull: ex('Barre au front', 'barbell', 'isolation', ['triceps'], ['Skull crusher']),
  dbskull: ex('Barre au front haltères', 'dumbbell', 'isolation', ['triceps'], ['Skull crusher haltères']),
  closegrip: ex('Développé couché prise serrée', 'barbell', 'compound', ['triceps', 'chest']),
  jmpress: ex('JM press', 'barbell', 'compound', ['triceps', 'chest']),
  dipsmachine: ex('Dips machine', 'machine', 'compound', ['triceps', 'chest']),
  benchdips: ex(
    'Dips banc',
    'bodyweight',
    'compound',
    ['triceps', 'chest'],
    ['Dips entre deux bancs', 'Dips sur banc'],
  ),
  diamond: ex('Pompes diamant', 'bodyweight', 'compound', ['triceps', 'chest']),
  closepushup: ex('Pompes prise serrée', 'bodyweight', 'compound', ['triceps', 'chest'], ['Pompes serrées']),
  kickback: ex('Kickback triceps', 'dumbbell', 'isolation', ['triceps'], ['Kickback triceps haltère']),
  cablekickback: onCable(ex('Kickback triceps poulie', 'machine', 'isolation', ['triceps'])),
} satisfies Record<string, ExerciseDef>;
