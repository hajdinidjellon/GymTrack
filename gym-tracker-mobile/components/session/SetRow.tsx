import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { WorkoutSet, SetType } from '@/types';
import { calculate1RM } from '@/lib/aiPlanner';

interface SetRowProps {
  setIndex: number;
  set: WorkoutSet;
  previousSet?: WorkoutSet;
  onUpdate: (patch: Partial<WorkoutSet>) => void;
  onComplete: () => void;
  onDelete: () => void;
  isCompleted: boolean;
  units: 'kg' | 'lbs';
}

const SET_TYPE_COLORS: Record<SetType, string> = {
  warmup: '#3b82f6', normal: 'rgba(248,250,252,0.4)', top: '#f59e0b',
  backoff: '#06b6d4', amrap: '#10b981', drop: '#ec4899', failure: '#ef4444',
};
const SET_TYPE_LABELS: Record<SetType, string> = {
  warmup: 'W', normal: '', top: 'TOP', backoff: 'BK', amrap: 'AMRAP', drop: 'DROP', failure: 'FAIL',
};
const SET_TYPES: SetType[] = ['warmup', 'normal', 'top', 'backoff', 'amrap', 'drop', 'failure'];

// ── Stepper compact intégré ──────────────────────────────────────
function Stepper({
  value, onChange, step = 1, min = 0, max = 999, label,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  label: string;
}) {
  const clamp = (v: number) => Math.min(Math.max(v, min), max);
  const display = Number.isInteger(value) ? String(value) : value.toFixed(1);

  return (
    <View style={{ alignItems: 'center', gap: 6, flex: 1 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text.muted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
        <Pressable
          onPress={() => onChange(clamp(value - step))}
          style={{ paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text.secondary, lineHeight: 22 }}>−</Text>
        </Pressable>

        <TextInput
          style={{
            fontSize: 26, fontWeight: '900', color: colors.text.primary,
            textAlign: 'center', minWidth: 52, paddingHorizontal: 4,
          }}
          value={display}
          onChangeText={(t) => {
            const n = parseFloat(t.replace(',', '.'));
            if (!isNaN(n)) onChange(clamp(n));
          }}
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Pressable
          onPress={() => onChange(clamp(value + step))}
          style={{ paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text.secondary, lineHeight: 22 }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── SetRow ───────────────────────────────────────────────────────

export function SetRow({ setIndex, set, previousSet, onUpdate, onComplete, onDelete, isCompleted, units }: SetRowProps) {
  const [showTypePicker, setShowTypePicker] = React.useState(false);

  const hasPrev       = !!previousSet;
  const currentScore  = calculate1RM(set.weight, set.reps);
  const previousScore = hasPrev ? calculate1RM(previousSet.weight, previousSet.reps) : 0;
  const isImproved    = hasPrev && currentScore > previousScore + 0.5;
  const isEqual       = hasPrev && Math.abs(currentScore - previousScore) <= 0.5;
  const delta         = currentScore - previousScore;

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', opacity: isCompleted ? 0.75 : 1 }}>
      <LinearGradient
        colors={isCompleted
          ? ['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.05)']
          : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
        style={{ borderWidth: 1, borderColor: isCompleted ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 12, gap: 10 }}
      >

        {/* ── Ligne 1 : numéro · référence · supprimer ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Badge type/numéro */}
          <Pressable onPress={() => setShowTypePicker((v) => !v)}>
            <View style={{
              width: 26, height: 26, borderRadius: 8,
              backgroundColor: isCompleted ? 'rgba(16,185,129,0.25)' : `${SET_TYPE_COLORS[set.setType]}22`,
              borderWidth: 1, borderColor: isCompleted ? 'rgba(16,185,129,0.5)' : `${SET_TYPE_COLORS[set.setType]}55`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: isCompleted ? colors.status.success : SET_TYPE_COLORS[set.setType] }}>
                {isCompleted ? '✓' : SET_TYPE_LABELS[set.setType] || String(setIndex + 1)}
              </Text>
            </View>
          </Pressable>

          {/* Référence précédente */}
          <View style={{ flex: 1 }}>
            {hasPrev ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 12, color: colors.text.muted }}>
                  Avant · <Text style={{ fontWeight: '600' }}>{previousSet.weight}{units} × {previousSet.reps}</Text>
                </Text>
                {!isEqual && (
                  <View style={{
                    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                    backgroundColor: isImproved ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isImproved ? colors.status.success : colors.status.danger }}>
                      {isImproved ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}kg 1RM
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={{ fontSize: 12, color: colors.text.muted }}>Première fois</Text>
            )}
          </View>

          {/* Supprimer */}
          {!isCompleted && (
            <Pressable
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.10)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="trash-outline" size={13} color={colors.status.danger} />
            </Pressable>
          )}
        </View>

        {/* ── Ligne 2 : [Poids] × [Reps] [✓] ── */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          {/* Poids */}
          <Stepper
            value={set.weight}
            onChange={(v) => onUpdate({ weight: v })}
            step={2.5} min={0} max={500}
            label={`Poids (${units})`}
          />

          {/* Séparateur */}
          <Text style={{ fontSize: 22, fontWeight: '900', color: 'rgba(255,255,255,0.18)', paddingBottom: 11 }}>×</Text>

          {/* Reps */}
          <Stepper
            value={set.reps}
            onChange={(v) => onUpdate({ reps: v })}
            step={1} min={1} max={100}
            label="Reps"
          />

          {/* Bouton valider */}
          <View style={{ paddingBottom: 0 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: 'transparent', letterSpacing: 1.5, marginBottom: 6 }}>
              {' '}
            </Text>
            <Pressable onPress={onComplete} style={{ borderRadius: 14, overflow: 'hidden' }}>
              {isCompleted ? (
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={{ width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="checkmark" size={24} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={{
                  width: 52, height: 52, borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  borderWidth: 2, borderColor: 'rgba(255,255,255,0.13)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="ellipse-outline" size={20} color="rgba(255,255,255,0.28)" />
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* ── RPE ── */}
        {!isCompleted && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 11, color: colors.text.muted, fontWeight: '700', letterSpacing: 0.5 }}>RPE</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[6, 7, 8, 9, 10].map((rpe) => (
                <Pressable
                  key={rpe}
                  onPress={() => onUpdate({ rpe })}
                  style={{
                    width: 32, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: set.rpe === rpe ? '#7c3aed' : 'rgba(255,255,255,0.06)',
                    borderWidth: 1, borderColor: set.rpe === rpe ? '#7c3aed' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: set.rpe === rpe ? '#fff' : colors.text.muted }}>
                    {rpe}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Type picker ── */}
        {showTypePicker && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {SET_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => { onUpdate({ setType: type }); setShowTypePicker(false); }}
                style={{
                  paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                  backgroundColor: set.setType === type ? `${SET_TYPE_COLORS[type]}30` : 'rgba(255,255,255,0.06)',
                  borderWidth: 1, borderColor: set.setType === type ? SET_TYPE_COLORS[type] : 'rgba(255,255,255,0.08)',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: set.setType === type ? SET_TYPE_COLORS[type] : colors.text.muted }}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

      </LinearGradient>
    </View>
  );
}
