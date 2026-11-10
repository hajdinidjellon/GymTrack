/**
 * The user's own name for a catalog exercise ("DC lourd" for "Développé couché"). Only the
 * name shown changes: the exercise, its history and its progression stay the same.
 */

import { cleanName } from '@/domain/customProgram';
import { allExercises } from '@/domain/programs';
import { catalogName, exerciseName, t } from '@/i18n';
import type { AppSettings } from '@/types';

type Settings = Pick<AppSettings, 'exerciseNicknames' | 'customExercises'>;

/**
 * The nicknames once `typed` is given to `name`. Empty, or the exercise's own name: back to
 * it. Another exercise already shown under that name: the error to show.
 */
export function withNickname(
  settings: Settings,
  name: string,
  typed: string,
): { nicknames: Record<string, string> } | { error: string } {
  const clean = cleanName(typed);
  const { [name]: _old, ...others } = settings.exerciseNicknames;
  if (!clean || clean === name || clean === catalogName(name)) return { nicknames: others };
  const taken = allExercises(settings.customExercises).some(
    (def) =>
      def.name !== name && [def.name, exerciseName(def.name)].some((n) => n.toLowerCase() === clean.toLowerCase()),
  );
  return taken ? { error: t('domain.nicknames.taken') } : { nicknames: { ...others, [name]: clean } };
}
