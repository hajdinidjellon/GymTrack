import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Switch } from 'react-native';
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
        <View className="px-5 pt-4 pb-5 gap-4">
          <View className="flex-row items-center gap-4">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center"
              style={{ backgroundColor: 'rgba(124,58,237,0.2)' }}
            >
              <Text className="text-3xl">
                {rank?.icon === 'crown' ? '👑' :
                 rank?.icon === 'gem' ? '💎' :
                 rank?.icon === 'award' ? '🏆' : '🛡️'}
              </Text>
            </View>
            <View className="flex-1">
              {editingName ? (
                <View className="flex-row items-center gap-2">
                  <Input
                    value={nameInput}
                    onChangeText={setNameInput}
                    placeholder="Ton prénom"
                  />
                  <Button label="OK" variant="primary" size="sm" onPress={handleSaveName} />
                </View>
              ) : (
                <Pressable onPress={() => setEditingName(true)}>
                  <Text className="text-2xl font-black text-text-primary">
                    {profile?.name || 'Athlète'}
                  </Text>
                  <Text className="text-xs text-text-muted">
                    Appuyer pour modifier
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Rang */}
          {rank && <RankCard rank={rank} totalXP={totalXP} />}
        </View>

        {/* Navigation sections */}
        <View className="flex-row px-5 bg-white/[0.04] mx-5 rounded-xl p-1 mb-4">
          {SECTIONS.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setActiveSection(s.id)}
              className={`flex-1 py-2 rounded-lg items-center ${activeSection === s.id ? 'bg-brand-primary' : ''}`}
            >
              <Text
                className={`text-sm font-medium ${activeSection === s.id ? 'text-white' : 'text-text-secondary'}`}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Section Statistiques */}
        {activeSection === 'stats' && (
          <View className="px-5 gap-4">
            <View className="flex-row gap-3">
              <Card padding="md" className="flex-1 items-center gap-1">
                <Text className="text-2xl font-black text-text-primary">
                  {workouts.length}
                </Text>
                <Text className="text-xs text-text-muted text-center">
                  Séances
                </Text>
              </Card>
              <Card padding="md" className="flex-1 items-center gap-1">
                <Text className="text-2xl font-black text-status-warning">
                  {streak}
                </Text>
                <Text className="text-xs text-text-muted text-center">
                  Streak 🔥
                </Text>
              </Card>
              <Card padding="md" className="flex-1 items-center gap-1">
                <Text className="text-2xl font-black text-brand-primary">
                  {totalXP.toLocaleString('fr-FR')}
                </Text>
                <Text className="text-xs text-text-muted text-center">
                  XP
                </Text>
              </Card>
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
