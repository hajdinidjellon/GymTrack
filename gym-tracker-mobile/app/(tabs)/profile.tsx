import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, Switch, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { RankCard } from '@/components/gamification/RankCard';
import { BadgeGrid } from '@/components/gamification/BadgeGrid';
import { NumericInput } from '@/components/ui/Input';
import { useProfileStore } from '@/stores/profileStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { signOut } from '@/lib/supabase';
import { calculateStreakFromWorkouts } from '@/lib/gamification';
import { calculate1RM } from '@/lib/aiPlanner';
import { colors } from '@/constants/theme';
import type { PersonalRecord, UserProfile } from '@/types';

type Section = 'stats' | 'badges' | 'settings';
type Level = UserProfile['experienceLevel'];

const LEVELS: Array<{ id: Level; label: string; years: string }> = [
  { id: 'beginner',     label: 'Débutant',      years: '< 1 an'   },
  { id: 'intermediate', label: 'Intermédiaire',  years: '1-3 ans'  },
  { id: 'advanced',     label: 'Avancé',         years: '3-5 ans'  },
  { id: 'elite',        label: 'Élite',          years: '5 ans+'   },
];

const PR_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Développé couché':    'barbell-outline',
  'Squat':               'body-outline',
  'Soulevé de terre':    'arrow-up-outline',
  'Développé militaire': 'fitness-outline',
};
const PR_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b'];

// ── Composants utilitaires ───────────────────────────────────────

function SectionTab({ id, label, active, onPress }: { id: Section; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, borderRadius: 10, overflow: 'hidden' }}>
      {active ? (
        <LinearGradient colors={['#7c3aed', '#06b6d4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 11, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={{ paddingVertical: 11, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.40)' }}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

function SettingRow({ icon, label, children }: { icon: keyof typeof Ionicons.glyphMap; label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 14 }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(124,58,237,0.12)', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color="#a78bfa" />
      </View>
      <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: colors.text.primary }}>{label}</Text>
      {children}
    </View>
  );
}

// ── Écran principal ──────────────────────────────────────────────

