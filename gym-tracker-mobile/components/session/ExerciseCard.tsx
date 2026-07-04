/**
 * CARTE EXERCICE (focus view) — DA HUD sci-fi.
 *
 * Affichée quand l'utilisateur tape une mini-carte sur le SessionDashboard.
 * Layout : back arrow + header label · carte octogonale principale (badge
 * numéro + nom + ratio séries) · grille 4 séries (états completed / active /
 * future) · inputs poids/reps avec ± · sélecteur RPE 6-10 · CTAs VALIDER LA
 * SÉRIE (gradient + chevrons) et + AJOUTER SÉRIE (outline).
 *
 * Tokens DA + OctagonShape importés de SessionDashboard pour cohérence.
 */
import React, { useMemo, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, ImageBackground, StyleSheet, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DA, OctagonShape } from './SessionDashboard';
import { PremiumFrame } from '@/components/ui/PremiumFrame';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useMuscleLabels } from '@/lib/i18n';
import type { ActiveExercise, Workout, WorkoutSet } from '@/types';

interface ExerciseCardProps {
  exercise: ActiveExercise;
  lastWorkout: Workout | undefined;
  onStartRest: (seconds: number) => void;
  onBack: () => void;
  bottomPad: number;
}

const RPE_OPTIONS = [6, 7, 8, 9, 10] as const;
const DASHBOARD_BG = require('@/assets/images/background-dashboard-session.png');

// ── Helpers ──────────────────────────────────────────────────────────
function muscleLabel(muscles: string[], labels: Record<string, string>): string {
  return muscles.slice(0, 3).map((m) => (labels[m] ?? m).toUpperCase()).join(' · ');
}

function categoryLabel(cat: string): string {
  switch (cat) {
    case 'compound':  return 'COMPOUND';
    case 'isolation': return 'ISOLATION';
    case 'accessory': return 'ACCESSORY';
    default:          return cat.toUpperCase();
  }
}

// ── Badge octogonal numéroté (header carte) ──────────────────────────
function HeaderBadge({ n }: { n: number }) {
  const size = 56;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={StyleSheet.absoluteFill}>
        <OctagonShape w={size} h={size} bevel={12} fill="transparent" border={DA.cyanPrimary} strokeWidth={1.5} />
      </View>
      <Text style={{ fontSize: 28, fontWeight: '700', color: DA.white }}>{n}</Text>
    </View>
  );
}

// ── Set mini-card (vertical) ─────────────────────────────────────────
type SetVisualState = 'completed' | 'active' | 'future';

function SetMiniCard({
  w, h, index, state, weight, reps, rpe,
}: {
  w: number; h: number; index: number; state: SetVisualState;
  weight: number; reps: number; rpe?: number;
}) {
  const labelColor   = state === 'future' ? DA.textMuted : (state === 'active' ? DA.cyanBright : DA.cyanPrimary);
  const valueColor   = state === 'future' ? DA.textMuted : DA.white;
  const subColor     = state === 'future' ? DA.textMuted : DA.textSecondary;
  const borderColor  = state === 'active' ? DA.borderActive : DA.borderDefault;
  const fill         = state === 'active' ? DA.bgCardElevated : DA.bgCard;
  const strokeWidth  = state === 'active' ? 1.5 : 1;
  const showValues   = state !== 'future';
  const weightStr    = showValues ? String(weight) : '-';
  const repsStr      = showValues ? `× ${reps}` : '× -';
  const rpeStr       = showValues && rpe ? `RPE ${rpe}` : 'RPE -';

  return (
    <PremiumFrame
      width={w} height={h}
      variant={state === 'active' ? 'active' : 'neutral'}
      cornerCut={10} intensity="normal"
      showCornerAccents={false}
      contentPadding={0}
    >
      <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[styles.labelSm, { color: labelColor }]}>SÉRIE {index + 1}</Text>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.valueLg, { color: valueColor }]}>
            {weightStr}
          </Text>
          <Text style={[styles.micro, { color: subColor }]}>KG</Text>
        </View>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={[styles.valueMd, { color: valueColor }]}>{repsStr}</Text>
          <Text style={[styles.micro, { color: subColor }]}>{rpeStr}</Text>
        </View>
        <SetCheck state={state} />
      </View>
    </PremiumFrame>
  );
}

