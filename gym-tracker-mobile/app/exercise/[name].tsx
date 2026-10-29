import React from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { border, colors, radius, space } from '@/constants/theme';
import { useBuildContext } from '@/hooks/useTodayPlan';
import { formatClock, formatRest, formatShortDay } from '@/domain/format';
import { clampRest, REST_STEP } from '@/domain/rest';
import { formatKg } from '@/domain/plates';
import { defaultIncrementFor, findExerciseDef, ruleFor } from '@/domain/programs';
import { referenceWeight, workingSets } from '@/domain/progression';
import { exerciseHistory, lastTimeLabel, planLift, reasonLabel, weightHistory } from '@/domain/sessionBuilder';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { StickerCard } from '@/components/ui/StickerCard';
import { BackButton } from '@/components/ui/BackButton';
import { LoadedBar } from '@/components/disc/LoadedBar';
import { Sparkline } from '@/components/stats/Sparkline';
import { buzz, PressableScale } from '@/components/ui/PressableScale';
import { RuleEditor } from '@/components/program/RuleEditor';
import { ExerciseNote } from '@/components/session/ExerciseNote';

const STEPS = [1, 2, 2.5, 5];

const EQUIPMENT = { barbell: 'Barre', dumbbell: 'Haltères', machine: 'Machine', bodyweight: 'Poids du corps' };

