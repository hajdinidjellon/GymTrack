import React, { useState } from 'react';
import { View } from 'react-native';
import type { ExerciseDef } from '@/domain/programs';
import { effectiveRule, followers, followersLabel } from '@/domain/ruleSync';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Goal, RuleOverride } from '@/types';
import { CheckRow } from '@/components/ui/CheckRow';
import { RuleEditor } from './RuleEditor';
import { exerciseName, t } from '@/i18n';

interface Props {
  /** No weight to add: the reps climb with no ceiling. */
  bodyweight?: boolean;
  def: ExerciseDef;
  goal: Goal;
  /** The goal's rule, to go back to. */
  base: RuleOverride;
}

/**
 * Sets and reps of an exercise. By default, the similar exercises on the
 * same rule change with it: 2 × 6-9 on the chest press, on the bench too.
 */
export function SharedRuleEditor({ def, goal, base, bodyweight }: Props) {
  const overrides = useSettingsStore((s) => s.settings.ruleOverrides);
  const own = useSettingsStore((s) => s.settings.customExercises);
  const setRule = useSettingsStore((s) => s.setRule);
  const [similar, setSimilar] = useState(true);

  const ctx = { goal, own, overrides };
  const following = followers(def, ctx).map((e) => exerciseName(e.name));

  return (
    <View style={{ gap: 12 }}>
      {/* Read before the first tap: it says what the buttons below will change */}
      {following.length ? (
        <CheckRow
          label={t('program.rule.similar')}
          detail={followersLabel(following)}
          checked={similar}
          onChange={setSimilar}
        />
      ) : null}
      <RuleEditor
        rule={effectiveRule(def, ctx)}
        base={base}
        custom={def.name in overrides}
        bodyweight={bodyweight}
        timed={def.timed}
        onChange={(rule) => setRule(def, rule, goal, similar)}
        onReset={() => setRule(def, null, goal, similar)}
      />
    </View>
  );
}
