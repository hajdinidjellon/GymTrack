import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ExerciseCard } from '@/components/session/ExerciseCard';
import { RestTimer } from '@/components/session/RestTimer';
import { SessionTimer } from '@/components/session/TimerRing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getSuggestedSession } from '@/lib/aiPlanner';
import { colors } from '@/constants/theme';
import type { ActiveExercise, WorkoutSet, WorkoutType } from '@/types';

// ── Types de séance rapide ────────────────────────────────────

const QUICK_STARTS: Array<{
  title: string;
  type: WorkoutType;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  { title: 'Force',        type: 'strength',    icon: 'barbell-outline'   as const, color: '#7c3aed' },
  { title: 'Hypertrophie', type: 'hypertrophy', icon: 'body-outline'       as const, color: '#06b6d4' },
  { title: 'Cardio',       type: 'cardio',      icon: 'pulse-outline'      as const, color: '#10b981' },
  { title: 'Mobilité',     type: 'mobility',    icon: 'leaf-outline'       as const, color: '#f59e0b' },
];

const EXERCISE_DATABASE: Array<{ name: string; category: ActiveExercise['category']; muscleGroups: ActiveExercise['muscleGroups'] }> = [
  { name: 'Développé couché', category: 'compound', muscleGroups: ['chest', 'shoulders', 'arms'] },
  { name: 'Squat', category: 'compound', muscleGroups: ['legs', 'glutes'] },
  { name: 'Soulevé de terre', category: 'compound', muscleGroups: ['back', 'legs', 'glutes'] },
  { name: 'Développé militaire', category: 'compound', muscleGroups: ['shoulders', 'arms'] },
  { name: 'Tractions', category: 'compound', muscleGroups: ['back', 'arms'] },
  { name: 'Rowing barre', category: 'compound', muscleGroups: ['back', 'arms'] },
  { name: 'Curl haltères', category: 'isolation', muscleGroups: ['arms'] },
  { name: 'Extensions triceps', category: 'isolation', muscleGroups: ['arms'] },
  { name: 'Élévations latérales', category: 'isolation', muscleGroups: ['shoulders'] },
  { name: 'Hip thrust', category: 'compound', muscleGroups: ['glutes', 'legs'] },
  { name: 'Fentes marchées', category: 'compound', muscleGroups: ['legs', 'glutes'] },
  { name: 'Planche', category: 'accessory', muscleGroups: ['core'] },
  { name: 'Leg press', category: 'compound', muscleGroups: ['legs'] },
  { name: 'Face pulls', category: 'accessory', muscleGroups: ['shoulders', 'back'] },
  { name: 'Mollets debout', category: 'isolation', muscleGroups: ['calves'] },
];

// ── Sélecteur d'exercice ──────────────────────────────────────

interface ExercisePickerProps {
  visible: boolean;
  onSelect: (exercise: Omit<ActiveExercise, 'isExpanded'>) => void;
  onClose: () => void;
}

