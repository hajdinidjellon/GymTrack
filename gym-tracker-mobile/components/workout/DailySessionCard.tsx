import React from 'react';
import { View, Text, Image, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getSuggestedSession } from '@/lib/aiPlanner';
import { hud } from '@/constants/theme';
import type { WorkoutSet, WorkoutType } from '@/types';

// ═══════════════════════════════════════════════════════════════════
// CARTE SÉANCE DU JOUR — composant partagé (onglet Séance + IA Coach).
// Extrait de app/(tabs)/session.tsx : frame PNG seance-frame4, badge
// AI Coach, titre PUSH/(POUSSER), stats et bouton DÉMARRER.
// Lit settingsStore.trainingMode → les deux pages restent synchronisées.
// ═══════════════════════════════════════════════════════════════════

const SEANCE_FRAME = require('@/assets/images/seance-frame4.png') as number;

const HUD_CYAN    = hud.cyan.primary;
const HUD_CYAN_HI = hud.cyan.bright;
const HUD_BORDER  = hud.glow.cyan;

// ── Icônes pro pour les modes : MaterialCommunityIcons (Expo) ───────
const ICON_SIZE = 34;

function ModeIconBarbell({ color }: { color: string }) {
  // weight-lifter : silhouette qui soulève un haltère — emblématique de l'hypertrophie
  return <MaterialCommunityIcons name="weight-lifter" size={ICON_SIZE} color={color} />;
}

function ModeIconKettlebell({ color }: { color: string }) {
  // arm-flex : biceps fléchi — symbole universel de la force pure
  return <MaterialCommunityIcons name="arm-flex" size={ICON_SIZE} color={color} />;
}

function ModeIconPulse({ color }: { color: string }) {
  // heart-pulse : cœur avec ligne ECG intégrée — cardio / endurance
  return <MaterialCommunityIcons name="heart-pulse" size={ICON_SIZE} color={color} />;
}

function ModeIconBody({ color }: { color: string }) {
  // run-fast : silhouette complète en mouvement — full body / athlète
  return <MaterialCommunityIcons name="run-fast" size={ICON_SIZE} color={color} />;
}

// ── Définition complète des modes d'entraînement ────────────────────
export type TrainingMode = {
  type: WorkoutType;
  label: string;
  Icon: React.ComponentType<{ color: string }>;
  info: string;          // barre d'info dynamique sous le sélecteur
  duration: string;      // ex "75-90 MIN"
  exercises: string;     // ex "5 EXERCICES"
  volume: string;        // ex "6 800-9 200 KG"
  sessionName: string;   // ex "PUSH"
  sessionSubLabel: string; // ex "(POUSSER)"
  muscles: string;       // ex "PECTORAUX · ÉPAULES · BRAS"
};

export const TRAINING_MODES: TrainingMode[] = [
  {
    type: 'hypertrophy', label: 'HYPERTROPHIE', Icon: ModeIconBarbell,
    info: '8-12 REPS · REPOS 60-90S · VOLUME ÉLEVÉ',
    duration: '75-90 MIN', exercises: '5 EXERCICES', volume: '6 800-9 200 KG',
    sessionName: 'PUSH', sessionSubLabel: '(POUSSER)',
    muscles: 'PECTORAUX · ÉPAULES · BRAS',
  },
  {
    type: 'strength', label: 'FORCE', Icon: ModeIconKettlebell,
    info: '3-6 REPS · REPOS 3-5MIN · CHARGE LOURDE',
    duration: '90-110 MIN', exercises: '4 EXERCICES', volume: '4 500-6 000 KG',
    sessionName: 'PUSH', sessionSubLabel: '(POUSSER)',
    muscles: 'PECTORAUX · ÉPAULES · TRICEPS',
  },
  {
    type: 'endurance', label: 'ENDURANCE', Icon: ModeIconPulse,
    info: '15-25 REPS · REPOS 30-45S · TEMPO RAPIDE',
    duration: '45-60 MIN', exercises: '6 EXERCICES', volume: '3 500-5 000 KG',
    sessionName: 'FULL', sessionSubLabel: '(CIRCUIT)',
    muscles: 'CORPS ENTIER · CARDIO',
  },
  {
    type: 'fullbody', label: 'FULL BODY', Icon: ModeIconBody,
    info: 'TOUS GROUPES · 3 SÉANCES/SEM',
    duration: '60-80 MIN', exercises: '7 EXERCICES', volume: '5 500-7 500 KG',
    sessionName: 'FULL', sessionSubLabel: '(COMPLET)',
    muscles: 'CORPS ENTIER',
  },
];

