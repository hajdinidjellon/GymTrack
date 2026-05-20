import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, TextInput, Modal,
  Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useT } from '@/lib/i18n';
import { ExerciseCard } from '@/components/session/ExerciseCard';
import { RestTimer } from '@/components/session/RestTimer';
import { SessionTimer } from '@/components/session/TimerRing';
import { Mascot } from '@/components/mascot/Mascot';
import { ScreenBackground, BG_COLORS } from '@/components/ui/ScreenBackground';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getSuggestedSession, calculate1RM } from '@/lib/aiPlanner';
import { MUSCLE_LABELS } from '@/lib/gamification';
import { useCelebrationStore } from '@/stores/celebrationStore';
import { EXERCISE_GROUPS, filterGroups, type ExerciseDefinition, type ExerciseGroup } from '@/lib/exerciseDatabase';
import type { ActiveExercise, MuscleGroup, WorkoutSet, WorkoutType } from '@/types';

const WORKOUT_MODES: Array<{
  type: WorkoutType;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  { type: 'strength',    icon: 'barbell-outline', color: '#38bdf8' },
  { type: 'hypertrophy', icon: 'body-outline',    color: '#818cf8' },
  { type: 'cardio',      icon: 'pulse-outline',   color: '#34d399' },
  { type: 'mobility',    icon: 'leaf-outline',    color: '#fb923c' },
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

// ── Card exercice premium ─────────────────────────────────────────────
function ExerciseCard_Picker({
  ex, group, onPress,
}: {
  ex: ExerciseDefinition;
  group: ExerciseGroup;
  onPress: () => void;
}) {
  const iconName = ex.category === 'compound' ? 'barbell' : ex.category === 'isolation' ? 'fitness' : 'flash';
  const muscles  = ex.muscleGroups.slice(0, 3)
    .map((m) => MUSCLE_GROUP_OPTIONS.find((o) => o.id === m)?.label ?? m)
    .join(' · ');
  const catLabel = ex.category === 'compound' ? 'Compound' : ex.category === 'isolation' ? 'Isolation' : 'Accessoire';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: pressed ? 'rgba(255,255,255,0.07)' : 'rgba(12,12,22,0.90)',
        overflow: 'hidden',
      })}
    >
      {/* Bloc icône gauche avec dégradé */}
      <LinearGradient
        colors={[`${group.color}35`, `${group.color}12`] as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: 68, height: 68, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={28} color={group.color} />
      </LinearGradient>

      {/* Séparateur vertical coloré */}
      <View style={{ width: 1, height: 38, backgroundColor: `${group.color}30` }} />

      {/* Texte */}
      <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 15 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2, marginBottom: 4 }}>
          {ex.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.38)' }}>
            {muscles}
          </Text>
          <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.20)' }} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: `${group.color}CC` }}>
            {catLabel}
          </Text>
        </View>
      </View>

      {/* Flèche */}
      <View style={{ marginRight: 16 }}>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.22)" />
      </View>
    </Pressable>
  );
}

