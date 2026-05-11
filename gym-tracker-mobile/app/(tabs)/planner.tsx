import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { NumericInput } from '@/components/ui/Input';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { getSuggestedSession, generatePRProgression, generateWarmupSets } from '@/lib/aiPlanner';
import { MUSCLE_LABELS } from '@/lib/gamification';
import { colors } from '@/constants/theme';
import type { TrainingPlan } from '@/types';

// ── Label section ────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name={icon} size={18} color={colors.brand.primary} />
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text.primary, letterSpacing: -0.3 }}>
          {title}
        </Text>
      </View>
      {subtitle && (
        <Text style={{ fontSize: 13, color: colors.text.muted, marginLeft: 26 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export default function PlannerScreen() {
  const { workouts } = useWorkoutStore();
  const { profile, goals, saveGoal } = useProfileStore();

  const [activePlan, setActivePlan]   = useState<TrainingPlan | null>(null);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [planTarget, setPlanTarget]   = useState(100);
  const [planWeeks, setPlanWeeks]     = useState(12);

  const suggested = profile ? getSuggestedSession(profile, workouts, activePlan) : null;

  const handleGeneratePlan = () => {
    if (!profile) {
      Alert.alert('Profil requis', 'Configure ton profil avant de créer un plan.');
      return;
    }
    const benchPR = profile.prs.find((p) => p.exercise.toLowerCase().includes('couché'));
    const current = benchPR?.oneRepMax ?? 60;

    const plan = generatePRProgression({
      exerciseName:    benchPR?.exercise ?? 'Développé couché',
      currentMax:      current,
      targetMax:       planTarget,
      weeks:           planWeeks,
      frequency:       profile.trainingFrequency,
      experienceLevel: profile.experienceLevel,
      trainingGoal:    'strength',
    });

    setActivePlan(plan);
    setShowNewPlan(false);
  };

  const activeGoals = goals.filter((g) => g.status === 'active');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28, gap: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 2.5, textTransform: 'uppercase' }}>
            Planification
          </Text>
          <Text style={{ fontSize: 36, fontWeight: '900', color: colors.text.primary, letterSpacing: -1, lineHeight: 42 }}>
            Mon plan
          </Text>
        </View>

        {/* ── Suggestion du jour ── */}
        {suggested && (
          <View style={{ paddingHorizontal: 24, marginBottom: 36, gap: 14 }}>
            <SectionHeader
              icon="flash-outline"
              title="Suggestion du jour"
              subtitle="Basée sur tes muscles récupérés et ton historique"
            />

            <LinearGradient
              colors={['rgba(124,58,237,0.18)', 'rgba(6,182,212,0.08)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, padding: 20, gap: 16, borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)' }}
            >
              {/* Titre + durée */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text.primary, flex: 1, letterSpacing: -0.5 }}>
                  {suggested.title}
                </Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text.muted }}>
                    ~{suggested.estimatedDuration} min
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 14, color: colors.text.secondary, lineHeight: 20 }}>
                {suggested.reason}
              </Text>

              {/* Muscles focus */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {suggested.focus.map((m) => (
                  <View key={m} style={{
                    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
                    backgroundColor: 'rgba(124,58,237,0.22)',
                    borderWidth: 1, borderColor: 'rgba(124,58,237,0.40)',
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {MUSCLE_LABELS[m]}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Exercices prévus */}
              <View style={{ gap: 8 }}>
                {suggested.exercises.slice(0, 4).map((ex, i) => (
                  <View key={`${ex.name}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                      width: 32, height: 32, borderRadius: 10,
                      backgroundColor: ex.category === 'compound'
                        ? 'rgba(124,58,237,0.20)'
                        : 'rgba(6,182,212,0.15)',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ionicons
                        name={ex.category === 'compound' ? 'barbell-outline' : 'fitness-outline'}
                        size={16}
                        color={ex.category === 'compound' ? '#a78bfa' : '#67e8f9'}
                      />
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text.primary }}>
                      {ex.name}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text.muted }}>
                      {ex.targetSets}×{typeof ex.targetReps === 'number' ? ex.targetReps : `${ex.targetReps[0]}-${ex.targetReps[1]}`}
                    </Text>
                  </View>
                ))}
                {suggested.exercises.length > 4 && (
                  <Text style={{ fontSize: 13, color: colors.text.muted, marginLeft: 44 }}>
                    + {suggested.exercises.length - 4} exercices
                  </Text>
                )}
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Séparateur */}
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 24, marginBottom: 36 }} />

        {/* ── Calculateur d'échauffement ── */}
        <WarmupSection />

        {/* Séparateur */}
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 24, marginVertical: 36 }} />

        {/* ── Programme de force ── */}
        <View style={{ paddingHorizontal: 24, marginBottom: 36, gap: 14 }}>
          <SectionHeader
            icon="trending-up-outline"
            title="Programme de force"
            subtitle="Génère un plan progressif sur plusieurs semaines"
          />

          {activePlan ? (
            <View style={{ gap: 14 }}>
              {/* Plan actif */}
              <LinearGradient
                colors={['rgba(124,58,237,0.12)', 'rgba(124,58,237,0.04)']}
                style={{ borderRadius: 20, padding: 20, gap: 14, borderWidth: 1, borderColor: 'rgba(124,58,237,0.20)' }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 2, textTransform: 'uppercase' }}>
                      Programme actif
                    </Text>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text.primary, letterSpacing: -0.3 }}>
                      {activePlan.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.text.muted }}>
                      {activePlan.duration} semaines · {activePlan.frequency}×/semaine · {activePlan.algorithm}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setActivePlan(null)}
                    style={{ backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 10, padding: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.status.danger} />
                  </Pressable>
                </View>

                {/* Semaines — avec charges exactes */}
                <View style={{ gap: 12 }}>
                  {activePlan.weeks.map((week) => {
                    const session = week.sessions[0];
                    const ex = session?.exercises[0];
                    return (
                      <View
                        key={week.weekNumber}
                        style={{
                          backgroundColor: week.deloadWeek ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
                          borderRadius: 14, padding: 14, gap: 8,
                          borderWidth: 1,
                          borderColor: week.deloadWeek ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)',
                        }}
                      >
                        {/* Header semaine */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: week.deloadWeek ? '#f59e0b' : colors.text.primary }}>
                              Semaine {week.weekNumber}
                            </Text>
                            {week.deloadWeek && (
                              <View style={{ backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: '#f59e0b' }}>DÉLOAD</Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text.muted }}>
                            {week.intensity}% intensité
                          </Text>
                        </View>

                        {/* Exercice + charges */}
                        {ex && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, color: colors.text.muted }}>{ex.name}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View style={{ backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                                <Text style={{ fontSize: 16, fontWeight: '900', color: '#a78bfa' }}>
                                  {ex.targetWeight ?? '—'} kg
                                </Text>
                              </View>
                              <Text style={{ fontSize: 14, color: colors.text.muted }}>
                                {ex.targetSets}×{typeof ex.targetReps === 'number' ? ex.targetReps : `${ex.targetReps[0]}-${ex.targetReps[1]}`}
                              </Text>
                              {ex.targetRPE && (
                                <Text style={{ fontSize: 12, color: colors.text.muted }}>RPE {ex.targetRPE}</Text>
                              )}
                            </View>
                          </View>
                        )}

                        {/* Barre intensité */}
                        <ProgressBar
                          progress={week.intensity}
                          gradient={week.deloadWeek ? ['#f59e0b', '#d97706'] : ['#7c3aed', '#06b6d4']}
                          height={5}
                          animated={false}
                        />
                      </View>
                    );
                  })}
                </View>
              </LinearGradient>
            </View>
          ) : showNewPlan ? (
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
              style={{ borderRadius: 20, padding: 20, gap: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text.primary }}>
                Développé couché — Programme force
              </Text>

              {/* Objectif */}
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text.muted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Objectif
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <NumericInput value={planTarget} onChange={setPlanTarget} min={40} max={300} step={5} suffix="kg" />
                </View>
              </View>

              {/* Durée */}
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text.muted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Durée
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[8, 12, 16, 20].map((w) => (
                    <Pressable
                      key={w}
                      onPress={() => setPlanWeeks(w)}
                      style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
                    >
                      {planWeeks === w ? (
                        <LinearGradient colors={['#7c3aed', '#06b6d4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 12, alignItems: 'center' }}>
                          <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{w}s</Text>
                        </LinearGradient>
                      ) : (
                        <View style={{ paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 12 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.muted }}>{w}s</Text>
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={handleGeneratePlan} style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}>
                  <LinearGradient colors={['#7c3aed', '#06b6d4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <Ionicons name="sparkles-outline" size={18} color="#fff" />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>Générer</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  onPress={() => setShowNewPlan(false)}
                  style={{ paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.muted }}>Annuler</Text>
                </Pressable>
              </View>
            </LinearGradient>
          ) : (
            <Pressable onPress={() => setShowNewPlan(true)} style={{ borderRadius: 18, overflow: 'hidden' }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                padding: 18,
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
                borderRadius: 18,
              }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(124,58,237,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="add-outline" size={24} color={colors.brand.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text.primary }}>Créer un programme</Text>
                  <Text style={{ fontSize: 13, color: colors.text.muted, marginTop: 2 }}>Progression linéaire, 5/3/1 ou DUP</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
              </View>
            </Pressable>
          )}
        </View>

        {/* ── Objectifs actifs ── */}
        {activeGoals.length > 0 && (
          <View style={{ paddingHorizontal: 24, gap: 14 }}>
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 8 }} />
            <SectionHeader
              icon="flag-outline"
              title="Objectifs actifs"
              subtitle={`${activeGoals.length} objectif${activeGoals.length > 1 ? 's' : ''} en cours`}
            />
            <View style={{ gap: 10 }}>
              {activeGoals.map((goal) => (
                <View
                  key={goal.id}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 16, padding: 16, gap: 10,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text.primary }}>
                      {goal.exercise ?? goal.type}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text.muted }}>
                      {goal.currentValue} → {goal.targetValue}
                    </Text>
                  </View>
                  <ProgressBar progress={goal.progress} gradient={['#7c3aed', '#06b6d4']} height={6} showLabel animated />
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Calculateur d'échauffement ───────────────────────────────────
function WarmupSection() {
  const [weight, setWeight] = useState(80);
  const [targetReps, setTargetReps] = useState(5);
  const sets = generateWarmupSets(weight, targetReps);

  const intensityLabel =
    targetReps <= 2 ? 'Force max (1-2 reps) — montée très progressive' :
    targetReps <= 4 ? 'Force (3-4 reps) — montée progressive'           :
    targetReps <= 6 ? 'Force / Hypertrophie (5-6 reps)'                 :
                      'Hypertrophie (7+ reps) — chauffe légère suffisante';

  return (
    <View style={{ paddingHorizontal: 24, gap: 14 }}>
      <SectionHeader
        icon="thermometer-outline"
        title="Calculateur d'échauffement"
        subtitle="Les séries de chauffe s'adaptent à ton poids ET tes reps cibles"
      />

      <View style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 20, padding: 20, gap: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
      }}>
        {/* Poids + reps cibles */}
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Poids de travail
            </Text>
            <NumericInput value={weight} onChange={setWeight} min={20} max={400} step={2.5} suffix="kg" />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Reps cibles
            </Text>
            <NumericInput value={targetReps} onChange={setTargetReps} min={1} max={20} step={1} />
          </View>
        </View>

        {/* Label intensité */}
        <View style={{ backgroundColor: 'rgba(124,58,237,0.10)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(124,58,237,0.20)' }}>
          <Text style={{ fontSize: 12, color: '#c4b5fd', fontWeight: '600' }}>{intensityLabel}</Text>
        </View>

        {/* Séries générées */}
        <View style={{ gap: 8 }}>
          {sets.map((set, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                padding: 14, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
              }}
            >
              <View style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: 'rgba(6,182,212,0.15)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#67e8f9' }}>W{i + 1}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text.primary }}>
                  {set.weight} <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.muted }}>kg</Text>
                </Text>
              </View>

              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text.secondary }}>
                × {set.reps} reps
              </Text>

              <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.muted }}>{set.restTime}s</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Intensité en % */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
          {sets.map((set, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#67e8f9' }}>
                {Math.round((set.weight / weight) * 100)}%
              </Text>
              <Text style={{ fontSize: 10, color: colors.text.muted }}>W{i + 1}</Text>
            </View>
          ))}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#7c3aed' }}>100%</Text>
            <Text style={{ fontSize: 10, color: colors.text.muted }}>Travail</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
