import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, TextInput, Modal,
  Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ExerciseCard } from '@/components/session/ExerciseCard';
import { RestTimer } from '@/components/session/RestTimer';
import { SessionTimer } from '@/components/session/TimerRing';
import { Mascot } from '@/components/mascot/Mascot';
import { ScreenBackground, BG_COLORS } from '@/components/ui/ScreenBackground';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getSuggestedSession } from '@/lib/aiPlanner';
import { MUSCLE_LABELS } from '@/lib/gamification';
import { EXERCISE_GROUPS, filterGroups, type ExerciseDefinition } from '@/lib/exerciseDatabase';
import type { ActiveExercise, MuscleGroup, WorkoutSet, WorkoutType } from '@/types';

const QUICK_STARTS: Array<{
  title: string;
  type: WorkoutType;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  { title: 'Force',        type: 'strength',    icon: 'barbell-outline', color: '#38bdf8' },
  { title: 'Hypertrophie', type: 'hypertrophy', icon: 'body-outline',    color: '#a78bfa' },
  { title: 'Cardio',       type: 'cardio',      icon: 'pulse-outline',   color: '#34d399' },
  { title: 'Mobilité',     type: 'mobility',    icon: 'leaf-outline',    color: '#f59e0b' },
];

// ── ExercisePicker — catégories + recherche + custom ────────────────
const MUSCLE_GROUP_OPTIONS: Array<{ id: MuscleGroup; label: string }> = [
  { id: 'chest',     label: 'Pectoraux' },
  { id: 'back',      label: 'Dos' },
  { id: 'shoulders', label: 'Épaules' },
  { id: 'arms',      label: 'Bras' },
  { id: 'legs',      label: 'Jambes' },
  { id: 'glutes',    label: 'Fessiers' },
  { id: 'core',      label: 'Abdos' },
  { id: 'calves',    label: 'Mollets' },
];