export default function ProfileScreen() {
  const { profile, updateProfile, getTotalXP, getCurrentRank } = useProfileStore();
  const { workouts } = useWorkoutStore();
  const { settings, updateSettings } = useSettingsStore();

  const [activeSection, setActiveSection] = useState<Section>('stats');
  const [editingName, setEditingName]     = useState(false);
  const [nameInput, setNameInput]         = useState(profile?.name ?? '');
  const [editingPRIndex, setEditingPRIndex] = useState<number | null>(null);
  const [editingLevel, setEditingLevel]   = useState(false);
  const [editingFreq, setEditingFreq]     = useState(false);

  // État local pour édition PR
  const [prEdit, setPrEdit] = useState<{ weight: number; reps: number }>({ weight: 0, reps: 1 });

  const totalXP = getTotalXP();
  const rank    = getCurrentRank();
  const streak  = calculateStreakFromWorkouts(workouts);

  const gamificationData = { workouts, profile: profile ?? null, totalXP, streak };

  const handleLogout = () => {
    Alert.alert('Se déconnecter', 'Tes données locales seront conservées.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login'); } },
    ]);
  };

  const saveName = async () => {
    if (nameInput.trim().length < 2) return;
    await updateProfile({ name: nameInput.trim() });
    setEditingName(false);
  };

  const startEditPR = (index: number) => {
    const pr = profile?.prs[index];
    if (!pr) return;
    setPrEdit({ weight: pr.weight, reps: pr.reps });
    setEditingPRIndex(index);
  };

  const savePR = async () => {
    if (editingPRIndex === null || !profile) return;
    const updatedPRs = profile.prs.map((pr, i) =>
      i === editingPRIndex
        ? { ...pr, weight: prEdit.weight, reps: prEdit.reps, oneRepMax: calculate1RM(prEdit.weight, prEdit.reps) }
        : pr,
    );
    await updateProfile({ prs: updatedPRs });
    setEditingPRIndex(null);
  };

  const SECTIONS: Array<{ id: Section; label: string }> = [
    { id: 'stats',    label: 'Profil' },
    { id: 'badges',   label: 'Badges' },
    { id: 'settings', label: 'Réglages' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080810' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 20 }}>
          {/* Avatar + Nom */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <LinearGradient
              colors={rank ? [rank.color, rank.color + '88'] : ['#7c3aed', '#06b6d4']}
              style={{ width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: rank?.color ?? '#7c3aed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
            >
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff' }}>
                {(profile?.name?.[0] ?? 'A').toUpperCase()}
              </Text>
            </LinearGradient>

            <View style={{ flex: 1, gap: 4 }}>
              {editingName ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    style={{ flex: 1, fontSize: 20, fontWeight: '800', color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#7c3aed' }}
                    value={nameInput}
                    onChangeText={setNameInput}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={saveName}
                  />
                  <Pressable onPress={saveName} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => { setNameInput(profile?.name ?? ''); setEditingName(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff' }}>
                    {profile?.name || 'Athlète'}
                  </Text>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 4 }}>
                    <Ionicons name="pencil-outline" size={14} color="rgba(255,255,255,0.45)" />
                  </View>
                </Pressable>
              )}
              {rank && (
                <Text style={{ fontSize: 13, color: rank.color, fontWeight: '600' }}>{rank.name}</Text>
              )}
            </View>
          </View>

          {/* Rank card */}
          {rank && <RankCard rank={rank} totalXP={totalXP} compact />}
        </View>

        {/* ── Tabs ── */}
        <View style={{ flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          {SECTIONS.map((s) => <SectionTab key={s.id} id={s.id} label={s.label} active={activeSection === s.id} onPress={() => setActiveSection(s.id)} />)}
        </View>

        {/* ══════════════════════════════════════
            PROFIL (stats)
        ══════════════════════════════════════ */}
        {activeSection === 'stats' && (
          <View style={{ paddingHorizontal: 20, gap: 24 }}>

            {/* Stats rapides */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { value: workouts.length, label: 'Séances',  color: '#06b6d4' },
                { value: streak,          label: 'Streak',   color: '#f59e0b' },
                { value: totalXP,         label: 'XP total', color: '#7c3aed' },
              ].map(({ value, label, color }) => (
                <View key={label} style={{ flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                  <LinearGradient colors={[`${color}18`, `${color}06`]} style={{ padding: 14, alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 28, fontWeight: '900', color }}>
                      {value > 999 ? (value as number).toLocaleString('fr-FR') : value}
                    </Text>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: '600' }}>{label}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>

            {/* ── Records personnels ── */}
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.30)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                Records personnels
              </Text>

              {profile?.prs && profile.prs.length > 0 ? (
                profile.prs.map((pr, i) => {
                  const isEditing = editingPRIndex === i;
                  const color     = PR_COLORS[i % PR_COLORS.length] ?? '#7c3aed';
                  const icon      = PR_ICONS[pr.exercise] ?? 'barbell-outline';

                  return (
                    <View
                      key={`${pr.exercise}-${i}`}
                      style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: isEditing ? '#7c3aed' : 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}
                    >
                      {/* Accent top */}
                      <LinearGradient colors={[color, color + '55']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2 }} />

                      <View style={{ padding: 16, gap: 12 }}>
                        {/* Titre + bouton éditer */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name={icon} size={20} color={color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{pr.exercise}</Text>
                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                              1RM estimé · <Text style={{ color, fontWeight: '700' }}>{pr.oneRepMax.toFixed(1)} kg</Text>
                            </Text>
                          </View>
                          {isEditing ? (
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <Pressable onPress={() => setEditingPRIndex(null)} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="close" size={16} color="rgba(255,255,255,0.50)" />
                              </Pressable>
                              <Pressable onPress={savePR} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="checkmark" size={16} color="#fff" />
                              </Pressable>
                            </View>
                          ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff' }}>
                                {pr.weight}kg
                                <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.40)' }}> × {pr.reps}</Text>
                              </Text>
                              <Pressable onPress={() => startEditPR(i)} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="pencil-outline" size={14} color="rgba(255,255,255,0.45)" />
                              </Pressable>
                            </View>
                          )}
                        </View>

                        {/* Mode édition inline */}
                        {isEditing && (
                          <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1, gap: 6 }}>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Poids</Text>
                              <NumericInput value={prEdit.weight} onChange={(v) => setPrEdit((p) => ({ ...p, weight: v }))} min={0} max={500} step={2.5} suffix="kg" />
                            </View>
                            <View style={{ flex: 1, gap: 6 }}>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Reps</Text>
                              <NumericInput value={prEdit.reps} onChange={(v) => setPrEdit((p) => ({ ...p, reps: v }))} min={1} max={30} step={1} />
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
                  <Ionicons name="trophy-outline" size={28} color="rgba(255,255,255,0.25)" />
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)', textAlign: 'center' }}>
                    Aucun PR enregistré.{'\n'}Fais une séance pour en ajouter.
                  </Text>
                </View>
              )}
            </View>

            {/* ── Informations du profil ── */}
            {profile && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.30)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                  Mon profil
                </Text>

                <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 4, gap: 0 }}>

                  {/* Niveau */}
                  <View style={{ padding: 14, gap: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary }}>Niveau</Text>
                      <Pressable onPress={() => setEditingLevel((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 14, color: '#a78bfa', fontWeight: '600' }}>
                          {LEVELS.find((l) => l.id === profile.experienceLevel)?.label ?? profile.experienceLevel}
                        </Text>
                        <Ionicons name={editingLevel ? 'chevron-up' : 'pencil-outline'} size={14} color="rgba(255,255,255,0.35)" />
                      </Pressable>
                    </View>
                    {editingLevel && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {LEVELS.map((l) => (
                          <Pressable
                            key={l.id}
                            onPress={() => { updateProfile({ experienceLevel: l.id }); setEditingLevel(false); }}
                            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: profile.experienceLevel === l.id ? '#7c3aed' : 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: profile.experienceLevel === l.id ? '#7c3aed' : 'rgba(255,255,255,0.10)' }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: '700', color: profile.experienceLevel === l.id ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                              {l.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 14 }} />

                  {/* Fréquence */}
                  <View style={{ padding: 14, gap: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary }}>Séances / semaine</Text>
                      <Pressable onPress={() => setEditingFreq((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 14, color: '#a78bfa', fontWeight: '600' }}>{profile.trainingFrequency}×</Text>
                        <Ionicons name={editingFreq ? 'chevron-up' : 'pencil-outline'} size={14} color="rgba(255,255,255,0.35)" />
                      </Pressable>
                    </View>
                    {editingFreq && (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {[2, 3, 4, 5, 6].map((f) => (
                          <Pressable
                            key={f}
                            onPress={() => { updateProfile({ trainingFrequency: f }); setEditingFreq(false); }}
                            style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: profile.trainingFrequency === f ? '#7c3aed' : 'rgba(255,255,255,0.07)', alignItems: 'center', borderWidth: 1, borderColor: profile.trainingFrequency === f ? '#7c3aed' : 'rgba(255,255,255,0.10)' }}
                          >
                            <Text style={{ fontSize: 16, fontWeight: '800', color: profile.trainingFrequency === f ? '#fff' : 'rgba(255,255,255,0.50)' }}>{f}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ══════════════════════════════════════
            BADGES
        ══════════════════════════════════════ */}
        {activeSection === 'badges' && (
          <View style={{ paddingHorizontal: 20 }}>
            <BadgeGrid gamificationData={gamificationData} showLocked />
          </View>
        )}

        {/* ══════════════════════════════════════
            RÉGLAGES
        ══════════════════════════════════════ */}
        {activeSection === 'settings' && (
          <View style={{ paddingHorizontal: 20, gap: 20 }}>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16 }}>

              <SettingRow icon="speedometer-outline" label="Unités de poids">
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['kg', 'lbs'] as const).map((u) => (
                    <Pressable
                      key={u}
                      onPress={() => updateSettings({ units: u })}
                      style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: settings.units === u ? '#7c3aed' : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: settings.units === u ? '#7c3aed' : 'rgba(255,255,255,0.10)' }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: settings.units === u ? '#fff' : 'rgba(255,255,255,0.50)' }}>{u}</Text>
                    </Pressable>
                  ))}
                </View>
              </SettingRow>

              <SettingRow icon="timer-outline" label="Timer de repos">
                <Switch value={settings.restTimerEnabled} onValueChange={(v) => updateSettings({ restTimerEnabled: v })} trackColor={{ true: '#7c3aed', false: 'rgba(255,255,255,0.15)' }} thumbColor="#fff" />
              </SettingRow>

              <SettingRow icon="time-outline" label="Repos par défaut">
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {([60, 90, 120, 180] as const).map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => updateSettings({ defaultRestTime: t })}
                      style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: settings.defaultRestTime === t ? '#7c3aed' : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: settings.defaultRestTime === t ? '#7c3aed' : 'rgba(255,255,255,0.10)' }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: settings.defaultRestTime === t ? '#fff' : 'rgba(255,255,255,0.50)' }}>{t}s</Text>
                    </Pressable>
                  ))}
                </View>
              </SettingRow>

              <SettingRow icon="notifications-outline" label="Notifications">
                <Switch value={settings.notifications} onValueChange={(v) => updateSettings({ notifications: v })} trackColor={{ true: '#7c3aed', false: 'rgba(255,255,255,0.15)' }} thumbColor="#fff" />
              </SettingRow>

              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(124,58,237,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="language-outline" size={18} color="#a78bfa" />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: colors.text.primary }}>Langue</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['fr', 'en'] as const).map((l) => (
                    <Pressable
                      key={l}
                      onPress={() => updateSettings({ language: l })}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: settings.language === l ? '#7c3aed' : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: settings.language === l ? '#7c3aed' : 'rgba(255,255,255,0.10)' }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: settings.language === l ? '#fff' : 'rgba(255,255,255,0.50)' }}>{l.toUpperCase()}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Déconnexion */}
            <Pressable
              onPress={handleLogout}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.22)' }}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#ef4444' }}>Se déconnecter</Text>
            </Pressable>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
