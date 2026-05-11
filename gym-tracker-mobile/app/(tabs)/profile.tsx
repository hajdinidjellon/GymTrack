import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { RankCard } from '@/components/gamification/RankCard';
import { BadgeGrid } from '@/components/gamification/BadgeGrid';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useProfileStore } from '@/stores/profileStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { signOut } from '@/lib/supabase';
import { calculateStreakFromWorkouts } from '@/lib/gamification';
import type { AppSettings } from '@/types';

export default function ProfileScreen() {
  const { profile, updateProfile, getTotalXP, getCurrentRank } = useProfileStore();
  const { workouts } = useWorkoutStore();
  const { settings, updateSettings } = useSettingsStore();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name ?? '');
  const [activeSection, setActiveSection] = useState<'stats' | 'badges' | 'settings'>('stats');

  const totalXP = getTotalXP();
  const rank = getCurrentRank();
  const streak = calculateStreakFromWorkouts(workouts);

  const gamificationData = {
    workouts,
    profile: profile ?? null,
    totalXP,
    streak,
  };

  const handleLogout = () => {
    Alert.alert(
      'Se déconnecter',
      'Tes données locales seront conservées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  const handleSaveName = async () => {
    await updateProfile({ name: nameInput });
    setEditingName(false);
  };

  const SECTIONS = [
    { id: 'stats' as const, label: 'Statistiques' },
    { id: 'badges' as const, label: 'Badges' },
    { id: 'settings' as const, label: 'Réglages' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <ScrollView contentContainerClassName="pb-8">
        {/* Header profil */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 16 }}>
          {/* Bouton déconnexion en haut à droite */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Pressable
              onPress={handleLogout}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: 'rgba(239,68,68,0.10)',
                borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
                borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
              }}
            >
              <Ionicons name="log-out-outline" size={16} color="#ef4444" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#ef4444' }}>Déconnexion</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <LinearGradient
              colors={rank ? [rank.color, rank.color + '88'] : ['#7c3aed', '#06b6d4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
                shadowColor: rank?.color ?? '#7c3aed',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
            >
              <Text style={{ fontSize: 28 }}>
                {rank?.icon === 'crown' ? '👑' : rank?.icon === 'gem' ? '💎' : rank?.icon === 'award' ? '🏆' : '🛡️'}
              </Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              {editingName ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Input value={nameInput} onChangeText={setNameInput} placeholder="Ton prénom" />
                  <Button label="OK" variant="gradient" size="sm" onPress={handleSaveName} />
                </View>
              ) : (
                <Pressable onPress={() => setEditingName(true)}>
                  <Text style={{ fontSize: 26, fontWeight: '900', color: '#f8fafc' }}>
                    {profile?.name || 'Athlète'}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'rgba(248,250,252,0.35)', marginTop: 2 }}>
                    Appuyer pour modifier
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {rank && <RankCard rank={rank} totalXP={totalXP} />}
        </View>

        {/* Navigation sections */}
        <View style={{ flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          {SECTIONS.map((s) => (
            <Pressable key={s.id} onPress={() => setActiveSection(s.id)} style={{ flex: 1, borderRadius: 10, overflow: 'hidden' }}>
              {activeSection === s.id ? (
                <LinearGradient
                  colors={['#7c3aed', '#06b6d4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 9, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{s.label}</Text>
                </LinearGradient>
              ) : (
                <View style={{ paddingVertical: 9, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(248,250,252,0.45)' }}>{s.label}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Section Statistiques */}
        {activeSection === 'stats' && (
          <View className="px-5 gap-4">
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { value: workouts.length, label: 'Séances', color: '#06b6d4' },
                { value: streak,          label: 'Streak 🔥', color: '#f59e0b' },
                { value: totalXP,         label: 'XP',        color: '#7c3aed' },
              ].map(({ value, label, color }) => (
                <View key={label} style={{ flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}>
                  <LinearGradient colors={[`${color}18`, `${color}06`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 14, alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 28, fontWeight: '900', color }}>{typeof value === 'number' && value > 999 ? value.toLocaleString('fr-FR') : value}</Text>
                    <Text style={{ fontSize: 11, color: 'rgba(248,250,252,0.45)', fontWeight: '500' }}>{label}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>

            {/* PRs */}
            {profile?.prs && profile.prs.length > 0 && (
              <View className="gap-2">
                <Text className="text-base font-semibold text-text-primary">
                  Records personnels
                </Text>
                {profile.prs.map((pr) => (
                  <Card key={pr.exercise} padding="md" className="flex-row items-center gap-3">
                    <Text className="text-2xl">🏆</Text>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-text-primary">
                        {pr.exercise}
                      </Text>
                      <Text className="text-xs text-text-muted">
                        1RM ~{pr.oneRepMax.toFixed(1)} kg
                      </Text>
                    </View>
                    <Text className="text-sm font-bold text-text-primary">
                      {pr.weight}kg × {pr.reps}
                    </Text>
                  </Card>
                ))}
              </View>
            )}

            {/* Infos profil */}
            {profile && (
              <Card padding="md" className="gap-3">
                <Text className="text-sm font-semibold text-text-primary">
                  Mon profil
                </Text>
                <View className="gap-1.5">
                  <InfoRow label="Niveau" value={profile.experienceLevel} />
                  <InfoRow label="Fréquence" value={`${profile.trainingFrequency} séances/sem.`} />
                  {profile.height && (
                    <InfoRow label="Taille" value={`${profile.height} cm`} />
                  )}
                </View>
              </Card>
            )}
          </View>
        )}

        {/* Section Badges */}
        {activeSection === 'badges' && (
          <View className="px-5">
            <BadgeGrid gamificationData={gamificationData} showLocked />
          </View>
        )}

        {/* Section Réglages */}
        {activeSection === 'settings' && (
          <View className="px-5 gap-4">
            <Card padding="md" className="gap-4">
              <Text className="text-sm font-semibold text-text-primary">
                Préférences
              </Text>

              <SettingRow
                label="Unités"
                value={
                  <View className="flex-row gap-1">
                    {(['kg', 'lbs'] as const).map((u) => (
                      <Pressable
                        key={u}
                        onPress={() => updateSettings({ units: u })}
                        className={`px-3 py-1 rounded-lg ${settings.units === u ? 'bg-brand-primary' : 'bg-white/[0.1]'}`}
                      >
                        <Text className={`text-xs font-medium ${settings.units === u ? 'text-white' : 'text-text-secondary'}`}>
                          {u}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                }
              />

              <SettingRow
                label="Timer de repos"
                value={
                  <Switch
                    value={settings.restTimerEnabled}
                    onValueChange={(v) => updateSettings({ restTimerEnabled: v })}
                    trackColor={{ true: '#7c3aed' }}
                  />
                }
              />

              <SettingRow
                label="Repos par défaut"
                value={
                  <View className="flex-row gap-1">
                    {([60, 90, 120, 180] as const).map((t) => (
                      <Pressable
                        key={t}
                        onPress={() => updateSettings({ defaultRestTime: t })}
                        className={`px-2 py-1 rounded-lg ${settings.defaultRestTime === t ? 'bg-brand-primary' : 'bg-white/[0.1]'}`}
                      >
                        <Text className={`text-xs font-medium ${settings.defaultRestTime === t ? 'text-white' : 'text-text-secondary'}`}>
                          {t}s
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                }
              />

              <SettingRow
                label="Notifications"
                value={
                  <Switch
                    value={settings.notifications}
                    onValueChange={(v) => updateSettings({ notifications: v })}
                    trackColor={{ true: '#7c3aed' }}
                  />
                }
              />

              <SettingRow
                label="Langue"
                value={
                  <View className="flex-row gap-1">
                    {(['fr', 'en'] as const).map((l) => (
                      <Pressable
                        key={l}
                        onPress={() => updateSettings({ language: l })}
                        className={`px-3 py-1 rounded-lg ${settings.language === l ? 'bg-brand-primary' : 'bg-white/[0.1]'}`}
                      >
                        <Text className={`text-xs font-medium ${settings.language === l ? 'text-white' : 'text-text-secondary'}`}>
                          {l.toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                }
              />
            </Card>

            <Button
              label="Se déconnecter"
              variant="danger"
              size="md"
              fullWidth
              onPress={handleLogout}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-xs text-text-muted">{label}</Text>
      <Text className="text-xs font-medium text-text-secondary capitalize">{value}</Text>
    </View>
  );
}

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-text-secondary">{label}</Text>
      {value}
    </View>
  );
}
