/**
 * Sets and reps shared between similar exercises: 2 × 6-9 on the chest press
 * also goes to the bench press, the Smith bench… The ones the user set
 * differently on purpose keep their own.
 */

import { listFr } from '@/domain/format';
import { clampRule, ruleFor, similarExercises, type ExerciseDef } from '@/domain/programs';
import type { CustomExercise, Goal, RuleOverride } from '@/types';

export interface RuleContext {
  goal: Goal;
  own: CustomExercise[];
  overrides: Record<string, RuleOverride>;
}

const sameRule = (a: RuleOverride, b: RuleOverride) =>
  a.sets === b.sets && a.repMin === b.repMin && a.repMax === b.repMax;

function goalRule(goal: Goal, def: ExerciseDef): RuleOverride {
  const { sets, repMin, repMax } = ruleFor(goal, def, 0);
  return { sets, repMin, repMax };
}

/** The sets and reps an exercise runs on: the user's own, else the goal's. */
export function effectiveRule(def: ExerciseDef, ctx: RuleContext): RuleOverride {
  const own = ctx.overrides[def.name];
  return own ? clampRule(own) : goalRule(ctx.goal, def);
}

/** The similar exercises on the same sets and reps as this one: they follow its changes. */
export function followers(def: ExerciseDef, ctx: RuleContext): ExerciseDef[] {
  const current = effectiveRule(def, ctx);
  return similarExercises(def, ctx.own).filter((e) => sameRule(effectiveRule(e, ctx), current));
}

/**
 * The overrides once `def` gets a new rule (`null`: back to the goal's).
 * With `similar`, its followers get it too. A rule equal to an exercise's
 * goal rule is not stored: nothing to undo there.
 */
export function applyRule(
  def: ExerciseDef,
  next: RuleOverride | null,
  ctx: RuleContext,
  similar: boolean,
): Record<string, RuleOverride> {
  const targets = [def, ...(similar ? followers(def, ctx) : [])];
  const overrides = { ...ctx.overrides };
  for (const e of targets) {
    const rule = next && clampRule(next);
    if (!rule || sameRule(rule, goalRule(ctx.goal, e))) delete overrides[e.name];
    else overrides[e.name] = rule;
  }
  return overrides;
}

/** "Développé couché, Smith et Dips", or the first three and "+ 4 autres". */
export function followersLabel(names: string[], shown = 3): string {
  if (names.length <= shown) return listFr(names);
  const more = names.length - shown;
  return `${names.slice(0, shown).join(', ')} + ${more} autre${more > 1 ? 's' : ''}`;
}