function ExercisePicker({ visible, onSelect, onClose }: {
  visible: boolean;
  onSelect: (exercise: Omit<ActiveExercise, 'isExpanded'>) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscles, setCustomMuscles] = useState<MuscleGroup[]>([]);

  const filteredGroups = filterGroups(search);
  const searching = search.trim().length > 0;

  const handlePick = (ex: ExerciseDefinition) => {
    onSelect({
      id: `${ex.name}-${Date.now()}`,
      name: ex.name,
      category: ex.category,
      muscleGroups: ex.muscleGroups,
      sets: [{ weight: 0, reps: 8, setType: 'normal', completed: false }],
    });
    setSearch('');
    onClose();
  };

  const handleSaveCustom = () => {
    const name = customName.trim();
    if (name.length < 2 || customMuscles.length === 0) return;
    onSelect({
      id: `custom-${Date.now()}`,
      name,
      category: 'accessory',
      muscleGroups: customMuscles,
      sets: [{ weight: 0, reps: 8, setType: 'normal', completed: false }],
    });
    setCustomMode(false);
    setCustomName('');
    setCustomMuscles([]);
    setSearch('');
    onClose();
  };

  const toggleMuscle = (m: MuscleGroup) => {
    setCustomMuscles((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onDismiss={() => { setCustomMode(false); setSearch(''); }}
    >
      <View style={{ flex: 1, backgroundColor: BG_COLORS.base }}>
        <ScreenBackground variant="session" topHalo={false} />

        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingVertical: 14,
            borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
          }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: BG_COLORS.accent, letterSpacing: 2, textTransform: 'uppercase' }}>
                Exercices
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
                {customMode ? 'Exercice personnalisé' : 'Ajouter un exercice'}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (customMode) { setCustomMode(false); }
                else { onClose(); }
              }}
              hitSlop={10}
            >
              <Ionicons name="close" size={26} color="rgba(255,255,255,0.55)" />
            </Pressable>
          </View>

          {/* ─── MODE CUSTOM ─── */}
          {customMode ? (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28, gap: 18 }}>
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Nom de l'exercice
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderWidth: 1.5,
                  borderColor: customName.trim().length >= 2 ? BG_COLORS.accent : 'rgba(255,255,255,0.10)',
                  borderRadius: 14, paddingHorizontal: 14,
                }}>
                  <Ionicons name="create-outline" size={18} color={customName.trim().length >= 2 ? BG_COLORS.accent : 'rgba(255,255,255,0.40)'} />
                  <TextInput
                    style={{ flex: 1, fontSize: 16, color: '#fff', paddingVertical: 14, fontWeight: '700' }}
                    placeholder="Ex: Hip abduction machine"
                    placeholderTextColor="rgba(255,255,255,0.30)"
                    value={customName}
                    onChangeText={setCustomName}
                    autoFocus
                  />
                </View>
              </View>

              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Muscles travaillés (au moins 1)
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {MUSCLE_GROUP_OPTIONS.map((m) => {
                    const isSel = customMuscles.includes(m.id);
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => toggleMuscle(m.id)}
                        style={{
                          paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
                          backgroundColor: isSel ? `${BG_COLORS.accent}22` : 'rgba(255,255,255,0.05)',
                          borderWidth: 1.5,
                          borderColor: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.10)',
                          flexDirection: 'row', alignItems: 'center', gap: 6,
                        }}
                      >
                        {isSel && <Ionicons name="checkmark" size={14} color={BG_COLORS.accent} />}
                        <Text style={{
                          fontSize: 13, fontWeight: '800',
                          color: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.60)',
                        }}>
                          {m.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                onPress={handleSaveCustom}
                disabled={customName.trim().length < 2 || customMuscles.length === 0}
                style={({ pressed }) => ({
                  borderRadius: 18, overflow: 'hidden', marginTop: 12,
                  opacity: customName.trim().length < 2 || customMuscles.length === 0 ? 0.4 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  shadowColor: BG_COLORS.accent,
                  shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
                  elevation: 10,
                })}
              >
                <View style={{
                  backgroundColor: BG_COLORS.accent, borderRadius: 18, paddingVertical: 18,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}>
                  <Ionicons name="add-circle" size={18} color="#07090f" />
                  <Text style={{ fontSize: 15, fontWeight: '900', color: '#07090f', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                    Créer l'exercice
                  </Text>
                </View>
              </Pressable>
            </ScrollView>
          ) : (
            <>
              {/* Barre de recherche */}
              <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderWidth: 1, borderColor: searching ? 'rgba(56,189,248,0.40)' : 'rgba(255,255,255,0.10)',
                  borderRadius: 14, paddingHorizontal: 14,
                }}>
                  <Ionicons name="search-outline" size={18} color={searching ? BG_COLORS.accent : 'rgba(255,255,255,0.40)'} />
                  <TextInput
                    style={{ flex: 1, fontSize: 15, color: '#fff', paddingVertical: 13, fontWeight: '600' }}
                    placeholder="Bench press, squat, curl..."
                    placeholderTextColor="rgba(255,255,255,0.30)"
                    value={search}
                    onChangeText={setSearch}
                  />
                  {search.length > 0 && (
                    <Pressable onPress={() => setSearch('')} hitSlop={8}>
                      <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.45)" />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Liste catégories */}
              <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 10 }}>
                {filteredGroups.length === 0 ? (
                  <View style={{
                    alignItems: 'center', paddingVertical: 28, gap: 10,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: 18, borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.06)',
                  }}>
                    <Ionicons name="search" size={28} color="rgba(255,255,255,0.30)" />
                    <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', fontWeight: '600', textAlign: 'center' }}>
                      Aucun exercice trouvé.{'\n'}Crée-le ci-dessous.
                    </Text>
                  </View>
                ) : (
                  filteredGroups.map((group) => {
                    const isOpen = searching || expanded[group.id] === true;
                    return (
                      <View
                        key={group.id}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          borderRadius: 18, borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.08)',
                          overflow: 'hidden',
                        }}
                      >
                        <Pressable
                          onPress={() => setExpanded((p) => ({ ...p, [group.id]: !p[group.id] }))}
                          style={({ pressed }) => ({
                            flexDirection: 'row', alignItems: 'center', gap: 12,
                            paddingHorizontal: 14, paddingVertical: 14,
                            backgroundColor: pressed ? 'rgba(56,189,248,0.06)' : 'transparent',
                          })}
                        >
                          <View style={{
                            width: 38, height: 38, borderRadius: 11,
                            backgroundColor: `${group.color}18`,
                            borderWidth: 1, borderColor: `${group.color}32`,
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Ionicons name={group.icon as keyof typeof Ionicons.glyphMap} size={18} color={group.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: -0.2 }}>
                              {group.label}
                            </Text>
                            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '700', marginTop: 2 }}>
                              {group.exercises.length} exercice{group.exercises.length > 1 ? 's' : ''} · {group.hint}
                            </Text>
                          </View>
                          <Ionicons
                            name={isOpen ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color="rgba(255,255,255,0.45)"
                          />
                        </Pressable>

                        {isOpen && (
                          <View style={{ paddingHorizontal: 8, paddingBottom: 10, gap: 4 }}>
                            {group.exercises.map((ex, i) => (
                              <Pressable
                                key={`${ex.name}-${i}`}
                                onPress={() => handlePick(ex)}
                                style={({ pressed }) => ({
                                  flexDirection: 'row', alignItems: 'center', gap: 10,
                                  paddingHorizontal: 12, paddingVertical: 11, borderRadius: 12,
                                  backgroundColor: pressed ? `${group.color}14` : 'transparent',
                                })}
                              >
                                <View style={{
                                  width: 28, height: 28, borderRadius: 9,
                                  backgroundColor: 'rgba(255,255,255,0.05)',
                                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                                  alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <Ionicons
                                    name={ex.category === 'compound' ? 'barbell' : ex.category === 'isolation' ? 'fitness' : 'flash'}
                                    size={14}
                                    color="rgba(255,255,255,0.55)"
                                  />
                                </View>
                                <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: -0.1 }}>
                                  {ex.name}
                                </Text>
                                <View style={{
                                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                                  backgroundColor: ex.category === 'compound' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.05)',
                                  borderWidth: 1,
                                  borderColor: ex.category === 'compound' ? 'rgba(56,189,248,0.26)' : 'rgba(255,255,255,0.08)',
                                }}>
                                  <Text style={{
                                    fontSize: 9, fontWeight: '800', letterSpacing: 0.5,
                                    color: ex.category === 'compound' ? '#7dd3fc' : 'rgba(255,255,255,0.50)',
                                    textTransform: 'uppercase',
                                  }}>
                                    {ex.category === 'compound' ? 'Poly' : ex.category === 'isolation' ? 'Iso' : 'Acc'}
                                  </Text>
                                </View>
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}

                {/* CTA exercice perso */}
                <Pressable
                  onPress={() => setCustomMode(true)}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingVertical: 16, paddingHorizontal: 14, marginTop: 6,
                    borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed',
                    borderColor: pressed ? BG_COLORS.accent : 'rgba(56,189,248,0.40)',
                    backgroundColor: pressed ? 'rgba(56,189,248,0.08)' : 'transparent',
                  })}
                >
                  <View style={{
                    width: 38, height: 38, borderRadius: 11,
                    backgroundColor: 'rgba(56,189,248,0.16)',
                    borderWidth: 1, borderColor: 'rgba(56,189,248,0.32)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="add" size={20} color={BG_COLORS.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: BG_COLORS.accent, letterSpacing: -0.2 }}>
                      Exercice personnalisé
                    </Text>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', fontWeight: '600', marginTop: 2 }}>
                      Crée un exercice qui n'est pas dans la liste
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.45)" />
                </Pressable>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ── Écran principal ─────────────────────────────────────────────────
export default function SessionScreen() {
  const {
    activeSession, startSession, addExercise,
    finishSession, discardSession, startRestTimer, stopRestTimer,
  } = useSessionStore();

  const { addWorkout, getLastWorkoutForExercise } = useWorkoutStore();
  const { profile } = useProfileStore();
  const workouts = useWorkoutStore((s) => s.workouts);
  const defaultRestTime = useSettingsStore((s) => s.settings.defaultRestTime);

  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [selectedType, setSelectedType] = useState<WorkoutType>('strength');
  const [feeling, setFeeling] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [showFinishModal, setShowFinishModal] = useState(false);

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleStart = useCallback((name: string, type: WorkoutType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
    startSession(name || 'Séance', type);
  }, [startSession]);

  const handleAddExercise = useCallback((exercise: Omit<ActiveExercise, 'isExpanded'>) => {
    const lastWorkout = getLastWorkoutForExercise(exercise.name);
    const lastExercise = lastWorkout?.exercises.find(
      (e) => e.name.toLowerCase() === exercise.name.toLowerCase(),
    );
    const sets: WorkoutSet[] = lastExercise?.sets.length
      ? lastExercise.sets.map((s) => ({
          weight: s.weight, reps: s.reps, setType: s.setType,
          restTime: defaultRestTime, completed: false,
        }))
      : [{ weight: 0, reps: 8, setType: 'normal' as const, restTime: defaultRestTime, completed: false }];
    addExercise({ ...exercise, sets, isExpanded: true });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
  }, [addExercise, getLastWorkoutForExercise, defaultRestTime]);

  const handleFinish = async () => {
    const workout = finishSession();
    if (!workout) return;
    const finalWorkout = { ...workout, feeling, name: workoutName || 'Séance' };
    await addWorkout(finalWorkout);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    setShowFinishModal(false);
  };

  const handleDiscard = () => {
    Alert.alert('Abandonner la séance ?', 'Toutes les données seront perdues.', [
      { text: 'Continuer', style: 'cancel' },
      { text: 'Abandonner', style: 'destructive', onPress: () => discardSession() },
    ]);
  };

  // ── PAS DE SÉANCE ACTIVE ─────────────────────────────────────────
  if (!activeSession) {
    const suggested = profile ? getSuggestedSession(profile, workouts, null) : null;

    return (
      <View style={{ flex: 1, backgroundColor: BG_COLORS.base }}>
        <ScreenBackground variant="session" />

        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {/* ── HEADER ── */}
              <View style={{ paddingTop: 12, paddingBottom: 24 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: BG_COLORS.accent, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>
                  Aujourd'hui
                </Text>
                <Text style={{ fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1.6, lineHeight: 42 }}>
                  Nouvelle séance
                </Text>
                <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.50)', fontWeight: '600', marginTop: 8, lineHeight: 20 }}>
                  Lance-toi avec une suggestion ou crée la tienne.
                </Text>
              </View>

              {/* ── TYPE DE SÉANCE ── */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12 }}>
                  Type
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {QUICK_STARTS.map((qs) => {
                    const isSel = selectedType === qs.type;
                    return (
                      <Pressable
                        key={qs.type}
                        onPress={() => setSelectedType(qs.type)}
                        style={({ pressed }) => ({
                          borderRadius: 14, overflow: 'hidden',
                          transform: [{ scale: pressed ? 0.96 : 1 }],
                        })}
                      >
                        <View style={{
                          paddingHorizontal: 16, paddingVertical: 12,
                          flexDirection: 'row', alignItems: 'center', gap: 8,
                          backgroundColor: isSel ? `${qs.color}22` : 'rgba(255,255,255,0.04)',
                          borderWidth: 1.5,
                          borderColor: isSel ? qs.color : 'rgba(255,255,255,0.09)',
                          borderRadius: 14,
                        }}>
                          <Ionicons name={qs.icon} size={16} color={isSel ? qs.color : 'rgba(255,255,255,0.40)'} />
                          <Text style={{
                            fontSize: 14, fontWeight: '800',
                            color: isSel ? qs.color : 'rgba(255,255,255,0.60)',
                            letterSpacing: -0.1,
                          }}>
                            {qs.title}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* ── SUGGESTION ── */}
              {suggested && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12 }}>
                    Suggestion
                  </Text>
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
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <Text style={{ flex: 1, fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 30 }}>
                          {suggested.title}
                        </Text>
                        <View style={{
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
                          flexDirection: 'row', alignItems: 'center', gap: 4,
                        }}>
                          <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.55)" />
                          <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.65)' }}>
                            ~{suggested.estimatedDuration}min
                          </Text>
                        </View>
                      </View>

                      {suggested.reason && (
                        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600', lineHeight: 18 }}>
                          {suggested.reason}
                        </Text>
                      )}

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

                      <Pressable
                        onPress={() => {
                          handleStart(suggested.title, 'strength');
                          suggested.exercises.forEach((ex) => {
                            handleAddExercise({
                              id: `${ex.name}-${Date.now()}`,
                              name: ex.name, category: ex.category,
                              muscleGroups: suggested.focus, sets: [],
                            });
                          });
                        }}
                        style={({ pressed }) => ({
                          borderRadius: 18, overflow: 'hidden',
                          transform: [{ scale: pressed ? 0.97 : 1 }],
                          shadowColor: BG_COLORS.accent,
                          shadowOpacity: 0.50, shadowRadius: 22, shadowOffset: { width: 0, height: 10 },
                          elevation: 10, marginTop: 4,
                        })}
                      >
                        <View style={{
                          backgroundColor: BG_COLORS.accent, borderRadius: 18, paddingVertical: 18,
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                        }}>
                          <Ionicons name="flame" size={18} color="#07090f" />
                          <Text style={{ fontSize: 15, fontWeight: '900', color: '#07090f', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                            Démarrer
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}

              {/* ── SÉANCE LIBRE ── */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12 }}>
                  Ou séance libre
                </Text>
                <Pressable
                  onPress={() => handleStart('Séance', selectedType)}
                  style={({ pressed }) => ({
                    borderRadius: 18, overflow: 'hidden',
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
                    paddingVertical: 18, alignItems: 'center', borderRadius: 18,
                    flexDirection: 'row', justifyContent: 'center', gap: 10,
                  }}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                      Démarrer sans programme
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* ── ZERO STATE Mimi (si jamais de profile) ── */}
              {!suggested && workouts.length === 0 && (
                <View style={{
                  alignItems: 'center', paddingVertical: 24, paddingHorizontal: 18,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: 24, borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.06)',
                  gap: 16, marginTop: 8,
                }}>
                  <Mascot pose="mimi_target" height={140} animate float />
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontWeight: '600', lineHeight: 20 }}>
                    On va construire ton premier entraînement.{'\n'}Choisis un type ci-dessus et go.
                  </Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // ── SÉANCE ACTIVE ────────────────────────────────────────────────
  const totalSets     = activeSession.exercises.reduce((t, e) => t + e.sets.length, 0);
  const completedSets = activeSession.exercises.reduce((t, e) => t + e.sets.filter((s) => s.completed).length, 0);

  return (
    <View style={{ flex: 1, backgroundColor: BG_COLORS.base }}>
      <ScreenBackground variant="session" topHalo={false} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header séance active */}
        <View style={{
          borderBottomWidth: 1, borderBottomColor: 'rgba(56,189,248,0.15)',
          paddingHorizontal: 16, paddingVertical: 12,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <SessionTimer elapsedSeconds={activeSession.elapsedSeconds} />

          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 1.4, textTransform: 'uppercase' }}>
              Séries
            </Text>
            <Text style={{ fontSize: 19, fontWeight: '900', color: '#fff', letterSpacing: -0.4 }}>
              {completedSets}<Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14 }}>/{totalSets}</Text>
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Pressable
              onPress={() => setShowFinishModal(true)}
              style={({ pressed }) => ({
                borderRadius: 12, overflow: 'hidden',
                shadowColor: BG_COLORS.accent,
                shadowOpacity: pressed ? 0.2 : 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              })}
            >
              <View style={{
                backgroundColor: BG_COLORS.accent,
                paddingHorizontal: 14, paddingVertical: 8,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#07090f', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Terminer
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={handleDiscard}
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: 'rgba(239,68,68,0.15)',
                borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={16} color="#ef4444" />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 12, paddingBottom: 40 }}>
          {activeSession.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              lastWorkout={getLastWorkoutForExercise(exercise.name)}
              onStartRest={(s) => startRestTimer(s)}
            />
          ))}

          <Pressable
            onPress={() => setShowExercisePicker(true)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              paddingVertical: 18, borderRadius: 18,
              borderWidth: 1.5, borderStyle: 'dashed',
              borderColor: pressed ? BG_COLORS.accent : 'rgba(56,189,248,0.40)',
              backgroundColor: pressed ? 'rgba(56,189,248,0.08)' : 'transparent',
            })}
          >
            <Ionicons name="add" size={20} color={BG_COLORS.accent} />
            <Text style={{ fontSize: 14, fontWeight: '800', color: BG_COLORS.accent, letterSpacing: 0.8, textTransform: 'uppercase' }}>
              Ajouter un exercice
            </Text>
          </Pressable>
        </ScrollView>

        {/* Rest timer */}
        {activeSession.isResting && activeSession.restSecondsLeft !== null && (
          <RestTimer
            secondsLeft={activeSession.restSecondsLeft}
            totalSeconds={defaultRestTime}
            isVisible={activeSession.isResting}
            onSkip={stopRestTimer}
            onAddTime={(s) =>
              useSessionStore.getState().startRestTimer((activeSession.restSecondsLeft ?? 0) + s)
            }
          />
        )}

        <ExercisePicker
          visible={showExercisePicker}
          onSelect={handleAddExercise}
          onClose={() => setShowExercisePicker(false)}
        />

        {/* Modal terminer */}
        <Modal visible={showFinishModal} transparent animationType="slide" presentationStyle="pageSheet">
          <View style={{ flex: 1, backgroundColor: BG_COLORS.base }}>
            <ScreenBackground variant="session" topHalo={false} />

            <SafeAreaView style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 32, gap: 24 }}>
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1.2 }}>
                  Terminer la séance
                </Text>

                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 2, textTransform: 'uppercase' }}>
                    Nom de la séance
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                      paddingHorizontal: 16, paddingVertical: 14,
                      fontSize: 16, fontWeight: '700', color: '#fff',
                    }}
                    value={workoutName || 'Séance'}
                    onChangeText={setWorkoutName}
                    placeholderTextColor="rgba(255,255,255,0.30)"
                  />
                </View>

                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 2, textTransform: 'uppercase' }}>
                    Comment tu te sens ?
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {([1, 2, 3, 4, 5] as const).map((f) => (
                      <Pressable
                        key={f}
                        onPress={() => setFeeling(f)}
                        style={{
                          flex: 1, paddingVertical: 14, borderRadius: 14,
                          alignItems: 'center',
                          backgroundColor: feeling === f ? `${BG_COLORS.accent}22` : 'rgba(255,255,255,0.05)',
                          borderWidth: 1.5,
                          borderColor: feeling === f ? BG_COLORS.accent : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <Ionicons
                          name={f === 1 ? 'sad-outline' : f === 2 ? 'remove-circle-outline' : f === 3 ? 'ellipse-outline' : f === 4 ? 'happy-outline' : 'flame-outline'}
                          size={22}
                          color={feeling === f ? BG_COLORS.accent : 'rgba(255,255,255,0.40)'}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {[
                    { label: 'Durée', value: `${Math.floor(activeSession.elapsedSeconds / 60)} min` },
                    { label: 'Exercices', value: String(activeSession.exercises.length) },
                    { label: 'Séries', value: `${completedSets}/${totalSets}` },
                  ].map((s) => (
                    <View key={s.label} style={{
                      flex: 1,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderRadius: 14, padding: 14, gap: 4,
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                        {s.label}
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.4 }}>
                        {s.value}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={{ gap: 10, marginTop: 4 }}>
                  <Pressable
                    onPress={handleFinish}
                    style={({ pressed }) => ({
                      borderRadius: 18, overflow: 'hidden',
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                      shadowColor: BG_COLORS.accent,
                      shadowOpacity: 0.50, shadowRadius: 22, shadowOffset: { width: 0, height: 10 },
                      elevation: 10,
                    })}
                  >
                    <View style={{
                      backgroundColor: BG_COLORS.accent, borderRadius: 18, paddingVertical: 18,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                    }}>
                      <Ionicons name="checkmark-circle" size={18} color="#07090f" />
                      <Text style={{ fontSize: 15, fontWeight: '900', color: '#07090f', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                        Sauvegarder
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable onPress={() => setShowFinishModal(false)} style={{ paddingVertical: 14, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: '700' }}>
                      Continuer la séance
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
