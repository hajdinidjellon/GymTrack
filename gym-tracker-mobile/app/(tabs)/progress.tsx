import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius } from '@/constants/theme';
import { formatShortDay } from '@/domain/format';
import { formatKg, platesForSide } from '@/domain/plates';
import { EXERCISES } from '@/domain/programs';
import { weightHistory } from '@/domain/sessionBuilder';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ChevronRight } from '@/components/ui/icons';
import { Barbell } from '@/components/disc/Barbell';

interface LiftProgress {
  name: string;
  barbell: boolean;
  first: { date: string; weight: number };
  last: { date: string; weight: number };
}

/** "un disque de 5" / "un 10 et un 2,5" */
function platesPhrase(plates: number[]): string {
  if (plates.length === 1) return `un disque de ${formatKg(plates[0]!)}`;
  const list = plates.map((p) => `un ${formatKg(p)}`);
  const last = list.pop()!;
  return `${list.join(', ')} et ${last}`;
}

export default function Progress() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const bar = useSettingsStore((s) => s.settings.barWeight);
  const available = useSettingsStore((s) => s.settings.plates);

  const lifts = useMemo<LiftProgress[]>(() => {
    return Object.values(EXERCISES).flatMap((def) => {
      const history = weightHistory(def, workouts);
      const first = history[0];
      const last = history[history.length - 1];
      if (!first || !last) return [];
      return [{ name: def.name, barbell: def.equipment === 'barbell', first, last }];
    });
  }, [workouts]);

  // La plus belle progression à la barre, racontée en disques
  const hero = lifts
    .filter((l) => l.barbell && l.last.weight > l.first.weight)
    .sort((a, b) => b.last.weight - b.first.weight - (a.last.weight - a.first.weight))[0];

  const loadOf = (w: number) => platesForSide(Math.max(0, (w - bar) / 2), available);

  return (
    <Screen tabs scroll>
      {hero ? (
        <>
          <Text size={16} weight="semibold" color={colors.muted} style={{ marginTop: 12 }}>
            {hero.name} · depuis le {formatShortDay(hero.first.date).toLowerCase()}
          </Text>
          <Text size={36} weight="black" style={{ marginTop: 4, lineHeight: 38 }}>
            Tu as gagné {platesPhrase(platesForSide((hero.last.weight - hero.first.weight) / 2, available))} de chaque
            côté.
          </Text>
          {[hero.first, hero.last].map((point, i) => {
            const before = loadOf(hero.first.weight);
            const after = loadOf(point.weight);
            // Les disques déjà là au départ sont estompés, ceux gagnés sont pleins
            let shared = 0;
            while (i > 0 && shared < before.length && before[shared] === after[shared]) shared++;
            if (i === 0) shared = after.length;
            return (
              <Card
                key={i}
                style={{ marginTop: 16, borderRadius: radius.lg - 2, paddingHorizontal: 18, paddingBottom: 12 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <Text size={16} weight="semibold" color={colors.muted}>
                    {i === 0 ? 'Au début' : "Aujourd'hui"}
                  </Text>
                  <Text size={32} weight="black">
                    {formatKg(point.weight)} kg
                  </Text>
                </View>
                <View style={{ marginTop: 4, height: 108, justifyContent: 'center' }}>
                  <Barbell perSide={after} barWidth={90} highlightFrom={shared} />
                </View>
              </Card>
            );
          })}
        </>
      ) : (
        <>
          <Text size={40} weight="black" style={{ marginTop: 12, lineHeight: 42 }}>
            Tes progrès
          </Text>
          <Text size={18} color={colors.muted} style={{ marginTop: 10, lineHeight: 25 }}>
            Dès que tu auras ajouté un disque sur un mouvement à la barre, on te le montre ici.
          </Text>
        </>
      )}

      <View style={{ gap: 10, marginTop: 16 }}>
        {lifts.map((l) => {
          const diff = l.last.weight - l.first.weight;
          return (
            <Pressable
              key={l.name}
              onPress={() => router.push({ pathname: '/exercise/[name]', params: { name: l.name } })}
              accessibilityRole="button"
              style={({ pressed }) => ({
                height: 64,
                borderRadius: radius.md - 2,
                backgroundColor: colors.surface,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text size={18} weight="bold" numberOfLines={1} style={{ flex: 1 }}>
                {l.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text size={17} weight="black">
                  {diff > 0 ? `+${formatKg(diff)} kg` : `${formatKg(l.last.weight)} kg`}
                </Text>
                <ChevronRight size={20} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
