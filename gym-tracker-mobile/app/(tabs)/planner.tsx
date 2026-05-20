import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useT } from '@/lib/i18n';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { NumericInput } from '@/components/ui/Input';
import { Mascot } from '@/components/mascot/Mascot';
import { ScreenBackground, BG_COLORS } from '@/components/ui/ScreenBackground';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getSuggestedSession, generatePRProgression, generateWarmupSets } from '@/lib/aiPlanner';
import { MUSCLE_LABELS } from '@/lib/gamification';
import { SESSION_TEMPLATES, buildExercisesFromTemplate, type SessionTemplate } from '@/lib/sessionTemplates';
import type { TrainingPlan } from '@/types';

// ── Section header (icône + titre + subtitle) ─────────────────────
function SectionHeader({ icon, title, subtitle }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{
          width: 30, height: 30, borderRadius: 10,
          backgroundColor: 'rgba(56,189,248,0.16)',
          borderWidth: 1, borderColor: 'rgba(56,189,248,0.30)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={16} color={BG_COLORS.accent} />
        </View>
        <Text style={{ fontSize: 19, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
          {title}
        </Text>
      </View>
      {subtitle && (
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '600', marginLeft: 40 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export default function PlannerScreen() {
  const { workouts } = useWorkoutStore();
  const { profile, goals } = useProfileStore();
  const { startSession, addExercise } = useSessionStore();
  const defaultRestTime = useSettingsStore((s) => s.settings.defaultRestTime);
  const t = useT();

  const [activePlan, setActivePlan]   = useState<TrainingPlan | null>(null);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [planTarget, setPlanTarget]   = useState(100);
  const [planWeeks, setPlanWeeks]     = useState(12);

  const handleStartTemplate = (template: SessionTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
    startSession(template.title, template.type);
    const exercises = buildExercisesFromTemplate(template, defaultRestTime);
    exercises.forEach((ex) => addExercise({ ...ex, isExpanded: true }));
    router.push('/(tabs)/session');
  };

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const suggested = profile ? getSuggestedSession(profile, workouts, activePlan) : null;

  const handleGeneratePlan = () => {
    if (!profile) {
      Alert.alert(t('planner.profileRequired'), t('planner.profileRequiredMsg'));
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
    <View style={{ flex: 1, backgroundColor: BG_COLORS.base }}>
      <ScreenBackground variant="planner" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ── HEADER ── */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: BG_COLORS.accent, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>
                {t('planner.supertitle')}
              </Text>
              <Text style={{ fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1.6, lineHeight: 42 }}>
                {t('planner.title')}
              </Text>
              <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.50)', fontWeight: '600', marginTop: 8, lineHeight: 20 }}>
                {t('planner.subtitle')}
              </Text>
            </View>

            {/* ── TEMPLATES PUSH / PULL / LEGS ── */}
            <View style={{ marginBottom: 24, gap: 12 }}>
              <View style={{ paddingHorizontal: 20 }}>
                <SectionHeader
                  icon="flame-outline"
                  title={t('planner.templates')}
                  subtitle={t('planner.templatesSub')}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              >
                {SESSION_TEMPLATES.map((t) => (
                  <TemplateCard key={t.id} template={t} onPress={() => handleStartTemplate(t)} />
                ))}
              </ScrollView>
            </View>

            {/* ── SUGGESTION DU JOUR ── */}
            {suggested && (
              <View style={{ paddingHorizontal: 20, marginBottom: 28, gap: 14 }}>
                <SectionHeader
                  icon="flash-outline"
                  title={t('planner.suggestion')}
                  subtitle={t('planner.suggestionSub')}
                />

                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 22, borderWidth: 1,
                  borderColor: 'rgba(56,189,248,0.22)',
                  overflow: 'hidden',
                }}>
                  <LinearGradient
                    colors={['rgba(56,189,248,0.14)', 'transparent']}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 140 }}
                  />

                  <View style={{ padding: 22, gap: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <Text style={{ flex: 1, fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 30 }}>
                        {suggested.title}
                      </Text>
                      <View style={{
                        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
                        paddingHorizontal: 10, paddingVertical: 5,
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                      }}>
                        <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.55)" />
                        <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.65)' }}>
                          ~{suggested.estimatedDuration}min
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600', lineHeight: 18 }}>
                      {suggested.reason}
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {suggested.focus.map((m) => (
                        <View key={m} style={{
                          paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
                          backgroundColor: 'rgba(56,189,248,0.14)',
                          borderWidth: 1, borderColor: 'rgba(56,189,248,0.32)',
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: 1 }}>
                            {MUSCLE_LABELS[m]}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Exercices prévus */}
                    <View style={{ gap: 8, marginTop: 4 }}>
                      {suggested.exercises.slice(0, 4).map((ex, i) => (
                        <View key={`${ex.name}-${i}`} style={{
                          flexDirection: 'row', alignItems: 'center', gap: 12,
                          paddingVertical: 8, paddingHorizontal: 12,
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
                        }}>
                          <View style={{
                            width: 30, height: 30, borderRadius: 9,
                            backgroundColor: ex.category === 'compound'
                              ? 'rgba(56,189,248,0.18)'
                              : 'rgba(167,139,250,0.14)',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Ionicons
                              name={ex.category === 'compound' ? 'barbell' : 'fitness'}
                              size={14}
                              color={ex.category === 'compound' ? BG_COLORS.accent : '#a78bfa'}
                            />
                          </View>
                          <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: '#fff' }}>
                            {ex.name}
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.65)', letterSpacing: 0.3 }}>
                            {ex.targetSets}×{typeof ex.targetReps === 'number' ? ex.targetReps : `${ex.targetReps[0]}-${ex.targetReps[1]}`}
                          </Text>
                        </View>
                      ))}
                      {suggested.exercises.length > 4 && (
                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '700', marginLeft: 44 }}>
                          {t('planner.moreExercises', { n: suggested.exercises.length - 4 })}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ── ÉCHAUFFEMENT ── */}
            <WarmupSection />

            {/* ── PROGRAMME DE FORCE ── */}
            <View style={{ paddingHorizontal: 20, marginTop: 28, marginBottom: 28, gap: 14 }}>
              <SectionHeader
                icon="trending-up-outline"
                title={t('planner.strengthProgram')}
                subtitle={t('planner.strengthSub')}
              />

              {activePlan ? (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 22, padding: 20, gap: 14,
                  borderWidth: 1, borderColor: 'rgba(56,189,248,0.22)',
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: BG_COLORS.accent, letterSpacing: 2, textTransform: 'uppercase' }}>
                        {t('planner.activePlan')}
                      </Text>
                      <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
                        {activePlan.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '600' }}>
                        {activePlan.duration} semaines · {activePlan.frequency}×/sem · {activePlan.algorithm}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setActivePlan(null)}
                      style={{
                        backgroundColor: 'rgba(239,68,68,0.14)',
                        borderRadius: 10, padding: 10,
                        borderWidth: 1, borderColor: 'rgba(239,68,68,0.30)',
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </Pressable>
                  </View>

                  <View style={{ gap: 10 }}>
                    {activePlan.weeks.map((week) => {
                      const session = week.sessions[0];
                      const ex      = session?.exercises[0];
                      return (
                        <View key={week.weekNumber} style={{
                          backgroundColor: week.deloadWeek ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
                          borderRadius: 14, padding: 14, gap: 8,
                          borderWidth: 1,
                          borderColor: week.deloadWeek ? 'rgba(245,158,11,0.30)' : 'rgba(255,255,255,0.07)',
                        }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={{ fontSize: 14, fontWeight: '900', color: week.deloadWeek ? '#f59e0b' : '#fff' }}>
                                {t('planner.week', { n: week.weekNumber })}
                              </Text>
                              {week.deloadWeek && (
                                <View style={{
                                  backgroundColor: 'rgba(245,158,11,0.18)',
                                  borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
                                }}>
                                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#f59e0b', letterSpacing: 1 }}>
                                    {t('planner.deload')}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.55)' }}>
                              {week.intensity}%
                            </Text>
                          </View>

                          {ex && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <Text style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600' }}>
                                {ex.name}
                              </Text>
                              <View style={{
                                backgroundColor: 'rgba(56,189,248,0.14)',
                                borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
                              }}>
                                <Text style={{ fontSize: 15, fontWeight: '900', color: BG_COLORS.accent }}>
                                  {ex.targetWeight ?? '—'} kg
                                </Text>
                              </View>
                              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '700' }}>
                                {ex.targetSets}×{typeof ex.targetReps === 'number' ? ex.targetReps : `${ex.targetReps[0]}-${ex.targetReps[1]}`}
                              </Text>
                            </View>
                          )}

                          <ProgressBar
                            progress={week.intensity}
                            gradient={week.deloadWeek ? ['#f59e0b', '#d97706'] : [BG_COLORS.accent, '#0ea5e9']}
                            height={5}
                            animated={false}
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : showNewPlan ? (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 22, padding: 20, gap: 18,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                }}>
                  <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: -0.3 }}>
                    Développé couché — Force
                  </Text>

                  <View style={{ gap: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                      {t('planner.targetWeight')}
                    </Text>
                    <NumericInput value={planTarget} onChange={setPlanTarget} min={0} max={300} step={5} suffix="kg" />
                  </View>

                  <View style={{ gap: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                      {t('planner.weeks')}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {[8, 12, 16, 20].map((w) => {
                        const isSel = planWeeks === w;
                        return (
                          <Pressable
                            key={w}
                            onPress={() => setPlanWeeks(w)}
                            style={{
                              flex: 1, paddingVertical: 13, borderRadius: 12,
                              alignItems: 'center',
                              backgroundColor: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.05)',
                              borderWidth: 1.5,
                              borderColor: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.10)',
                            }}
                          >
                            <Text style={{
                              fontSize: 15, fontWeight: '900',
                              color: isSel ? '#07090f' : 'rgba(255,255,255,0.55)',
                            }}>
                              {w}s
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable
                      onPress={handleGeneratePlan}
                      style={({ pressed }) => ({
                        flex: 1, borderRadius: 16, overflow: 'hidden',
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                        shadowColor: BG_COLORS.accent,
                        shadowOpacity: 0.40, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
                        elevation: 8,
                      })}
                    >
                      <View style={{
                        backgroundColor: BG_COLORS.accent, borderRadius: 16, paddingVertical: 15,
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}>
                        <Ionicons name="sparkles" size={16} color="#07090f" />
                        <Text style={{ fontSize: 14, fontWeight: '900', color: '#07090f', letterSpacing: 1, textTransform: 'uppercase' }}>
                          {t('planner.generate')}
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => setShowNewPlan(false)}
                      style={{
                        paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16,
                        backgroundColor: 'rgba(255,255,255,0.07)',
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.60)' }}>
                        {t('common.cancel')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => setShowNewPlan(true)}
                  style={({ pressed }) => ({
                    borderRadius: 18, overflow: 'hidden',
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  })}
                >
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 14,
                    padding: 18,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderWidth: 1.5, borderColor: 'rgba(56,189,248,0.28)',
                    borderRadius: 18, borderStyle: 'dashed',
                  }}>
                    <View style={{
                      width: 46, height: 46, borderRadius: 14,
                      backgroundColor: 'rgba(56,189,248,0.16)',
                      borderWidth: 1, borderColor: 'rgba(56,189,248,0.32)',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ionicons name="add" size={22} color={BG_COLORS.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 }}>
                        {t('planner.newPlan')}
                      </Text>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '600', marginTop: 2 }}>
                        Progression linéaire, 5/3/1 ou DUP
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.30)" />
                  </View>
                </Pressable>
              )}
            </View>

            {/* ── OBJECTIFS ACTIFS ── */}
            {activeGoals.length > 0 && (
              <View style={{ paddingHorizontal: 20, gap: 14 }}>
                <SectionHeader
                  icon="flag-outline"
                  title="Objectifs actifs"
                  subtitle={`${activeGoals.length} objectif${activeGoals.length > 1 ? 's' : ''} en cours`}
                />
                <View style={{ gap: 10 }}>
                  {activeGoals.map((goal) => (
                    <View key={goal.id} style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderRadius: 16, padding: 16, gap: 10,
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 }}>
                          {goal.exercise ?? goal.type}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.60)' }}>
                          {goal.currentValue} → {goal.targetValue}
                        </Text>
                      </View>
                      <ProgressBar progress={goal.progress} gradient={[BG_COLORS.accent, '#0ea5e9']} height={6} showLabel animated />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── ZERO STATE ── */}
            {!suggested && !activePlan && activeGoals.length === 0 && (
              <View style={{
                marginHorizontal: 20, marginTop: 12,
                alignItems: 'center', paddingVertical: 28, paddingHorizontal: 18,
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 24, borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)', gap: 16,
              }}>
                <Mascot pose="mimi_calendar" height={140} animate float />
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontWeight: '600', lineHeight: 20 }}>
                  Construis ton premier programme ou fixe-toi un objectif.
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ── Calculateur d'échauffement ─────────────────────────────────────
function WarmupSection() {
  const t = useT();
  const [weight, setWeight]         = useState(80);
  const [targetReps, setTargetReps] = useState(5);
  const sets = generateWarmupSets(weight, targetReps);

  const intensityLabel =
    targetReps <= 2 ? 'Force max (1-2 reps) — montée très progressive' :
    targetReps <= 4 ? 'Force (3-4 reps) — montée progressive'           :
    targetReps <= 6 ? 'Force / Hypertrophie (5-6 reps)'                 :
                      'Hypertrophie (7+ reps) — chauffe légère suffisante';

  return (
    <View style={{ paddingHorizontal: 20, gap: 14 }}>
      <SectionHeader
        icon="thermometer-outline"
        title={t('planner.warmup')}
        subtitle="Adapte tes séries de chauffe à ta charge et tes reps"
      />

      <View style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 22, padding: 18, gap: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
      }}>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Poids de travail
            </Text>
            <NumericInput value={weight} onChange={setWeight} min={0} max={400} step={2.5} suffix="kg" />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Reps cibles
            </Text>
            <NumericInput value={targetReps} onChange={setTargetReps} min={1} max={20} step={1} />
          </View>
        </View>

        <View style={{
          backgroundColor: 'rgba(56,189,248,0.10)',
          borderRadius: 12, padding: 12,
          borderWidth: 1, borderColor: 'rgba(56,189,248,0.22)',
          flexDirection: 'row', alignItems: 'center', gap: 10,
        }}>
          <Ionicons name="bulb-outline" size={16} color={BG_COLORS.accent} />
          <Text style={{ flex: 1, fontSize: 12, color: '#7dd3fc', fontWeight: '700' }}>
            {intensityLabel}
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          {sets.map((set, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              padding: 12, borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
            }}>
              <View style={{
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: 'rgba(56,189,248,0.16)',
                borderWidth: 1, borderColor: 'rgba(56,189,248,0.32)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: BG_COLORS.accent }}>W{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: -0.4 }}>
                  {set.weight} <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.45)' }}>kg</Text>
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.70)' }}>
                × {set.reps} reps
              </Text>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)' }}>
                  {set.restTime}s
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 4 }}>
          {sets.map((set, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: BG_COLORS.accent }}>
                {Math.round((set.weight / weight) * 100)}%
              </Text>
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)', fontWeight: '700', letterSpacing: 0.5 }}>
                W{i + 1}
              </Text>
            </View>
          ))}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#34d399' }}>100%</Text>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)', fontWeight: '700', letterSpacing: 0.5 }}>
              Travail
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── TemplateCard ─ Push / Pull / Legs ─────────────────────────────
function TemplateCard({ template, onPress }: { template: SessionTemplate; onPress: () => void }) {
  const t = useT();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 220,
        borderRadius: 28, overflow: 'hidden',
        transform: [{ scale: pressed ? 0.97 : 1 }],
        borderWidth: 1.5,
        borderColor: `${template.color}38`,
        shadowColor: template.color,
        shadowOpacity: 0.30, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      })}
    >
      <LinearGradient
        colors={[`${template.color}22`, `${template.color}08`]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={{ padding: 16, gap: 12, minHeight: 200, borderRadius: 28 }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{
            width: 42, height: 42, borderRadius: 13,
            backgroundColor: `${template.color}28`,
            borderWidth: 1, borderColor: `${template.color}48`,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name={template.icon as keyof typeof Ionicons.glyphMap} size={20} color={template.color} />
          </View>
          <View style={{
            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.08)',
            flexDirection: 'row', alignItems: 'center', gap: 4,
          }}>
            <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.55)" />
            <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.65)' }}>
              ~{template.estimatedDuration}min
            </Text>
          </View>
        </View>

        {/* Titre */}
        <View style={{ gap: 4 }}>
          <Text style={{
            fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -1.2, lineHeight: 30,
          }}>
            {template.name.toUpperCase()}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: '700', color: template.color, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {template.hint}
          </Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="barbell-outline" size={12} color="rgba(255,255,255,0.55)" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.70)' }}>
              {template.exercises.length} exos
            </Text>
          </View>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.20)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="layers-outline" size={12} color="rgba(255,255,255,0.55)" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.70)' }}>
              {template.exercises.reduce((s, e) => s + e.sets, 0)} sets
            </Text>
          </View>
        </View>

        {/* CTA */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 8, borderTopWidth: 1, borderColor: `${template.color}22`,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '900', color: template.color, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {t('planner.startSession')}
          </Text>
          <Ionicons name="arrow-forward" size={16} color={template.color} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