export function DailySessionCard({ buttonLabel = 'DÉMARRER LA SÉANCE', style, onAfterStart }: {
  buttonLabel?: string;
  /** Marges/offsets spécifiques à la page hôte (le PNG a des zones transparentes). */
  style?: StyleProp<ViewStyle>;
  /** Appelé après le démarrage (ex : navigation vers l'onglet Séance). */
  onAfterStart?: () => void;
}) {
  const { startSession, addExercise } = useSessionStore();
  const { getLastWorkoutForExercise } = useWorkoutStore();
  const workouts = useWorkoutStore((s) => s.workouts);
  const { profile } = useProfileStore();
  const defaultRestTime = useSettingsStore((s) => s.settings.defaultRestTime);
  const trainingMode = useSettingsStore((s) => s.settings.trainingMode);

  const mode = TRAINING_MODES.find((m) => m.type === trainingMode) ?? TRAINING_MODES[0]!;

  const handleStartSuggested = () => {
    const suggested = profile ? getSuggestedSession(profile, workouts, null, mode.type) : null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
    startSession(suggested?.title ?? mode.sessionName, mode.type);
    if (suggested) {
      suggested.exercises.forEach((ex, i) => {
        const last = getLastWorkoutForExercise(ex.name);
        const prevSets = last?.exercises.find(
          (e) => e.name.toLowerCase() === ex.name.toLowerCase(),
        )?.sets;
        const targetReps = Array.isArray(ex.targetReps) ? ex.targetReps[0] : ex.targetReps;
        const sets: WorkoutSet[] = prevSets?.length
          ? prevSets.map((p) => ({
              weight: p.weight, reps: p.reps, setType: p.setType,
              restTime: ex.restTime ?? defaultRestTime, completed: false,
            }))
          : Array.from({ length: ex.targetSets }, () => ({
              weight: ex.targetWeight ?? 0,
              reps: targetReps,
              setType: 'normal' as const,
              restTime: ex.restTime ?? defaultRestTime,
              completed: false,
            }));
        addExercise({
          id: `${ex.name}-${Date.now()}-${i}`,
          name: ex.name,
          category: ex.category,
          muscleGroups: suggested.focus,
          sets,
          isExpanded: i === 0,
        });
      });
    }
    onAfterStart?.();
  };

  // Le PNG contient déjà la fente bouton "chevron" en bas → on n'ajoute
  // PAS de Svg pour le bouton, juste un Pressable transparent à la
  // bonne position avec le texte par-dessus.
  return (
    <View
      style={[
        {
          alignSelf: 'stretch',
          aspectRatio: 1313 / 1198,
          zIndex: 10,
          elevation: 10,
        },
        style,
      ]}
      pointerEvents="box-none"
    >
      {/* Frame PNG en background */}
      <View style={{ width: '100%', height: '100%' }} pointerEvents="box-none">
        <Image
          source={SEANCE_FRAME}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          resizeMode="contain"
        />

        {/* AI Coach badge — top right (remonté, texte réduit) */}
        <View style={{
          position: 'absolute', top: '3%', right: '7%',
          flexDirection: 'row', alignItems: 'center', gap: 3,
          paddingHorizontal: 7, paddingVertical: 3,
          borderRadius: 999,
          borderWidth: 1, borderColor: HUD_CYAN,
          backgroundColor: 'rgba(5,11,22,0.85)',
        }}>
          <Ionicons name="sparkles" size={7} color={HUD_CYAN_HI} />
          <Text style={{ fontSize: 7, fontWeight: '800', color: HUD_CYAN, letterSpacing: 0.5 }}>
            AI Coach
          </Text>
        </View>

        {/* SÉANCE DU JOUR label + text content — décalé vers la droite
            pour laisser respirer le hex mascotte en haut-gauche du PNG */}
        <View style={{
          position: 'absolute', left: '32%', top: '18%', width: '42%',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <Text style={{
              fontSize: 10, fontWeight: '900', color: HUD_CYAN,
              letterSpacing: 1.2, textTransform: 'uppercase',
            }}>
              SÉANCE DU JOUR
            </Text>
            <Ionicons name="flash" size={10} color={HUD_CYAN_HI} />
          </View>
          <Text
            numberOfLines={1} adjustsFontSizeToFit
            style={{
              fontSize: 38, fontWeight: '900', color: '#fff',
              letterSpacing: -1.2, lineHeight: 40,
            }}
          >
            {mode.sessionName}
          </Text>
          <Text style={{
            fontSize: 14, fontWeight: '700', color: '#fff',
            letterSpacing: 0.5, marginTop: 2,
          }}>
            {mode.sessionSubLabel}
          </Text>
          <Text style={{
            fontSize: 11, fontWeight: '900', color: HUD_CYAN_HI,
            letterSpacing: 1, textTransform: 'uppercase', marginTop: 6,
          }}>
            {mode.label}
          </Text>
          <Text
            numberOfLines={2}
            style={{
              fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.85)',
              letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 4,
            }}
          >
            {mode.muscles}
          </Text>
        </View>
      </View>

      {/* Stats row — légèrement remonté par-dessus le bas du frame,
          mais positionné plus BAS qu'avant (marginTop moins négatif). */}
      <View style={{
        marginTop: -130,
        paddingHorizontal: 18, gap: 14,
      }}>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: 'rgba(93,222,255,0.18)',
          borderRadius: 8,
          backgroundColor: 'rgba(8,14,28,0.35)',
          paddingVertical: 8,
          paddingHorizontal: 4,
        }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="time-outline" size={11} color={HUD_CYAN} />
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 0.4 }}>
                {mode.duration}
              </Text>
            </View>
            <Text style={{ fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 1, marginTop: 3, textTransform: 'uppercase' }}>
              DURÉE ESTIMÉE
            </Text>
          </View>

          <View style={{ width: 1, backgroundColor: HUD_BORDER, marginVertical: 4 }} />

          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="barbell-outline" size={11} color={HUD_CYAN} />
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 0.4 }}>
                {mode.exercises}
              </Text>
            </View>
            <Text style={{ fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 1, marginTop: 3, textTransform: 'uppercase' }}>
              SUGGÉRÉS
            </Text>
          </View>

          <View style={{ width: 1, backgroundColor: HUD_BORDER, marginVertical: 4 }} />

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text
              numberOfLines={1} adjustsFontSizeToFit
              style={{ fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 0.3 }}
            >
              {mode.volume}
            </Text>
            <Text style={{ fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 }}>
              VOLUME
            </Text>
          </View>
        </View>

        {/* Bouton DÉMARRER — wrappé dans une View qui porte les offsets
            (Pressable parfois ignore marginTop/transform via sa fonction style). */}
        <View
          style={{
            alignSelf: 'center',
            marginTop: 22,
            transform: [{ translateX: -40 }],
          }}
        >
          <Pressable
            onPress={handleStartSuggested}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 8,
              paddingHorizontal: 20,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{
              fontSize: 12, fontWeight: '900', color: '#fff',
              letterSpacing: 1.2, textTransform: 'uppercase',
            }}>
              {buttonLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
