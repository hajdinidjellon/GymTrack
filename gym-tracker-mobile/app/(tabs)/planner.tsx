import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { NumericInput } from '@/components/ui/Input';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { getSuggestedSession, generatePRProgression, generateWarmupSets } from '@/lib/aiPlanner';
import type { TrainingPlan, MuscleGroup } from '@/types';
import { MUSCLE_LABELS } from '@/lib/gamification';

export default function PlannerScreen() {
  const { workouts } = useWorkoutStore();
  const { profile, goals, saveGoal } = useProfileStore();

  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [planTarget, setPlanTarget] = useState(100);
  const [planWeeks, setPlanWeeks] = useState(12);

  const suggested = profile
    ? getSuggestedSession(profile, workouts, activePlan)
    : null;

  const handleGeneratePlan = () => {
    if (!profile) {
      Alert.alert('Profil requis', 'Configure ton profil avant de créer un plan.');
      return;
    }
    const benchPR = profile.prs.find((p) =>
      p.exercise.toLowerCase().includes('couché'),
    );
    const current = benchPR?.oneRepMax ?? 60;

    const plan = generatePRProgression({
      exerciseName: benchPR?.exercise ?? 'Développé couché',
      currentMax: current,
      targetMax: planTarget,
      weeks: planWeeks,
      frequency: profile.trainingFrequency,
      experienceLevel: profile.experienceLevel,
      trainingGoal: 'strength',
    });

    setActivePlan(plan);
    setShowNewPlan(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <ScrollView contentContainerClassName="px-5 py-4 gap-6 pb-8">
        <Text className="text-2xl font-black text-text-primary">
          Planificateur
        </Text>

        {/* Suggestion du jour */}
        {suggested && (
          <View className="gap-2">
            <Text className="text-base font-semibold text-text-primary">
              Suggestion d'aujourd'hui
            </Text>
            <Card padding="md" className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-text-primary">
                  {suggested.title}
                </Text>
                <Text className="text-sm text-text-muted">
                  ~{suggested.estimatedDuration} min
                </Text>
              </View>
              <Text className="text-sm text-text-secondary">
                {suggested.reason}
              </Text>

              {/* Exercices prévus */}
              <View className="gap-1.5">
                {suggested.exercises.slice(0, 4).map((ex) => (
                  <View
                    key={ex.name}
                    className="flex-row items-center gap-2 py-1"
                  >
                    <Text className="text-xs text-text-muted w-4">
                      {ex.category === 'compound' ? '🏋️' : '💪'}
                    </Text>
                    <Text className="flex-1 text-sm text-text-primary">
                      {ex.name}
                    </Text>
                    <Text className="text-xs text-text-muted">
                      {ex.targetSets}×
                      {typeof ex.targetReps === 'number'
                        ? ex.targetReps
                        : `${ex.targetReps[0]}-${ex.targetReps[1]}`}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Groupes musculaires focus */}
              <View className="flex-row flex-wrap gap-1">
                {suggested.focus.map((m) => (
                  <View
                    key={m}
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(6,182,212,0.15)' }}
                  >
                    <Text className="text-xs text-brand-secondary">
                      {MUSCLE_LABELS[m]}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* Calculateur d'échauffement */}
        <WarmupCalculator profile={profile} />

        {/* Plan actif */}
        {activePlan ? (
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-text-primary">
                Programme actif
              </Text>
              <Pressable onPress={() => setActivePlan(null)}>
                <Text className="text-xs text-status-danger">Supprimer</Text>
              </Pressable>
            </View>
            <Card padding="md" className="gap-3">
              <Text className="text-base font-bold text-text-primary">
                {activePlan.name}
              </Text>
              <Text className="text-sm text-text-muted">
                {activePlan.duration} semaines · {activePlan.frequency}×/semaine
              </Text>
              <Text className="text-xs text-text-secondary uppercase tracking-wider">
                Algorithme : {activePlan.algorithm}
              </Text>

              {/* Semaines */}
              <View className="gap-2 mt-2">
                {activePlan.weeks.slice(0, 4).map((week) => (
                  <View key={week.weekNumber} className="gap-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-text-secondary">
                        Semaine {week.weekNumber}
                        {week.deloadWeek ? ' (Deload)' : ''}
                      </Text>
                      <Text className="text-xs text-text-muted">
                        {week.intensity}% · {week.volume} reps
                      </Text>
                    </View>
                    <ProgressBar
                      progress={week.intensity}
                      color={week.deloadWeek ? '#f59e0b' : '#7c3aed'}
                      height={4}
                      animated={false}
                    />
                  </View>
                ))}
                {activePlan.weeks.length > 4 && (
                  <Text className="text-xs text-text-muted text-center">
                    + {activePlan.weeks.length - 4} semaines...
                  </Text>
                )}
              </View>
            </Card>
          </View>
        ) : (
          <View className="gap-2">
            <Text className="text-base font-semibold text-text-primary">
              Créer un programme
            </Text>

            {showNewPlan ? (
              <Card padding="md" className="gap-4">
                <Text className="text-sm font-semibold text-text-primary">
                  Programme force (Développé couché)
                </Text>

                <View className="gap-2">
                  <Text className="text-xs text-text-muted">
                    Objectif (kg) :{' '}
                    <Text className="text-text-primary font-bold">
                      {planTarget}
                    </Text>
                  </Text>
                  <NumericInput
                    value={planTarget}
                    onChange={setPlanTarget}
                    min={40}
                    max={300}
                    step={5}
                    suffix="kg"
                  />
                </View>

                <View className="gap-2">
                  <Text className="text-xs text-text-muted">
                    Durée : <Text className="text-text-primary font-bold">{planWeeks}</Text> semaines
                  </Text>
                  <View className="flex-row gap-2">
                    {[8, 12, 16, 20].map((w) => (
                      <Pressable
                        key={w}
                        onPress={() => setPlanWeeks(w)}
                        className={`flex-1 py-2 rounded-lg items-center ${planWeeks === w ? 'bg-brand-primary' : 'bg-white/[0.08]'}`}
                      >
                        <Text className={`text-sm font-medium ${planWeeks === w ? 'text-white' : 'text-text-secondary'}`}>
                          {w}s
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <Button
                    label="Générer le plan"
                    variant="primary"
                    size="md"
                    onPress={handleGeneratePlan}
                  />
                  <Button
                    label="Annuler"
                    variant="ghost"
                    size="md"
                    onPress={() => setShowNewPlan(false)}
                  />
                </View>
              </Card>
            ) : (
              <Button
                label="+ Créer un programme de force"
                variant="secondary"
                size="md"
                fullWidth
                onPress={() => setShowNewPlan(true)}
              />
            )}
          </View>
        )}

        {/* Objectifs actifs */}
        {goals.filter((g) => g.status === 'active').length > 0 && (
          <View className="gap-2">
            <Text className="text-base font-semibold text-text-primary">
              Objectifs actifs
            </Text>
            {goals
              .filter((g) => g.status === 'active')
              .map((goal) => (
                <Card key={goal.id} padding="md" className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-text-primary">
                      {goal.exercise ?? goal.type}
                    </Text>
                    <Text className="text-xs text-text-muted">
                      {goal.currentValue} → {goal.targetValue}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={goal.progress}
                    showLabel
                    animated
                  />
                </Card>
              ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Calculateur d'échauffement ────────────────────────────────

function WarmupCalculator({ profile }: { profile: ReturnType<typeof useProfileStore.getState>['profile'] }) {
  const [workingWeight, setWorkingWeight] = useState(80);

  const warmups = generateWarmupSets(workingWeight);

  return (
    <View className="gap-2">
      <Text className="text-base font-semibold text-text-primary">
        Calculateur d'échauffement
      </Text>
      <Card padding="md" className="gap-3">
        <View className="flex-row items-center gap-3">
          <Text className="text-sm text-text-secondary">Poids de travail</Text>
          <NumericInput
            value={workingWeight}
            onChange={setWorkingWeight}
            min={20}
            max={400}
            step={2.5}
            suffix="kg"
          />
        </View>

        <View className="gap-1.5">
          {warmups.map((set, i) => (
            <View
              key={i}
              className="flex-row items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.04]"
            >
              <Text className="text-xs text-brand-secondary w-5">W{i + 1}</Text>
              <Text className="flex-1 text-sm font-medium text-text-primary">
                {set.weight}kg × {set.reps} reps
              </Text>
              <Text className="text-xs text-text-muted">
                {set.restTime}s repos
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}