function SetCheck({ state }: { state: SetVisualState }) {
  const size = 22;
  const isCompleted = state === 'completed';
  const isFuture    = state === 'future';
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: isCompleted ? DA.cyanPrimary : 'transparent',
        borderWidth: 1.5,
        borderColor: isFuture ? DA.textMuted : DA.cyanPrimary,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {isCompleted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
    </View>
  );
}

// ── Input poids/reps avec ± ──────────────────────────────────────────
function ValueInput({
  label, value, step = 2.5, onChange,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const [w, setW] = React.useState(0);
  const H = 64;
  const dec = useCallback(() => onChange(Math.max(0, value - step)), [value, step, onChange]);
  const inc = useCallback(() => onChange(value + step),               [value, step, onChange]);

  const displayVal = label === 'REPS' ? String(Math.round(value)) : String(value % 1 === 0 ? value : value.toFixed(1));

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ width: '100%', height: H, position: 'relative' }}
    >
      {w > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <PremiumFrame
            width={w} height={H}
            variant="neutral" cornerCut={14} intensity="subtle"
            showCornerAccents={false} contentPadding={0}
          />
        </View>
      )}
      <View style={{ width: '100%', height: H, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={dec}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 64, height: H, alignItems: 'center', justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="remove" size={22} color={DA.cyanPrimary} />
        </Pressable>
        <View style={{ width: 1, height: H - 22, backgroundColor: DA.borderDefault }} />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
          <Text style={[styles.valueLg, { color: DA.white }]}>{displayVal}</Text>
          <Text style={[styles.micro, { color: DA.textSecondary }]}>{label}</Text>
        </View>
        <View style={{ width: 1, height: H - 22, backgroundColor: DA.borderDefault }} />
        <Pressable
          onPress={inc}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 64, height: H, alignItems: 'center', justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="add" size={22} color={DA.cyanPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

// ── Sélecteur RPE (5 boutons octogonaux 44×44) ───────────────────────
function RPESelector({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={[styles.labelSm, { marginRight: 14 }]}>RPE</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {RPE_OPTIONS.map((v) => {
          const active = value === v;
          return (
            <Pressable
              key={v}
              onPress={() => onChange(v)}
              style={({ pressed }) => ({
                width: 44, height: 44,
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={StyleSheet.absoluteFill}>
                <OctagonShape
                  w={44} h={44} bevel={6}
                  fill={active ? DA.bgCardElevated : 'transparent'}
                  border={active ? DA.borderActive : DA.borderDefault}
                  strokeWidth={active ? 1.5 : 1}
                  glow={active}
                />
              </View>
              <Text style={{
                fontSize: 16, fontWeight: '600',
                color: active ? DA.cyanBright : DA.textSecondary,
              }}>
                {v}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── CTA primary (octogone gradient + chevrons) ───────────────────────
function ValidateButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  const [w, setW] = React.useState(0);
  const H = 64;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={({ pressed }) => ({
        width: '100%', height: H,
        position: 'relative',
        alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.4 : (pressed ? 0.85 : 1),
      })}
    >
      {w > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <PremiumFrame
            width={w} height={H}
            variant="active" cornerCut={14} intensity="strong"
            showCornerAccents={false} contentPadding={0}
          />
        </View>
      )}
      <Text style={{
        fontSize: 16, fontWeight: '700', color: DA.white,
        letterSpacing: 1.2, textTransform: 'uppercase',
      }}>
        VALIDER LA SÉRIE
      </Text>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', right: 18, top: 0, bottom: 0,
          alignItems: 'center', justifyContent: 'center',
          flexDirection: 'row', gap: 2,
        }}
      >
        {[1, 0.7, 0.4].map((op, i) => (
          <Text key={i} style={{ fontSize: 16, fontWeight: '900', color: DA.cyanBright, opacity: op }}>›</Text>
        ))}
      </View>
    </Pressable>
  );
}

// ── CTA outline (+ AJOUTER SÉRIE) ────────────────────────────────────
function AddSetButton({ onPress }: { onPress: () => void }) {
  const [w, setW] = React.useState(0);
  const H = 56;
  return (
    <Pressable
      onPress={onPress}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={({ pressed }) => ({
        width: '100%', height: H,
        position: 'relative',
        alignItems: 'center', justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {w > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <PremiumFrame
            width={w} height={H}
            variant="neutral" cornerCut={14} intensity="subtle"
            showCornerAccents={false} contentPadding={0}
          />
        </View>
      )}
      <Text style={{
        fontSize: 14, fontWeight: '700', color: DA.cyanPrimary,
        letterSpacing: 1, textTransform: 'uppercase',
      }}>
        + AJOUTER SÉRIE
      </Text>
    </Pressable>
  );
}

// ── Composant principal ──────────────────────────────────────────────
export function ExerciseCard({ exercise, lastWorkout, onStartRest, onBack, bottomPad }: ExerciseCardProps) {
  const { updateSet, addSet, completeSet } = useSessionStore();
  const defaultRestTime = useSettingsStore((s) => s.settings.defaultRestTime);
  const muscleLabels    = useMuscleLabels();
  const { width: sw }   = useWindowDimensions();

  const completed = exercise.sets.filter((s) => s.completed).length;
  const total     = exercise.sets.length;
  const activeIdx = exercise.sets.findIndex((s) => !s.completed);
  const activeSet = activeIdx >= 0 ? exercise.sets[activeIdx]! : null;

  // Visible sets (max 4 affichés en grille, scrollable au-delà)
  const visibleSets = exercise.sets.slice(0, 4);
  while (visibleSets.length < 4) {
    visibleSets.push({ weight: 0, reps: 0, setType: 'normal', completed: false });
  }

  // Dimensions
  const padding         = 16;
  const cardPad         = 20;
  const setGap          = 10;
  const setCardW        = Math.floor((sw - padding * 2 - cardPad * 2 - setGap * 3) / 4);
  const setCardH        = 180;

  // Live edits — updateSet sur l'active set
  const setWeight = (v: number) => activeIdx >= 0 && updateSet(exercise.id, activeIdx, { weight: v });
  const setReps   = (v: number) => activeIdx >= 0 && updateSet(exercise.id, activeIdx, { reps: v });
  const setRpe    = (v: number) => activeIdx >= 0 && updateSet(exercise.id, activeIdx, { rpe: v });

  const handleValidate = () => {
    if (activeIdx < 0 || !activeSet) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    completeSet(exercise.id, activeIdx);
    onStartRest(activeSet.restTime ?? defaultRestTime);
  };

  const handleAddSet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    const lastSet = exercise.sets[exercise.sets.length - 1];
    addSet(exercise.id, {
      weight: lastSet?.weight ?? 0,
      reps:   lastSet?.reps ?? 8,
      setType: 'normal',
      restTime: lastSet?.restTime ?? defaultRestTime,
      completed: false,
    });
  };

  const muscles = muscleLabel(exercise.muscleGroups, muscleLabels);
  const category = categoryLabel(exercise.category);

  // Card layout
  return (
    <ImageBackground
      source={DASHBOARD_BG}
      resizeMode="cover"
      style={{ flex: 1, backgroundColor: DA.bgPrimary }}
      imageStyle={{ transform: [{ scale: 1.35 }] }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: padding, paddingTop: 12, paddingBottom: bottomPad + 16, gap: 12 }}
        >
          {/* Top bar : back + label */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <Pressable onPress={onBack} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <View style={{ width: 36, height: 36 }}>
                <OctagonShape w={36} h={36} bevel={8} fill="transparent" border={DA.borderDefault} />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="arrow-back" size={18} color={DA.textSecondary} />
                </View>
              </View>
            </Pressable>
            <Text style={styles.headerLabel}>
              CARTE EXERCICE — {exercise.name.toUpperCase()}
            </Text>
          </View>

          {/* Carte principale */}
          <MainCard
            badgeN={activeIdx >= 0 ? activeIdx + 1 : total}
            name={exercise.name}
            sub={`${category} · ${muscles}`}
            completed={completed}
            total={total}
          >
            {/* Grille 4 séries */}
            <View style={{ flexDirection: 'row', gap: setGap, marginTop: 24 }}>
              {visibleSets.map((s, i) => {
                const state: SetVisualState = i < activeIdx
                  ? 'completed'
                  : i === activeIdx
                    ? 'active'
                    : 'future';
                return (
                  <SetMiniCard
                    key={i}
                    w={setCardW} h={setCardH}
                    index={i} state={state}
                    weight={s.weight} reps={s.reps} rpe={s.rpe}
                  />
                );
              })}
            </View>

            {/* Input poids */}
            <View style={{ marginTop: 24 }}>
              <ValueInput
                label="KG"
                value={activeSet?.weight ?? 0}
                step={2.5}
                onChange={setWeight}
              />
            </View>

            {/* Input reps */}
            <View style={{ marginTop: 10 }}>
              <ValueInput
                label="REPS"
                value={activeSet?.reps ?? 0}
                step={1}
                onChange={setReps}
              />
            </View>

            {/* Sélecteur RPE */}
            <View style={{ marginTop: 18 }}>
              <RPESelector value={activeSet?.rpe} onChange={setRpe} />
            </View>

            {/* CTA VALIDER */}
            <View style={{ marginTop: 28 }}>
              <ValidateButton onPress={handleValidate} disabled={activeIdx < 0} />
            </View>

            {/* CTA + AJOUTER */}
            <View style={{ marginTop: 10 }}>
              <AddSetButton onPress={handleAddSet} />
            </View>
          </MainCard>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

// ── Carte principale (header + slot enfants, wrappée d'un PremiumFrame) ──
function MainCard({
  badgeN, name, sub, completed, total, children,
}: {
  badgeN: number;
  name: string;
  sub: string;
  completed: number;
  total: number;
  children: React.ReactNode;
}) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  return (
    <View
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={{ width: '100%', position: 'relative' }}
    >
      {/* PremiumFrame en background, dimensionné après mesure du contenu */}
      {size.w > 0 && size.h > 0 && (
        <View style={[StyleSheet.absoluteFill]} pointerEvents="none">
          <PremiumFrame
            width={size.w} height={size.h}
            variant="neutral" cornerCut={16} intensity="normal"
            showCornerAccents contentPadding={0}
          />
        </View>
      )}
      <View style={{ padding: 20 }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <HeaderBadge n={badgeN} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.displayLg}>
              {name.toUpperCase()}
            </Text>
            <Text numberOfLines={1} style={[styles.labelSm, { marginTop: 4 }]}>
              {sub}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.displayLg}>
              {completed} <Text style={{ color: DA.textSecondary, fontWeight: '500' }}>/ {total}</Text>
            </Text>
            <Text style={[styles.labelSm, { marginTop: 2 }]}>SÉRIES</Text>
          </View>
        </View>

        {children}
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  headerLabel: {
    fontSize: 11, fontWeight: '600',
    color: DA.textSecondary, letterSpacing: 1.5,
    textTransform: 'uppercase', flex: 1,
  },
  displayLg: {
    fontSize: 28, fontWeight: '700',
    color: DA.white, letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  valueLg: {
    fontSize: 26, fontWeight: '700',
    color: DA.white, letterSpacing: -0.4,
  },
  valueMd: {
    fontSize: 16, fontWeight: '600', color: DA.white,
  },
  labelSm: {
    fontSize: 11, fontWeight: '600',
    color: DA.textSecondary, letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  micro: {
    fontSize: 10, fontWeight: '500',
    color: DA.textSecondary, letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
});
