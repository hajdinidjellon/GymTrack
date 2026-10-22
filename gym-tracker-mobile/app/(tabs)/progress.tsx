import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, space } from '@/constants/theme';
import { formatShortDay, formatThousands } from '@/domain/format';
import { formatKg, platesForSide, platesPhrase } from '@/domain/plates';
import { EXERCISES } from '@/domain/programs';
import { tonnage, weightHistory } from '@/domain/sessionBuilder';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Button } from '@/components/ui/Button';
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

  const thisMonth = workouts.filter((w) => new Date(w.date) >= startOfMonth());
  const monthTonnage = thisMonth.reduce((sum, w) => sum + tonnage(w), 0);

  if (workouts.length === 0) {
    return (
      <Screen tabs footer={<Button label="Voir la séance du jour" onPress={() => router.navigate('/')} />}>
        <ScreenHeader title="Progrès" subtitle="Ce que tu as gagné depuis le début, en disques." />
        <Card style={{ marginTop: space.sm }}>
          <Text size={20} weight="black">
            Rien à montrer pour l'instant
          </Text>
          <Text size={17} color={colors.muted} style={{ marginTop: space.sm, lineHeight: 23 }}>
            Fais ta première séance : dès que tu ajoutes un disque sur un mouvement, ta progression s'affiche ici.
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen tabs scroll>
      <ScreenHeader title="Progrès" subtitle="Ce que tu as gagné depuis le début, en disques." />

      <SectionTitle title="Ce mois-ci" first />
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Stat value={String(thisMonth.length)} label={thisMonth.length > 1 ? 'séances' : 'séance'} />
        <Stat value={`${formatThousands(monthTonnage)} kg`} label="soulevés" />
      </View>

      {hero ? (
        <>
          <SectionTitle title="Ta plus belle progression" />
          <Text size={16} weight="semibold" color={colors.muted}>
            {hero.name} · depuis le {formatShortDay(hero.first.date).toLowerCase()}
          </Text>
          <Text size={30} weight="black" style={{ marginTop: 4, lineHeight: 34 }}>
            Tu as gagné {platesPhrase((hero.last.weight - hero.first.weight) / 2, available)} de chaque côté.
          </Text>
          {[hero.first, hero.last].map((point, i) => {
            const before = loadOf(hero.first.weight);
            const after = loadOf(point.weight);
            // Les disques déjà là au départ sont estompés, ceux gagnés sont pleins
            let shared = 0;
            while (i > 0 && shared < before.length && before[shared] === after[shared]) shared++;
            if (i === 0) shared = after.length;
            return (
              <Card key={i} style={{ marginTop: space.md, paddingHorizontal: 18, paddingBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <Text size={16} weight="semibold" color={colors.muted}>
                    {i === 0 ? 'Au début' : 'Maintenant'}
                  </Text>
                  <Text size={28} weight="black">
                    {formatKg(point.weight)} kg
                  </Text>
                </View>
                <View style={{ marginTop: 4, height: 100, justifyContent: 'center' }}>
                  <Barbell perSide={after} barWidth={90} highlightFrom={shared} />
                </View>
              </Card>
            );
          })}
        </>
      ) : null}

      {lifts.length ? (
        <>
          <SectionTitle
            title="Tous tes exercices"
            right={
              <Text size={14} color={colors.muted}>
                depuis le début
              </Text>
            }
          />
          <View style={{ gap: space.sm + 2 }}>
            {lifts.map((l) => {
              const diff = l.last.weight - l.first.weight;
              return (
                <Pressable
                  key={l.name}
                  onPress={() => router.push({ pathname: '/exercise/[name]', params: { name: l.name } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${l.name}, ${formatKg(l.last.weight)} kilos${diff > 0 ? `, plus ${formatKg(diff)} depuis le début` : ''}`}
                  style={({ pressed }) => ({
                    minHeight: 64,
                    borderRadius: radius.md - 2,
                    backgroundColor: colors.surface,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: space.md,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <Text size={18} weight="bold" numberOfLines={1}>
                      {l.name}
                    </Text>
                    <Text size={14} color={colors.muted}>
                      {formatKg(l.last.weight)} kg aujourd'hui
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text size={17} weight="black">
                      {diff > 0 ? `+${formatKg(diff)} kg` : '='}
                    </Text>
                    <ChevronRight size={20} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function startOfMonth(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card style={{ flex: 1, paddingVertical: 14 }}>
      <Text size={30} weight="black" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text size={15} weight="semibold" color={colors.muted}>
        {label}
      </Text>
    </Card>
  );
}