export default function ExerciseScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const ctx = useBuildContext();
  const def = findExerciseDef(name ?? '', ctx?.settings.customExercises);
  const setIncrement = useSettingsStore((s) => s.setIncrement);
  const setRuleOverride = useSettingsStore((s) => s.setRuleOverride);
  const overrides = useSettingsStore((s) => s.settings.ruleOverrides);
  const setRestOverride = useSettingsStore((s) => s.setRestOverride);

  if (!def || !ctx) {
    return (
      <Screen>
        <BackButton />
        <Text size={20} style={{ marginTop: 20 }}>
          Exercice introuvable.
        </Text>
      </Screen>
    );
  }

  const lift = planLift(def, ctx);
  const target = lift.targets[0];
  const history = exerciseHistory(def, ctx.workouts).slice(0, 5);
  const bodyweight = def.equipment === 'bodyweight';
  const weights = weightHistory(def, ctx.workouts).map((p) => p.weight);
  const base = ruleFor(ctx.profile.goal, def, defaultIncrementFor(def.equipment, ctx.settings.units));

  return (
    <Screen scroll>
      <BackButton />
      <ScreenHeader eyebrow={`${EQUIPMENT[def.equipment]}${def.custom ? ' · ton exercice' : ''}`} title={def.name} />

      <StickerCard tone="hero">
        <Text size={15} weight="bold">
          Prochaine cible
        </Text>
        <Text size={34} weight="black" style={{ lineHeight: 42 }}>
          {lift.decision === 'calibrate'
            ? 'À régler'
            : target && target.weight > 0
              ? `${formatKg(target.weight)} kg × ${target.reps}`
              : `${target?.reps ?? 0} reps`}
        </Text>
        <View
          style={{
            marginTop: 8,
            alignSelf: 'flex-start',
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: radius.input,
            borderWidth: 2,
            borderColor: colors.ink,
            backgroundColor: colors.sun,
          }}
        >
          <Text size={14} weight="semibold" style={{ lineHeight: 19 }}>
            {reasonLabel(lift)}
          </Text>
        </View>
        {lift.last.length ? (
          <Text size={15} style={{ marginTop: 8 }}>
            Dernière fois : {lastTimeLabel(lift.last)}
          </Text>
        ) : null}
        {def.equipment === 'barbell' && target && target.weight > 0 ? (
          <View style={{ marginTop: 8, height: 80, justifyContent: 'center' }}>
            <LoadedBar weight={target.weight} scale={0.77} barWidth={110} />
          </View>
        ) : null}
      </StickerCard>

      <StickerCard style={{ marginTop: 16, gap: space.sm }}>
        <Text size={17} weight="black">
          Ta note
        </Text>
        <ExerciseNote exerciseName={def.name} />
      </StickerCard>

      {weights.length > 1 ? (
        <StickerCard style={{ marginTop: 16, gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text size={17} weight="black">
              Ta charge
            </Text>
            <Text size={14} weight="bold" color={colors.inkMuted}>
              {formatKg(weights[0]!)} → {formatKg(weights[weights.length - 1]!)} kg
            </Text>
          </View>
          <Sparkline values={weights} height={72} />
        </StickerCard>
      ) : null}

      <StickerCard style={{ marginTop: 16 }}>
        <Text size={17} weight="black" style={{ marginBottom: 12 }}>
          Tes séries et tes reps
        </Text>
        <RuleEditor
          rule={lift.rule}
          base={base}
          custom={def.name in overrides}
          onChange={(rule) => setRuleOverride(def.name, rule)}
          onReset={() => setRuleOverride(def.name, null)}
        />
        {!bodyweight ? (
          <>
            <Text size={16} weight="semibold" color={colors.inkMuted} style={{ marginTop: 14 }}>
              Ajouter à chaque palier
            </Text>
            <View
              accessibilityRole="radiogroup"
              style={{
                flexDirection: 'row',
                marginTop: 10,
                padding: 4,
                gap: 4,
                borderRadius: radius.pill,
                borderWidth: border.base,
                borderColor: colors.ink,
                backgroundColor: colors.paper,
              }}
            >
              {STEPS.map((v) => {
                const on = lift.rule.increment === v;
                return (
                  <PressableScale
                    key={v}
                    haptic="selection"
                    onPress={() => setIncrement(def.name, v)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${formatKg(v)} kilos par palier`}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: radius.pill,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: on ? border.base : 0,
                      borderColor: colors.ink,
                      backgroundColor: on ? colors.coralSoft : 'transparent',
                    }}
                  >
                    <Text size={15} weight="black" color={on ? colors.ink : colors.inkMuted}>
                      +{formatKg(v)} kg
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </>
        ) : null}
      </StickerCard>

      <StickerCard style={{ marginTop: 16, gap: 10 }}>
        <Text size={17} weight="black">
          Ton repos entre les séries
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <RoundButton
            label="−"
            a11y="Repos : moins 15 secondes"
            onPress={() => setRestOverride(def.name, clampRest(lift.restTime - REST_STEP))}
          />
          <Text size={34} weight="black" accessibilityLabel={`Repos : ${formatRest(lift.restTime)}`}>
            {formatClock(lift.restTime)}
          </Text>
          <RoundButton
            label="+"
            a11y="Repos : plus 15 secondes"
            onPress={() => setRestOverride(def.name, clampRest(lift.restTime + REST_STEP))}
          />
        </View>
        <Text size={14} color={colors.inkMuted} style={{ lineHeight: 19 }}>
          {lift.restNote ||
            "Ton repos par défaut. Si tu te reposes plus ou moins longtemps d'habitude, le minuteur s'adaptera."}
        </Text>
        {lift.restSource === 'own' ? (
          <Pressable
            onPress={() => setRestOverride(def.name, null)}
            accessibilityRole="button"
            hitSlop={8}
            style={{ alignSelf: 'flex-start' }}
          >
            <Text size={14} weight="bold" color={colors.inkMuted} style={{ textDecorationLine: 'underline' }}>
              Laisser l'app choisir
            </Text>
          </Pressable>
        ) : null}
      </StickerCard>

      {history.length ? (
        <>
          <Text size={19} weight="black" style={{ marginTop: 24 }}>
            Dernières séances
          </Text>
          <View style={{ marginTop: 4 }}>
            {history.map((h, i) => {
              const sets = workingSets(h.sets);
              const w = referenceWeight(sets);
              return (
                <View
                  key={h.date}
                  style={{
                    height: 52,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomWidth: i < history.length - 1 ? 2 : 0,
                    borderBottomColor: colors.line,
                  }}
                >
                  <Text size={16} color={colors.inkMuted}>
                    {formatShortDay(h.date)}
                  </Text>
                  <Text size={18} weight="black">
                    {w > 0 ? `${formatKg(w)} × ` : ''}
                    {sets.map((s) => s.reps).join(' · ')}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function RoundButton({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        buzz('selection');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => ({
        width: 52,
        height: 52,
        borderRadius: radius.pill,
        borderWidth: border.base,
        borderColor: colors.ink,
        backgroundColor: pressed ? colors.coralSoft : colors.card,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text size={26} weight="black">
        {label}
      </Text>
    </Pressable>
  );
}