// ── Picker principal ─────────────────────────────────────────────────
function ExercisePicker({ visible, onSelect, onClose }: {
  visible: boolean;
  onSelect: (exercise: Omit<ActiveExercise, 'isExpanded'>) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [search, setSearch]               = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ExerciseGroup | null>(null);
  const [customMode, setCustomMode]       = useState(false);
  const [customName, setCustomName]       = useState('');
  const [customMuscles, setCustomMuscles] = useState<MuscleGroup[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredGroups = filterGroups(search);
  const searching      = search.trim().length > 0;

  const searchResults: Array<{ ex: ExerciseDefinition; group: ExerciseGroup }> = searching
    ? filteredGroups.flatMap((g) => g.exercises.map((ex) => ({ ex, group: g })))
    : [];

  const handlePick = (ex: ExerciseDefinition) => {
    onSelect({
      id: `${ex.name}-${Date.now()}`,
      name: ex.name,
      category: ex.category,
      muscleGroups: ex.muscleGroups,
      sets: [{ weight: 0, reps: 8, setType: 'normal', completed: false }],
    });
    setSearch('');
    setSelectedGroup(null);
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
    setCustomMode(false); setCustomName(''); setCustomMuscles([]);
    setSearch(''); setSelectedGroup(null);
    onClose();
  };

  const toggleMuscle = (m: MuscleGroup) =>
    setCustomMuscles((p) => p.includes(m) ? p.filter((x) => x !== m) : [...p, m]);

  const handleBack = () => {
    if (customMode)     { setCustomMode(false); return; }
    if (selectedGroup)  { setSelectedGroup(null); return; }
    onClose();
  };

  const accentColor = selectedGroup ? selectedGroup.color : BG_COLORS.accent;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onDismiss={() => { setCustomMode(false); setSearch(''); setSelectedGroup(null); }}
    >
      <View style={{ flex: 1, backgroundColor: '#08080f' }}>
        <ScreenBackground variant="session" topHalo={false} />
        <SafeAreaView style={{ flex: 1 }}>

          {/* ══ HEADER PREMIUM ══ */}
          <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>

              {/* Titre + sous-titre */}
              <View style={{ flex: 1 }}>
                {/* Breadcrumb / back */}
                {(customMode || selectedGroup) ? (
                  <Pressable
                    onPress={handleBack}
                    hitSlop={10}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}
                  >
                    <Ionicons name="arrow-back" size={16} color={accentColor} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: accentColor }}>
                      {selectedGroup ? 'Groupes musculaires' : 'Retour'}
                    </Text>
                  </Pressable>
                ) : null}

                <Text style={{
                  fontSize: 32, fontWeight: '900', color: '#fff',
                  letterSpacing: -1, lineHeight: 36,
                }}>
                  {customMode
                    ? t('picker.customTitle')
                    : selectedGroup
                    ? selectedGroup.label.toUpperCase()
                    : 'Exercices'}
                </Text>

                <Text style={{
                  fontSize: 13, fontWeight: '600', marginTop: 5,
                  color: selectedGroup ? `${selectedGroup.color}BB` : 'rgba(255,255,255,0.38)',
                }}>
                  {customMode
                    ? 'Crée ton exercice personnalisé'
                    : selectedGroup
                    ? `${selectedGroup.exercises.length} exercices · ${selectedGroup.hint}`
                    : 'Sélectionne un groupe musculaire'}
                </Text>
              </View>

              {/* Bouton fermer / icône search */}
              {!selectedGroup && !customMode ? (
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  style={({ pressed }) => ({
                    width: 42, height: 42, borderRadius: 21,
                    backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
                    alignItems: 'center', justifyContent: 'center',
                    marginTop: 2,
                  })}
                >
                  <Ionicons name="close" size={20} color="rgba(255,255,255,0.75)" />
                </Pressable>
              ) : selectedGroup ? (
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  style={({ pressed }) => ({
                    width: 42, height: 42, borderRadius: 21,
                    backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
                    alignItems: 'center', justifyContent: 'center',
                    marginTop: 2,
                  })}
                >
                  <Ionicons name="close" size={20} color="rgba(255,255,255,0.75)" />
                </Pressable>
              ) : null}
            </View>

            {/* Barre de recherche — visible uniquement sur l'écran principal */}
            {!selectedGroup && !customMode && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1.5,
                borderColor: searchFocused || searching ? `${BG_COLORS.accent}70` : 'rgba(255,255,255,0.08)',
                borderRadius: 16, paddingHorizontal: 14, marginTop: 16,
                shadowColor: searchFocused ? BG_COLORS.accent : 'transparent',
                shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
              }}>
                <Ionicons name="search-outline" size={18}
                  color={searchFocused || searching ? BG_COLORS.accent : 'rgba(255,255,255,0.30)'} />
                <TextInput
                  style={{ flex: 1, fontSize: 15, color: '#fff', paddingVertical: 13, fontWeight: '600' }}
                  placeholder="Rechercher un exercice…"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={search}
                  onChangeText={setSearch}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} hitSlop={10}>
                    <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.35)" />
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* ══ MODE CUSTOM ══ */}
          {customMode ? (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 22 }}>
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.8, textTransform: 'uppercase' }}>
                  {t('picker.customNameLabel')}
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderWidth: 1.5,
                  borderColor: customName.trim().length >= 2 ? BG_COLORS.accent : 'rgba(255,255,255,0.09)',
                  borderRadius: 18, paddingHorizontal: 16,
                  shadowColor: customName.trim().length >= 2 ? BG_COLORS.accent : 'transparent',
                  shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
                }}>
                  <Ionicons name="create-outline" size={20}
                    color={customName.trim().length >= 2 ? BG_COLORS.accent : 'rgba(255,255,255,0.30)'} />
                  <TextInput
                    style={{ flex: 1, fontSize: 17, color: '#fff', paddingVertical: 16, fontWeight: '700' }}
                    placeholder={t('picker.customNamePlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.22)"
                    value={customName}
                    onChangeText={setCustomName}
                    autoFocus
                  />
                </View>
              </View>

              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.8, textTransform: 'uppercase' }}>
                  {t('picker.customMusclesLabel')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {MUSCLE_GROUP_OPTIONS.map((m) => {
                    const isSel = customMuscles.includes(m.id);
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => toggleMuscle(m.id)}
                        style={{
                          paddingHorizontal: 16, paddingVertical: 11, borderRadius: 14,
                          backgroundColor: isSel ? `${BG_COLORS.accent}20` : 'rgba(255,255,255,0.05)',
                          borderWidth: 1.5,
                          borderColor: isSel ? `${BG_COLORS.accent}80` : 'rgba(255,255,255,0.09)',
                          flexDirection: 'row', alignItems: 'center', gap: 8,
                          shadowColor: isSel ? BG_COLORS.accent : 'transparent',
                          shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
                        }}
                      >
                        {isSel && <Ionicons name="checkmark" size={14} color={BG_COLORS.accent} />}
                        <Text style={{ fontSize: 14, fontWeight: '800', color: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.50)' }}>
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
                  borderRadius: 20, marginTop: 8,
                  opacity: customName.trim().length < 2 || customMuscles.length === 0 ? 0.35 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  shadowColor: BG_COLORS.accent, shadowOpacity: 0.50, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
                  elevation: 12,
                })}
              >
                <LinearGradient
                  colors={[BG_COLORS.accent, '#0ea5e9'] as [string, string]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 20, paddingVertical: 20,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1 }}>
                    {t('picker.createBtn')}
                  </Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>

          ) : selectedGroup ? (
            /* ══ LISTE EXERCICES ══ */
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
              {/* Container glassmorphism */}
              <View style={{
                borderRadius: 22, overflow: 'hidden',
                borderWidth: 1.5,
                borderColor: `${selectedGroup.color}30`,
                backgroundColor: 'rgba(12,12,22,0.85)',
                shadowColor: selectedGroup.color,
                shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
                elevation: 10,
              }}>
                {selectedGroup.exercises.map((ex, i) => (
                  <React.Fragment key={`${ex.name}-${i}`}>
                    <ExerciseCard_Picker
                      ex={ex}
                      group={selectedGroup}
                      onPress={() => handlePick(ex)}
                    />
                    {i < selectedGroup.exercises.length - 1 && (
                      <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 68 }} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </ScrollView>

          ) : (
            /* ══ GRILLE GROUPES + RECHERCHE ══ */
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
              {searching ? (
                /* Résultats de recherche */
                <View>
                  {searchResults.length === 0 ? (
                    <View style={{
                      alignItems: 'center', paddingVertical: 56, gap: 16,
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
                    }}>
                      <Ionicons name="search" size={44} color="rgba(255,255,255,0.15)" />
                      <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', fontWeight: '700' }}>
                        {t('picker.noResults')}
                      </Text>
                    </View>
                  ) : (
                    <View style={{
                      borderRadius: 22, overflow: 'hidden',
                      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.09)',
                      backgroundColor: 'rgba(12,12,22,0.85)',
                    }}>
                      {searchResults.map(({ ex, group }, i) => (
                        <React.Fragment key={`${ex.name}-${i}`}>
                          <ExerciseCard_Picker ex={ex} group={group} onPress={() => handlePick(ex)} />
                          {i < searchResults.length - 1 && (
                            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 68 }} />
                          )}
                        </React.Fragment>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                /* ── Grille groupes musculaires premium ── */
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {EXERCISE_GROUPS.map((group) => (
                      <Pressable
                        key={group.id}
                        onPress={() => setSelectedGroup(group)}
                        style={({ pressed }) => ({
                          width: '47.5%',
                          borderRadius: 22,
                          overflow: 'hidden',
                          borderWidth: 1.5,
                          borderColor: pressed ? group.color : `${group.color}45`,
                          transform: [{ scale: pressed ? 0.95 : 1 }],
                          shadowColor: group.color,
                          shadowOpacity: pressed ? 0.55 : 0.20,
                          shadowRadius: pressed ? 22 : 14,
                          shadowOffset: { width: 0, height: 6 },
                          elevation: 10,
                        })}
                      >
                        <LinearGradient
                          colors={[`${group.color}28`, `${group.color}08`, '#0a0a15'] as [string, string, string]}
                          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                          style={{ paddingTop: 24, paddingBottom: 20, paddingHorizontal: 16, alignItems: 'center', gap: 14 }}
                        >
                          {/* Icône avec glow */}
                          <View style={{
                            width: 62, height: 62, borderRadius: 20,
                            backgroundColor: `${group.color}20`,
                            borderWidth: 1.5, borderColor: `${group.color}55`,
                            alignItems: 'center', justifyContent: 'center',
                            shadowColor: group.color, shadowOpacity: 0.60,
                            shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
                            elevation: 8,
                          }}>
                            <Ionicons name={group.icon as keyof typeof Ionicons.glyphMap} size={28} color={group.color} />
                          </View>

                          {/* Texte */}
                          <View style={{ alignItems: 'center', gap: 5 }}>
                            <Text style={{
                              fontSize: 13, fontWeight: '900', color: '#fff',
                              letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center',
                            }}>
                              {group.label}
                            </Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.40)', textAlign: 'center' }}>
                              {group.exercises.length} exercices
                            </Text>
                          </View>
                        </LinearGradient>
                      </Pressable>
                    ))}
                  </View>

                  {/* CTA exercice perso */}
                  <Pressable
                    onPress={() => setCustomMode(true)}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', gap: 16,
                      paddingVertical: 20, paddingHorizontal: 20, marginTop: 4,
                      borderRadius: 22, borderWidth: 1.5, borderStyle: 'dashed',
                      borderColor: pressed ? BG_COLORS.accent : `${BG_COLORS.accent}50`,
                      backgroundColor: pressed ? 'rgba(56,189,248,0.08)' : 'transparent',
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                  >
                    <View style={{
                      width: 50, height: 50, borderRadius: 16,
                      backgroundColor: 'rgba(56,189,248,0.12)',
                      borderWidth: 1.5, borderColor: `${BG_COLORS.accent}45`,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ionicons name="add" size={24} color={BG_COLORS.accent} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: BG_COLORS.accent, letterSpacing: -0.2 }}>
                        {t('picker.customCta')}
                      </Text>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', fontWeight: '600' }}>
                        {t('picker.customCtaSub')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.28)" />
                  </Pressable>
                </View>
              )}
            </ScrollView>
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
  const showCelebration = useCelebrationStore((s) => s.show);
  const workouts = useWorkoutStore((s) => s.workouts);
  const defaultRestTime = useSettingsStore((s) => s.settings.defaultRestTime);
  const t = useT();

  const QUICK_STARTS = WORKOUT_MODES.map((m) => ({
    ...m,
    title:    t(`session.type.${m.type}.title` as any),
    subtitle: t(`session.type.${m.type}.subtitle` as any),
    hint:     t(`session.type.${m.type}.hint` as any),
  }));

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

    // Détection PR — compare chaque exercice avec les PRs du profil
    const currentPRs = profile?.prs ?? [];
    for (const exercise of workout.exercises) {
      if (exercise.sets.length === 0) continue;
      const best1RM = Math.max(...exercise.sets.map((s) => calculate1RM(s.weight, s.reps)));
      const existing = currentPRs.find((pr) => pr.exercise === exercise.name);
      if (best1RM > (existing?.oneRepMax ?? 0) + 0.5) {
        showCelebration({
          type: 'pr',
          title: t('dashboard.prTitle'),
          subtitle: t('dashboard.prSubtitle', { exercise: exercise.name }),
        });
        break; // Une seule célébration par séance
      }
    }
  };

  const handleDiscard = () => {
    Alert.alert(t('session.discardTitle'), t('session.discardMessage'), [
      { text: t('session.discardCancel'), style: 'cancel' },
      { text: t('session.discardConfirm'), style: 'destructive', onPress: () => discardSession() },
    ]);
  };

  // ── PAS DE SÉANCE ACTIVE ─────────────────────────────────────────
  if (!activeSession) {
    const selectedQS = QUICK_STARTS.find((q) => q.type === selectedType) ?? QUICK_STARTS[0]!;
    const suggested = profile ? getSuggestedSession(profile, workouts, null, selectedType) : null;

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
                  {t('session.today')}
                </Text>
                <Text style={{ fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1.6, lineHeight: 42 }}>
                  {t('session.newSession')}
                </Text>
                <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.50)', fontWeight: '600', marginTop: 8, lineHeight: 20 }}>
                  {t('session.subtitle')}
                </Text>
              </View>

              {/* ── TYPE DE SÉANCE ── */}
              <View style={{ marginBottom: 28 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.28)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
                  {t('session.modeLabel')}
                </Text>
                <View style={{ gap: 14 }}>
                  {QUICK_STARTS.map((qs) => {
                    const isSel = selectedType === qs.type;
                    return (
                      <Pressable
                        key={qs.type}
                        onPress={() => setSelectedType(qs.type)}
                        style={({ pressed }) => ({
                          transform: [{ scale: pressed ? 0.983 : 1 }],
                          borderRadius: 24,
                          shadowColor: '#000',
                          shadowOpacity: isSel ? 0.60 : 0.45,
                          shadowRadius: isSel ? 28 : 18,
                          shadowOffset: { width: 0, height: isSel ? 12 : 7 },
                          elevation: isSel ? 14 : 8,
                        })}
                      >
                        <LinearGradient
                          colors={isSel ? ['#1e1e32', '#161628'] : ['#16162a', '#111120']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            height: 92,
                            borderRadius: 24,
                            borderWidth: isSel ? 1 : 0.5,
                            borderColor: isSel ? `${qs.color}50` : 'rgba(255,255,255,0.10)',
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            gap: 16,
                            overflow: 'hidden',
                          }}
                        >
                          {/* Accent bar gauche */}
                          <View style={{
                            width: 3,
                            height: 42,
                            borderRadius: 2,
                            backgroundColor: isSel ? qs.color : 'rgba(255,255,255,0.10)',
                            opacity: isSel ? 0.90 : 1,
                          }} />

                          {/* Icône */}
                          <View style={{
                            width: 46,
                            height: 46,
                            borderRadius: 14,
                            backgroundColor: `${qs.color}18`,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Ionicons
                              name={qs.icon}
                              size={22}
                              color={isSel ? qs.color : `${qs.color}90`}
                            />
                          </View>

                          {/* Texte */}
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              fontSize: 17,
                              fontWeight: '800',
                              color: isSel ? '#fff' : 'rgba(255,255,255,0.68)',
                              letterSpacing: -0.5,
                            }}>
                              {qs.title}
                            </Text>
                            <Text style={{
                              fontSize: 12,
                              color: isSel ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.26)',
                              fontWeight: '600',
                              marginTop: 4,
                              letterSpacing: 0.1,
                            }}>
                              {qs.subtitle}
                            </Text>
                          </View>

                          {/* Hint + chevron */}
                          <View style={{ alignItems: 'flex-end', gap: 6 }}>
                            <Text style={{
                              fontSize: 9,
                              fontWeight: '800',
                              color: isSel ? qs.color : 'rgba(255,255,255,0.20)',
                              letterSpacing: 1.4,
                              textTransform: 'uppercase',
                            }}>
                              {qs.hint}
                            </Text>
                            <Ionicons
                              name="chevron-forward"
                              size={14}
                              color={isSel ? `${qs.color}80` : 'rgba(255,255,255,0.18)'}
                            />
                          </View>
                        </LinearGradient>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* ── SUGGESTION ── */}
              {suggested && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12 }}>
                    {t('session.suggestionLabel')}
                  </Text>
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 22, borderWidth: 1,
                    borderColor: `${selectedQS.color}38`,
                    overflow: 'hidden',
                  }}>
                    <LinearGradient
                      colors={[`${selectedQS.color}22`, 'transparent']}
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
                            backgroundColor: `${selectedQS.color}20`,
                            borderWidth: 1, borderColor: `${selectedQS.color}45`,
                          }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: selectedQS.color, textTransform: 'uppercase', letterSpacing: 1 }}>
                              {MUSCLE_LABELS[m]}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <Pressable
                        onPress={() => {
                          handleStart(suggested.title, selectedType);
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
                            {t('common.start')}
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
                  {t('session.freeSectionLabel')}
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
                      {t('session.freeStart')}
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
                    {t('session.zeroState')}
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
              {t('session.sets')}
            </Text>
            <Text style={{ fontSize: 19, fontWeight: '900', color: '#fff', letterSpacing: -0.4 }}>
              {completedSets}<Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14 }}>/{totalSets}</Text>
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Pressable
              onPress={() => setShowFinishModal(true)}
              style={({ pressed }) => ({
                borderRadius: 20, overflow: 'hidden',
                shadowColor: BG_COLORS.accent,
                shadowOpacity: pressed ? 0.2 : 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              })}
            >
              <View style={{
                backgroundColor: BG_COLORS.accent,
                paddingHorizontal: 16, paddingVertical: 10,
                borderRadius: 20,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#07090f', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  {t('session.finish')}
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
              {t('session.addExercise')}
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
        <Modal visible={showFinishModal} animationType="slide" presentationStyle="pageSheet">
          <View style={{ flex: 1, backgroundColor: BG_COLORS.base }}>
            <ScreenBackground variant="session" topHalo={false} />

            <SafeAreaView style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 32, gap: 24 }}>
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1.2 }}>
                  {t('session.finishTitle')}
                </Text>

                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 2, textTransform: 'uppercase' }}>
                    {t('session.sessionName')}
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
                    {t('session.howFeel')}
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
                    { label: t('session.duration'), value: `${Math.floor(activeSession.elapsedSeconds / 60)} ${t('unit.min')}` },
                    { label: t('session.exercises'), value: String(activeSession.exercises.length) },
                    { label: t('session.sets'), value: `${completedSets}/${totalSets}` },
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
                        {t('session.saveSession')}
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable onPress={() => setShowFinishModal(false)} style={{ paddingVertical: 14, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: '700' }}>
                      {t('session.continueSession')}
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