function ExercisePicker({ visible, onSelect, onClose }: ExercisePickerProps) {
  const [search, setSearch] = useState('');

  const filtered = EXERCISE_DATABASE.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-bg-secondary">
        <View className="flex-row items-center justify-between p-4 border-b border-white/[0.08]">
          <Text className="text-lg font-bold text-text-primary">
            Ajouter un exercice
          </Text>
          <Pressable onPress={onClose}>
            <Text className="text-text-secondary">Fermer</Text>
          </Pressable>
        </View>

        <View className="px-4 py-2">
          <TextInput
            className="bg-white/[0.08] rounded-xl px-4 py-3 text-text-primary"
            placeholder="Rechercher un exercice..."
            placeholderTextColor={colors.text.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView contentContainerClassName="px-4 gap-2 pb-8">
          {filtered.map((ex, i) => (
            <Pressable
              key={`${ex.name}-${i}`}
              onPress={() => {
                onSelect({
                  id: `${ex.name}-${Date.now()}`,
                  name: ex.name,
                  category: ex.category,
                  muscleGroups: ex.muscleGroups,
                  sets: [{ weight: 0, reps: 8, setType: 'normal', completed: false }],
                });
                onClose();
              }}
              className="flex-row items-center gap-3 p-3 rounded-xl bg-white/[0.04]"
            >
              <Ionicons
                name={ex.category === 'compound' ? 'barbell-outline' : ex.category === 'isolation' ? 'fitness-outline' : 'flash-outline'}
                size={18}
                color={colors.text.muted}
              />
              <View className="flex-1">
                <Text className="text-sm font-medium text-text-primary">{ex.name}</Text>
                <Text className="text-xs text-text-muted">
                  {ex.muscleGroups.join(', ')}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Écran principal ───────────────────────────────────────────

export default function SessionScreen() {
  const {
    activeSession,
    startSession,
    addExercise,
    finishSession,
    discardSession,
    startRestTimer,
    stopRestTimer,
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

  const handleStart = useCallback(
    (name: string, type: WorkoutType) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
      startSession(name || 'Séance', type);
    },
    [startSession],
  );

  // Auto-fill avec la dernière performance connue
  const handleAddExercise = useCallback(
    (exercise: Omit<ActiveExercise, 'isExpanded'>) => {
      const lastWorkout = getLastWorkoutForExercise(exercise.name);
      const lastExercise = lastWorkout?.exercises.find(
        (e) => e.name.toLowerCase() === exercise.name.toLowerCase(),
      );

      const sets: WorkoutSet[] = lastExercise?.sets.length
        ? lastExercise.sets.map((s) => ({
            weight:    s.weight,
            reps:      s.reps,
            setType:   s.setType,
            restTime:  defaultRestTime,
            completed: false,
          }))
        : [{ weight: 0, reps: 8, setType: 'normal' as const, restTime: defaultRestTime, completed: false }];

      addExercise({ ...exercise, sets, isExpanded: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    },
    [addExercise, getLastWorkoutForExercise, defaultRestTime],
  );

  const handleFinish = async () => {
    const workout = finishSession();
    if (!workout) return;

    const finalWorkout = { ...workout, feeling, name: workoutName || 'Séance' };
    await addWorkout(finalWorkout);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => null,
    );
    setShowFinishModal(false);
  };

  const handleDiscard = () => {
    Alert.alert(
      'Abandonner la séance ?',
      'Toutes les données de cette séance seront perdues.',
      [
        { text: 'Continuer la séance', style: 'cancel' },
        {
          text: 'Abandonner',
          style: 'destructive',
          onPress: () => {
            discardSession();
          },
        },
      ],
    );
  };

  // ── Vue : pas de séance active ─────────────────────────────

  if (!activeSession) {
    const suggested = profile ? getSuggestedSession(profile, workouts, null) : null;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48, gap: 32 }}>

          {/* Header */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text.muted, letterSpacing: 2, textTransform: 'uppercase' }}>
              Aujourd'hui
            </Text>
            <Text style={{ fontSize: 36, fontWeight: '900', color: colors.text.primary, letterSpacing: -1 }}>
              Nouvelle séance
            </Text>
          </View>

          {/* Type de séance */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 2, textTransform: 'uppercase' }}>
              Type
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {QUICK_STARTS.map((qs) => {
                const isSelected = selectedType === qs.type;
                return (
                  <Pressable key={qs.type} onPress={() => setSelectedType(qs.type)} style={{ overflow: 'hidden', borderRadius: 16 }}>
                    {isSelected ? (
                      <LinearGradient
                        colors={[qs.color, qs.color + 'bb']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                      >
                        <Ionicons name={qs.icon} size={16} color="#fff" />
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{qs.title}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={{
                        paddingHorizontal: 18, paddingVertical: 12,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
                        borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8,
                      }}>
                        <Ionicons name={qs.icon} size={16} color={colors.text.muted} />
                        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.muted }}>{qs.title}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Suggestion du jour */}
          {suggested && (
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 2, textTransform: 'uppercase' }}>
                Suggestion
              </Text>
              <Pressable
                onPress={() => {
                  handleStart(suggested.title, 'strength');
                  suggested.exercises.forEach((ex) => {
                    handleAddExercise({
                      id: `${ex.name}-${Date.now()}`,
                      name: ex.name,
                      category: ex.category,
                      muscleGroups: suggested.focus,
                      sets: [],
                    });
                  });
                }}
                style={{ borderRadius: 20, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={['rgba(124,58,237,0.20)', 'rgba(6,182,212,0.10)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ padding: 20, gap: 10, borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)', borderRadius: 20 }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text.primary, flex: 1 }}>
                      {suggested.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.text.muted, fontWeight: '600' }}>
                      ~{suggested.estimatedDuration} min
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: colors.text.secondary }}>
                    {suggested.reason}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {suggested.focus.map((m) => (
                      <View key={m} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(124,58,237,0.20)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.35)' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.5 }}>{m}</Text>
                      </View>
                    ))}
                  </View>
                  <LinearGradient colors={['#7c3aed', '#06b6d4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>Démarrer cette séance →</Text>
                  </LinearGradient>
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* Ou séance libre */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 2, textTransform: 'uppercase' }}>
              Ou séance libre
            </Text>
            <Button
              label="Démarrer sans programme"
              variant="secondary"
              size="lg"
              fullWidth
              onPress={() => handleStart('Séance', selectedType)}
            />
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Vue : séance active ────────────────────────────────────

  const totalSets = activeSession.exercises.reduce(
    (t, e) => t + e.sets.length,
    0,
  );
  const completedSets = activeSession.exercises.reduce(
    (t, e) => t + e.sets.filter((s) => s.completed).length,
    0,
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      {/* Header fixe */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
          <SessionTimer elapsedSeconds={activeSession.elapsedSeconds} />

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>Séries</Text>
            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text.primary }}>
              {completedSets}<Text style={{ color: colors.text.muted, fontSize: 14 }}>/{totalSets}</Text>
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Pressable onPress={() => setShowFinishModal(true)} style={{ borderRadius: 12, overflow: 'hidden' }}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingHorizontal: 14, paddingVertical: 7 }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Terminer</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={handleDiscard} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 12, color: colors.status.danger, fontWeight: '700' }}>✕</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Liste exercices */}
      <ScrollView contentContainerClassName="px-4 py-3 gap-3 pb-8">
        {activeSession.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            lastWorkout={getLastWorkoutForExercise(exercise.name)}
            onStartRest={(s) => startRestTimer(s)}
          />
        ))}

        {/* Ajouter exercice */}
        <Pressable
          onPress={() => setShowExercisePicker(true)}
          className="flex-row items-center justify-center gap-2 py-4 rounded-2xl"
          style={{
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: 'rgba(124,58,237,0.4)',
          }}
        >
          <Text className="text-brand-primary font-semibold">
            + Ajouter un exercice
          </Text>
        </Pressable>
      </ScrollView>

      {/* Timer de repos */}
      {activeSession.isResting && activeSession.restSecondsLeft !== null && (
        <RestTimer
          secondsLeft={activeSession.restSecondsLeft}
          totalSeconds={defaultRestTime}
          isVisible={activeSession.isResting}
          onSkip={stopRestTimer}
          onAddTime={(s) => {
            useSessionStore
              .getState()
              .startRestTimer(
                (activeSession.restSecondsLeft ?? 0) + s,
              );
          }}
        />
      )}

      {/* Sélecteur exercice */}
      <ExercisePicker
        visible={showExercisePicker}
        onSelect={handleAddExercise}
        onClose={() => setShowExercisePicker(false)}
      />

      {/* Modal fin de séance */}
      <Modal
        visible={showFinishModal}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-bg-secondary px-6 py-8 gap-6">
          <Text className="text-2xl font-black text-text-primary">
            Terminer la séance
          </Text>

          <View className="gap-2">
            <Text className="text-sm text-text-secondary">Nom de la séance</Text>
            <TextInput
              className="bg-white/[0.08] rounded-xl px-4 py-3 text-text-primary"
              value={workoutName || 'Séance'}
              onChangeText={setWorkoutName}
              placeholderTextColor={colors.text.muted}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm text-text-secondary">
              Comment tu te sens ?
            </Text>
            <View className="flex-row gap-2">
              {([1, 2, 3, 4, 5] as const).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFeeling(f)}
                  className="flex-1 items-center py-3 rounded-xl"
                  style={{
                    backgroundColor:
                      feeling === f
                        ? 'rgba(124,58,237,0.25)'
                        : 'rgba(255,255,255,0.06)',
                    borderWidth: 1,
                    borderColor:
                      feeling === f ? '#7c3aed' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Ionicons
                    name={f === 1 ? 'sad-outline' : f === 2 ? 'remove-circle-outline' : f === 3 ? 'ellipse-outline' : f === 4 ? 'happy-outline' : 'flame-outline'}
                    size={22}
                    color={feeling === f ? '#fff' : colors.text.muted}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <View className="gap-3">
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-xs text-text-muted">Durée</Text>
                <Text className="text-base font-bold text-text-primary">
                  {Math.floor(activeSession.elapsedSeconds / 60)} min
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-text-muted">Exercices</Text>
                <Text className="text-base font-bold text-text-primary">
                  {activeSession.exercises.length}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-text-muted">Séries</Text>
                <Text className="text-base font-bold text-text-primary">
                  {completedSets}/{totalSets}
                </Text>
              </View>
            </View>
          </View>

          <View className="gap-2">
            <Button
              label="Sauvegarder la séance ✓"
              variant="gradient"
              size="lg"
              pill
              fullWidth
              onPress={handleFinish}
            />
            <Button
              label="Continuer la séance"
              variant="ghost"
              size="md"
              fullWidth
              onPress={() => setShowFinishModal(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
