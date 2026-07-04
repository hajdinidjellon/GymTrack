import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, Switch, TextInput,
  Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomNavPadding } from '@/hooks/useBottomNavPadding';
import { router } from 'expo-router';
import { useT } from '@/lib/i18n';
import { BadgeGrid } from '@/components/gamification/BadgeGrid';
import { RankLadder } from '@/components/gamification/RankLadder';
import { BadgeImage } from '@/components/ui/BadgeImage';
import { NumericInput } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScreenBackground, BG_COLORS } from '@/components/ui/ScreenBackground';
import { useProfileStore } from '@/stores/profileStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { signOut } from '@/lib/supabase';
import { calculateStreakFromWorkouts, getProgressToNextRank, getNextRank } from '@/lib/gamification';
import { calculate1RM } from '@/lib/aiPlanner';
import {
  requestPermissions, refreshAllNotifications, cancelAllTrainingReminders,
  notifyBadgeUnlocked,
} from '@/lib/notifications';
import { getRankGradient } from '@/constants/theme';
import type { Rank, RankTier, UserProfile } from '@/types';

// ── Badge image inlined (extrait de RankCard pour le hero) ────

type Section = 'stats' | 'badges' | 'settings';
type Level = UserProfile['experienceLevel'];


const PR_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Développé couché':    'barbell',
  'Squat':               'body',
  'Soulevé de terre':    'arrow-up',
  'Développé militaire': 'fitness',
};

