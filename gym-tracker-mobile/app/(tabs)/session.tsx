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
import type { ActiveExercise, WorkoutType } from '@/types';

// ── Types de séance rapide ────────────────────────────────────

const QUICK_STARTS: Array<{
  title: string;
  type: WorkoutType;
  emoji: string;
  color: string;
}> = [
  { title: 'Force', type: 'strength', emoji: '💪', color: '#7c3aed' },
  { title: 'Hypertrophie', type: 'hypertrophy', emoji: '🏋️', color: '#06b6d4' },
  { title: 'Cardio', type: 'cardio', emoji: '🏃', color: '#10b981' },
  { title: 'Mobilité', type: 'mobility', emoji: '🧘', color: '#f59e0b' },
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
          {filtered.map((ex) => (
            <Pressable
              key={ex.name}
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
              <Text className="text-base">
                {ex.category === 'compound' ? '🏋️' : ex.category === 'isolation' ? '💪' : '⚡'}
              </Text>
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

  const handleAddExercise = useCallback(
    (exercise: Omit<ActiveExercise, 'isExpanded'>) => {
      addExercise({ ...exercise, isExpanded: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    },
    [addExercise],
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
    const suggested =
      profile ? getSuggestedSession(profile, workouts, null) : null;

    return (
      <SafeAreaView className="flex-1 bg-bg-primary">
        <ScrollView contentContainerClassName="px-5 py-4 gap-6">
          <Text className="text-2xl font-black text-text-primary">
            Nouvelle séance
          </Text>

          {/* Nom de la séance */}
          <View className="gap-2">
            <Text className="text-sm text-text-secondary">Nom (optionnel)</Text>
            <TextInput
              className="bg-white/[0.08] rounded-xl px-4 py-3 text-text-primary text-base"
              placeholder="Séance Push, Chest Day…"
              placeholderTextColor={colors.text.muted}
              value={workoutName}
              onChangeText={setWorkoutName}
            />
          </View>

          {/* Type de séance */}
          <View className="gap-2">
            <Text className="text-sm text-text-secondary">Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {QUICK_STARTS.map((qs) => (
                <Pressable
                  key={qs.type}
                  onPress={() => setSelectedType(qs.type)}
                  className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl"
                  style={{
                    backgroundColor:
                      selectedType === qs.type
                        ? `${qs.color}22`
                        : 'rgba(255,255,255,0.06)',
                    borderWidth: 1,
                    borderColor:
                      selectedType === qs.type
                        ? qs.color
                        : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <Text>{qs.emoji}</Text>
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color:
                        selectedType === qs.type ? qs.color : colors.text.secondary,
                    }}
                  >
                    {qs.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Suggestion IA */}
          {suggested && (
            <Card padding="md" className="gap-3">
              <View className="flex-row items-center gap-2">
                <Text>🤖</Text>
                <Text className="text-sm font-semibold text-text-primary">
                  Séance suggérée
                </Text>
              </View>
              <Text className="text-base font-bold text-text-primary">
                {suggested.title}
              </Text>
              <Text className="text-sm text-text-secondary">
                {suggested.reason}
              </Text>
              <Text className="text-xs text-text-muted">
                {suggested.exercises.length} exercices · ~{suggested.estimatedDuration} min
              </Text>
              <Button
                label="Utiliser cette suggestion"
                variant="secondary"
                size="sm"
                onPress={() => {
                  setWorkoutName(suggested.title);
                  handleStart(suggested.title, 'strength');
                  suggested.exercises.forEach((ex) => {
                    addExercise({
                      id: `${ex.name}-${Date.now()}`,
                      name: ex.name,
                      category: ex.category,
                      muscleGroups: suggested.focus,
                      sets: Array.from({ length: ex.targetSets }, () => ({
                        weight: ex.targetWeight ?? 0,
                        reps:
                          typeof ex.targetReps === 'number'
                            ? ex.targetReps
                            : ex.targetReps[0] ?? 8,
                        setType: 'normal' as const,
                        restTime: ex.restTime,
                        completed: false,
                      })),
                      isExpanded: true,
                    });
                  });
                }}
              />
            </Card>
          )}

          {/* Démarrer */}
          <Button
            label="Démarrer la séance"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => handleStart(workoutName, selectedType)}
          />
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
      <View
        className="flex-row items-center justify-between px-5 py-3"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <SessionTimer elapsedSeconds={activeSession.elapsedSeconds} />

        <View className="items-center">
          <Text className="text-xs text-text-muted">Progression</Text>
          <Text className="text-sm font-bold text-text-primary">
            {completedSets}/{totalSets} séries
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setShowFinishModal(true)}
            className="px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: 'rgba(16,185,129,0.2)' }}
          >
            <Text className="text-xs font-semibold text-status-success">
              Terminer
            </Text>
          </Pressable>
          <Pressable onPress={handleDiscard}>
            <Text className="text-xs text-status-danger">✕</Text>
          </Pressable>
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
                  <Text className="text-xl">
                    {f === 1 ? '😩' : f === 2 ? '😕' : f === 3 ? '😐' : f === 4 ? '😊' : '🔥'}
                  </Text>
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
              variant="primary"
              size="lg"
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