// ── SectionTab ─────────────────────────────────────────────────
function SectionTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1, borderRadius: 10,
        backgroundColor: active ? BG_COLORS.accent : 'transparent',
        paddingVertical: 11, alignItems: 'center',
      }}
    >
      <Text style={{
        fontSize: 12, fontWeight: '900',
        color: active ? '#07090f' : 'rgba(255,255,255,0.45)',
        letterSpacing: 0.5, textTransform: 'uppercase',
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── SettingRow ─────────────────────────────────────────────────
function SettingRow({ icon, label, children, last = false }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 14, gap: 14,
      borderBottomWidth: last ? 0 : 1,
      borderColor: 'rgba(255,255,255,0.06)',
    }}>
      <View style={{
        width: 38, height: 38, borderRadius: 11,
        backgroundColor: 'rgba(56,189,248,0.14)',
        borderWidth: 1, borderColor: 'rgba(56,189,248,0.28)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={17} color={BG_COLORS.accent} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.1 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

// ── Écran principal ────────────────────────────────────────────
export default function ProfileScreen() {
  const bottomPad = useBottomNavPadding();
  const { profile, updateProfile, getTotalXP, getCurrentRank } = useProfileStore();
  const { workouts } = useWorkoutStore();
  const { settings, updateSettings } = useSettingsStore();
  const t = useT();

  const LEVELS: Array<{ id: Level; label: string; years: string }> = [
    { id: 'beginner',     label: t('level.beginner'),     years: t('level.beginner.years')     },
    { id: 'intermediate', label: t('level.intermediate'), years: t('level.intermediate.years') },
    { id: 'advanced',     label: t('level.advanced'),     years: t('level.advanced.years')     },
    { id: 'elite',        label: t('level.elite'),        years: t('level.elite.years')        },
  ];

  const [activeSection, setActiveSection]   = useState<Section>('stats');
  const [editingName, setEditingName]       = useState(false);
  const [nameInput, setNameInput]           = useState(profile?.name ?? '');
  const [editingPRIndex, setEditingPRIndex] = useState<number | null>(null);
  const [editingLevel, setEditingLevel]     = useState(false);
  const [editingFreq, setEditingFreq]       = useState(false);
  const [prEdit, setPrEdit]                 = useState<{ weight: number; reps: number }>({ weight: 0, reps: 1 });

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const totalXP = getTotalXP();
  const rank    = getCurrentRank();
  const streak  = calculateStreakFromWorkouts(workouts);
  const gamificationData = { workouts, profile: profile ?? null, totalXP, streak };

  const handleLogout = () => {
    Alert.alert(t('profile.logoutTitle'), t('profile.logoutMsg'), [
      { text: t('profile.logoutCancel'), style: 'cancel' },
      { text: t('profile.logoutConfirm'), style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/welcome'); } },
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
    { id: 'stats',    label: t('profile.tab.stats')     },
    { id: 'badges',   label: t('profile.tab.badges')    },
    { id: 'settings', label: t('profile.tab.settings')  },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: BG_COLORS.base }}>
      <ScreenBackground variant="profile" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: bottomPad }}
            showsVerticalScrollIndicator={false}
          >
            {/* ── HERO HEADER unifié ── */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: BG_COLORS.accent, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>
                {t('profile.supertitle')}
              </Text>

              {rank ? (
                <ProfileHero
                  name={profile?.name ?? 'Athlète'}
                  initial={(profile?.name?.[0] ?? 'A').toUpperCase()}
                  rank={rank}
                  totalXP={totalXP}
                  editingName={editingName}
                  nameInput={nameInput}
                  onNameInputChange={setNameInput}
                  onStartEditName={() => { setNameInput(profile?.name ?? ''); setEditingName(true); }}
                  onSaveName={saveName}
                />
              ) : (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 16,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                  padding: 18,
                }}>
                  <LinearGradient
                    colors={[BG_COLORS.accent, '#0ea5e9']}
                    style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff' }}>
                      {(profile?.name?.[0] ?? 'A').toUpperCase()}
                    </Text>
                  </LinearGradient>
                  <Pressable
                    onPress={() => { setNameInput(profile?.name ?? ''); setEditingName(true); }}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  >
                    <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.8 }}>
                      {profile?.name || 'Athlète'}
                    </Text>
                    <Ionicons name="pencil-outline" size={14} color="rgba(255,255,255,0.45)" />
                  </Pressable>
                </View>
              )}
            </View>

            {/* ── TABS ── */}
            <View style={{
              flexDirection: 'row', marginHorizontal: 20,
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 14, padding: 4, marginBottom: 20,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
            }}>
              {SECTIONS.map((s) => (
                <SectionTab key={s.id} label={s.label} active={activeSection === s.id} onPress={() => setActiveSection(s.id)} />
              ))}
            </View>

            {/* ── PROFIL stats ── */}
            {activeSection === 'stats' && (
              <View style={{ paddingHorizontal: 20, gap: 22 }}>
                {/* Stats KPI */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {[
                    { value: workouts.length, label: t('unit.sessions'),  color: BG_COLORS.accent, icon: 'trophy' as const },
                    { value: streak,          label: t('dashboard.streak'),   color: '#fb923c',         icon: 'flame'  as const },
                    { value: totalXP,         label: t('rank.xpTotal'), color: '#a78bfa',         icon: 'star'   as const },
                  ].map(({ value, label, color, icon }) => (
                    <View key={label} style={{
                      flex: 1,
                      backgroundColor: `${color}10`,
                      borderRadius: 16, borderWidth: 1,
                      borderColor: `${color}28`,
                      padding: 14, gap: 6,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name={icon} size={13} color={color} />
                        <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                          {label}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 24, fontWeight: '900', color, letterSpacing: -0.8 }}>
                        {value > 999 ? (value as number).toLocaleString('fr-FR') : value}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* ── Échelle des rangs ── */}
                {rank && <RankLadder currentRank={rank} />}

                {/* ── Records personnels ── */}
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                    {t('profile.personalRecords')}
                  </Text>

                  {profile?.prs && profile.prs.length > 0 ? (
                    profile.prs.map((pr, i) => {
                      const isEditing = editingPRIndex === i;
                      const icon      = PR_ICONS[pr.exercise] ?? 'barbell';

                      return (
                        <View
                          key={`${pr.exercise}-${i}`}
                          style={{
                            borderRadius: 18, overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: isEditing ? BG_COLORS.accent : 'rgba(255,255,255,0.08)',
                            backgroundColor: isEditing ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.04)',
                          }}
                        >
                          <View style={{ padding: 16, gap: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <View style={{
                                width: 42, height: 42, borderRadius: 13,
                                backgroundColor: 'rgba(251,191,36,0.16)',
                                borderWidth: 1, borderColor: 'rgba(251,191,36,0.32)',
                                alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Ionicons name={icon} size={19} color="#fbbf24" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 }}>
                                  {pr.exercise}
                                </Text>
                                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontWeight: '600' }}>
                                  {t('profile.estimatedRM')} · <Text style={{ color: '#fbbf24', fontWeight: '800' }}>{pr.oneRepMax.toFixed(1)} kg</Text>
                                </Text>
                              </View>

                              {isEditing ? (
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                  <Pressable
                                    onPress={() => setEditingPRIndex(null)}
                                    style={{
                                      width: 34, height: 34, borderRadius: 10,
                                      backgroundColor: 'rgba(255,255,255,0.08)',
                                      alignItems: 'center', justifyContent: 'center',
                                    }}
                                  >
                                    <Ionicons name="close" size={16} color="rgba(255,255,255,0.50)" />
                                  </Pressable>
                                  <Pressable
                                    onPress={savePR}
                                    style={{
                                      width: 34, height: 34, borderRadius: 10,
                                      backgroundColor: BG_COLORS.accent,
                                      alignItems: 'center', justifyContent: 'center',
                                    }}
                                  >
                                    <Ionicons name="checkmark" size={16} color="#07090f" />
                                  </Pressable>
                                </View>
                              ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                  <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
                                    {pr.weight}<Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)' }}>kg</Text>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.45)' }}> ×{pr.reps}</Text>
                                  </Text>
                                  <Pressable
                                    onPress={() => startEditPR(i)}
                                    style={{
                                      width: 32, height: 32, borderRadius: 10,
                                      backgroundColor: 'rgba(255,255,255,0.06)',
                                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                                      alignItems: 'center', justifyContent: 'center',
                                    }}
                                  >
                                    <Ionicons name="pencil-outline" size={13} color="rgba(255,255,255,0.55)" />
                                  </Pressable>
                                </View>
                              )}
                            </View>

                            {isEditing && (
                              <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1, gap: 6 }}>
                                  <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                                    Poids
                                  </Text>
                                  <NumericInput value={prEdit.weight} onChange={(v) => setPrEdit((p) => ({ ...p, weight: v }))} min={0} max={500} step={2.5} suffix="kg" />
                                </View>
                                <View style={{ flex: 1, gap: 6 }}>
                                  <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                                    Reps
                                  </Text>
                                  <NumericInput value={prEdit.reps} onChange={(v) => setPrEdit((p) => ({ ...p, reps: v }))} min={1} max={30} step={1} />
                                </View>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderRadius: 18, padding: 22, alignItems: 'center', gap: 10,
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
                    }}>
                      <View style={{
                        width: 52, height: 52, borderRadius: 16,
                        backgroundColor: 'rgba(251,191,36,0.14)',
                        borderWidth: 1, borderColor: 'rgba(251,191,36,0.28)',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Ionicons name="trophy-outline" size={26} color="#fbbf24" />
                      </View>
                      <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', textAlign: 'center', fontWeight: '600', lineHeight: 20 }}>
                        {t('profile.noPRs')}
                      </Text>
                    </View>
                  )}
                </View>

                {/* ── Infos profil ── */}
                {profile && (
                  <View style={{ gap: 12 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                      {t('profile.config')}
                    </Text>

                    <View style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderRadius: 18, borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.08)',
                      paddingHorizontal: 14,
                    }}>
                      {/* Niveau */}
                      <View style={{ paddingVertical: 14, gap: 10, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.1 }}>
                            {t('profile.level')}
                          </Text>
                          <Pressable
                            onPress={() => setEditingLevel((v) => !v)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                            hitSlop={8}
                          >
                            <Text style={{ fontSize: 14, color: BG_COLORS.accent, fontWeight: '800' }}>
                              {LEVELS.find((l) => l.id === profile.experienceLevel)?.label ?? profile.experienceLevel}
                            </Text>
                            <Ionicons name={editingLevel ? 'chevron-up' : 'pencil-outline'} size={13} color="rgba(255,255,255,0.45)" />
                          </Pressable>
                        </View>
                        {editingLevel && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {LEVELS.map((l) => {
                              const isSel = profile.experienceLevel === l.id;
                              return (
                                <Pressable
                                  key={l.id}
                                  onPress={() => { updateProfile({ experienceLevel: l.id }); setEditingLevel(false); }}
                                  style={{
                                    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
                                    backgroundColor: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.05)',
                                    borderWidth: 1.5,
                                    borderColor: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.10)',
                                  }}
                                >
                                  <Text style={{
                                    fontSize: 13, fontWeight: '900',
                                    color: isSel ? '#07090f' : 'rgba(255,255,255,0.60)',
                                  }}>
                                    {l.label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        )}
                      </View>

                      {/* Fréquence */}
                      <View style={{ paddingVertical: 14, gap: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.1 }}>
                            {t('profile.sessionsPerWeek')}
                          </Text>
                          <Pressable
                            onPress={() => setEditingFreq((v) => !v)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                            hitSlop={8}
                          >
                            <Text style={{ fontSize: 14, color: BG_COLORS.accent, fontWeight: '800' }}>
                              {profile.trainingFrequency}×
                            </Text>
                            <Ionicons name={editingFreq ? 'chevron-up' : 'pencil-outline'} size={13} color="rgba(255,255,255,0.45)" />
                          </Pressable>
                        </View>
                        {editingFreq && (
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            {[2, 3, 4, 5, 6].map((f) => {
                              const isSel = profile.trainingFrequency === f;
                              return (
                                <Pressable
                                  key={f}
                                  onPress={() => { updateProfile({ trainingFrequency: f }); setEditingFreq(false); }}
                                  style={{
                                    flex: 1, paddingVertical: 11, borderRadius: 12,
                                    alignItems: 'center',
                                    backgroundColor: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.05)',
                                    borderWidth: 1.5,
                                    borderColor: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.10)',
                                  }}
                                >
                                  <Text style={{
                                    fontSize: 16, fontWeight: '900',
                                    color: isSel ? '#07090f' : 'rgba(255,255,255,0.55)',
                                  }}>
                                    {f}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ── BADGES ── */}
            {activeSection === 'badges' && (
              <View style={{ paddingHorizontal: 20 }}>
                <BadgeGrid gamificationData={gamificationData} showLocked />
              </View>
            )}

            {/* ── RÉGLAGES ── */}
            {activeSection === 'settings' && (
              <View style={{ paddingHorizontal: 20, gap: 18 }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 20, borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  paddingHorizontal: 16,
                }}>
                  <SettingRow icon="speedometer-outline" label={t('settings.units')}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {(['kg', 'lbs'] as const).map((u) => {
                        const isSel = settings.units === u;
                        return (
                          <Pressable
                            key={u}
                            onPress={() => updateSettings({ units: u })}
                            style={{
                              paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
                              backgroundColor: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.06)',
                              borderWidth: 1.5,
                              borderColor: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.10)',
                            }}
                          >
                            <Text style={{
                              fontSize: 13, fontWeight: '900',
                              color: isSel ? '#07090f' : 'rgba(255,255,255,0.55)',
                              letterSpacing: 0.3,
                            }}>
                              {u.toUpperCase()}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </SettingRow>

                  <SettingRow icon="timer-outline" label={t('settings.restTimer')}>
                    <Switch
                      value={settings.restTimerEnabled}
                      onValueChange={(v) => updateSettings({ restTimerEnabled: v })}
                      trackColor={{ true: BG_COLORS.accent, false: 'rgba(255,255,255,0.15)' }}
                      thumbColor="#fff"
                    />
                  </SettingRow>

                  <SettingRow icon="time-outline" label={t('settings.defaultRest')}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {([5, 60, 90, 120] as const).map((t) => {
                        const isSel = settings.defaultRestTime === t;
                        return (
                          <Pressable
                            key={t}
                            onPress={() => updateSettings({ defaultRestTime: t })}
                            style={{
                              paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
                              backgroundColor: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.06)',
                              borderWidth: 1.5,
                              borderColor: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.10)',
                            }}
                          >
                            <Text style={{
                              fontSize: 12, fontWeight: '900',
                              color: isSel ? '#07090f' : 'rgba(255,255,255,0.55)',
                            }}>
                              {t}s
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </SettingRow>

                  <SettingRow icon="notifications-outline" label={t('settings.notifications')}>
                    <Switch
                      value={settings.notifications}
                      onValueChange={async (v) => {
                        updateSettings({ notifications: v });
                        if (v) {
                          const granted = await requestPermissions();
                          if (granted && profile) {
                            const streak = calculateStreakFromWorkouts(workouts);
                            const last   = workouts[0]?.date;
                            await refreshAllNotifications(profile.onboarding, streak, last);
                          }
                        } else {
                          await cancelAllTrainingReminders();
                        }
                      }}
                      trackColor={{ true: BG_COLORS.accent, false: 'rgba(255,255,255,0.15)' }}
                      thumbColor="#fff"
                    />
                  </SettingRow>

                  <SettingRow icon="notifications-circle-outline" label={t('settings.testNotif')}>
                    <Pressable
                      onPress={() => notifyBadgeUnlocked('Test notification 🧪')}
                      style={({ pressed }) => ({
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                        backgroundColor: pressed ? 'rgba(56,189,248,0.25)' : 'rgba(56,189,248,0.12)',
                        borderWidth: 1.5, borderColor: BG_COLORS.accent,
                      })}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '900', color: BG_COLORS.accent }}>
                        {t('common.send')}
                      </Text>
                    </Pressable>
                  </SettingRow>

                  <SettingRow icon="language-outline" label={t('settings.language')} last>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {(['fr', 'en'] as const).map((l) => {
                        const isSel = settings.language === l;
                        return (
                          <Pressable
                            key={l}
                            onPress={() => updateSettings({ language: l })}
                            style={{
                              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                              backgroundColor: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.06)',
                              borderWidth: 1.5,
                              borderColor: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.10)',
                            }}
                          >
                            <Text style={{
                              fontSize: 13, fontWeight: '900',
                              color: isSel ? '#07090f' : 'rgba(255,255,255,0.55)',
                            }}>
                              {l.toUpperCase()}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </SettingRow>
                </View>

                <Pressable
                  onPress={handleLogout}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                    padding: 16, borderRadius: 16,
                    backgroundColor: pressed ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.10)',
                    borderWidth: 1, borderColor: 'rgba(239,68,68,0.28)',
                  })}
                >
                  <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#ef4444', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    {t('profile.logoutBtn')}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ── HERO PROFILE — carte unifiée avatar + nom + rang + XP ─────────
function ProfileHero({
  name, initial, rank, totalXP,
  editingName, nameInput, onNameInputChange, onStartEditName, onSaveName,
}: {
  name: string;
  initial: string;
  rank: Rank;
  totalXP: number;
  editingName: boolean;
  nameInput: string;
  onNameInputChange: (v: string) => void;
  onStartEditName: () => void;
  onSaveName: () => void;
}) {
  const t = useT();
  const progress  = getProgressToNextRank(totalXP);
  const nextRank  = getNextRank(rank.tier as RankTier, rank.level);
  const tierLabel = t(`tier.${rank.tier}` as any);
  const gradient  = getRankGradient(rank.tier);
  const xpToNext  = nextRank ? Math.max(0, nextRank.minXP - totalXP) : 0;

  return (
    <View style={{
      borderRadius: 24, overflow: 'hidden',
      borderWidth: 1, borderColor: `${rank.color}28`,
      shadowColor: rank.color,
      shadowOpacity: 0.30, shadowRadius: 22, shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    }}>
      <LinearGradient
        colors={[`${rank.color}18`, `${rank.color}04`]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ padding: 20, gap: 18 }}
      >
        {/* ── Row 1 : avatar + nom + edit ─────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <LinearGradient
            colors={gradient}
            style={{
              width: 54, height: 54, borderRadius: 17,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: rank.color, shadowOpacity: 0.45,
              shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff' }}>{initial}</Text>
          </LinearGradient>

          {editingName ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                style={{
                  flex: 1, fontSize: 20, fontWeight: '900', color: '#fff',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
                  borderWidth: 1.5, borderColor: rank.color,
                }}
                value={nameInput}
                onChangeText={onNameInputChange}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={onSaveName}
              />
              <Pressable
                onPress={onSaveName}
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  backgroundColor: rank.color,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark" size={19} color="#07090f" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={onStartEditName}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Text style={{ flex: 1, fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.9 }} numberOfLines={1}>
                {name}
              </Text>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 9, padding: 6,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
              }}>
                <Ionicons name="pencil-outline" size={13} color="rgba(255,255,255,0.65)" />
              </View>
            </Pressable>
          )}
        </View>

        {/* ── Row 2 : badge + tier info ─────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <BadgeImage tier={rank.tier} size={110} />

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{
              fontSize: 10, fontWeight: '900', color: rank.color,
              letterSpacing: 2.5, textTransform: 'uppercase',
            }}>
              {tierLabel}
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.8, lineHeight: 28 }}>
              {rank.name}
            </Text>
            {rank.description && (
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', lineHeight: 16, marginTop: 2 }}>
                {rank.description}
              </Text>
            )}
          </View>
        </View>

        {/* ── Séparateur ───────────────────────────────── */}
        <View style={{ height: 1, backgroundColor: `${rank.color}22` }} />

        {/* ── Row 3 : XP + progress ─────────────────────── */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.6, textTransform: 'uppercase' }}>
                {t('rank.xpTotal')}
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
                {totalXP.toLocaleString('fr-FR')}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.6, textTransform: 'uppercase' }}>
                {nextRank ? t('rank.next') : t('rank.max')}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: rank.color, letterSpacing: -0.3 }}>
                {nextRank ? `${xpToNext.toLocaleString('fr-FR')} XP` : '★'}
              </Text>
            </View>
          </View>

          <ProgressBar
            progress={progress}
            gradient={gradient}
            backgroundColor="rgba(255,255,255,0.07)"
            height={8}
            animated
          />

          {nextRank && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', fontWeight: '700' }}>
                {t('rank.towards')} <Text style={{ color: '#fff', fontWeight: '800' }}>{nextRank.name}</Text>
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '900', color: rank.color }}>
                {progress}%
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}
