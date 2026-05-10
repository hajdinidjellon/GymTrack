import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { XPBar } from '@/components/gamification/XPBar';
import { RankCard } from '@/components/gamification/RankCard';
import { MuscleHeatmap } from '@/components/muscle/MuscleHeatmap';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import {
  calculateStreakFromWorkouts,
  getMuscleActivity,
  getUndertainedMuscles,
} from '@/lib/gamification';
import { getSuggestedSession } from '@/lib/aiPlanner';
import { initialSync } from '@/lib/sync';
import { colors } from '@/constants/theme';

export default function DashboardScreen() {
  const { workouts, loadWorkouts, setWorkouts, getWorkoutsThisWeek } =
    useWorkoutStore();
  const { profile, loadProfile, saveProfile, getTotalXP, getCurrentRank } =
    useProfileStore();
  const { activeSession } = useSessionStore();

  const [refreshing, setRefreshing] = useState(false);
  const [heatmapPeriod, setHeatmapPeriod] = useState<7 | 30>(7);

  useEffect(() => {
    loadWorkouts();
    loadProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const remote = await initialSync();
    if (remote) {
      setWorkouts(remote.workouts);
      if (remote.profile) await saveProfile(remote.profile);
    }
    setRefreshing(false);
  };

  const totalXP = getTotalXP();
  const rank = getCurrentRank();
  const streak = calculateStreakFromWorkouts(workouts);
  const weekWorkouts = getWorkoutsThisWeek();
  const totalWorkouts = workouts.length;
  const muscleActivity = getMuscleActivity(workouts, heatmapPeriod);
  const undertrainedMuscles = getUndertainedMuscles(workouts);

  const activePlans = profile?.goals.filter((g) => g.status === 'active') ?? [];
  const suggested = profile
    ? getSuggestedSession(profile, workouts, null)
    : null;

  const recentWorkouts = workouts.slice(0, 5);
  const today = format(new Date(), 'EEEE d MMMM', { locale: fr });

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <ScrollView
        contentContainerClassName="gap-5 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        {/* Header */}
        <View className="px-5 pt-2 gap-1">
          <Text className="text-sm text-text-muted capitalize">{today}</Text>
          <Text className="text-2xl font-black text-text-primary">
            Bonjour {profile?.name ? `, ${profile.name}` : ''} 👋
          </Text>
        </View>

        {/* Séance en cours — bannière */}
        {activeSession && (
          <Pressable
            onPress={() => router.push('/(tabs)/session')}
            className="mx-5 p-4 rounded-2xl flex-row items-center gap-3"
            style={{
              backgroundColor: 'rgba(16,185,129,0.15)',
              borderWidth: 1,
              borderColor: 'rgba(16,185,129,0.3)',
            }}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: 'rgba(16,185,129,0.25)' }}
            >
              <Text className="text-xl">▶️</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-status-success">
                Séance en cours
              </Text>
              <Text className="text-xs text-text-muted">
                {activeSession.exercises.length} exercice(s) —{' '}
                {Math.floor(activeSession.elapsedSeconds / 60)} min
              </Text>
            </View>
            <Text className="text-text-secondary text-sm">Reprendre →</Text>
          </Pressable>
        )}

        {/* Statistiques clés */}
        <View className="px-5 flex-row gap-3">
          <StatCard
            label="Streak"
            value={streak}
            unit="jours"
            icon={<Text>🔥</Text>}
            trend={streak > 0 ? 'up' : 'neutral'}
          />
          <StatCard
            label="Cette semaine"
            value={weekWorkouts.length}
            unit="séances"
            icon={<Text>📅</Text>}
            sublabel={`/ ${profile?.trainingFrequency ?? 3} prévues`}
          />
          <StatCard
            label="Total"
            value={totalWorkouts}
            unit="séances"
            icon={<Text>🏋️</Text>}
          />
        </View>

        {/* Rang XP */}
        {rank && (
          <View className="px-5">
            <RankCard rank={rank} totalXP={totalXP} />
          </View>
        )}

        {/* Suggestion de séance */}
        {suggested && !activeSession && (
          <View className="px-5">
            <Text className="text-base font-semibold text-text-primary mb-3">
              Séance suggérée
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/session')}
              className="p-4 rounded-2xl gap-3"
              style={{
                backgroundColor: 'rgba(124,58,237,0.12)',
                borderWidth: 1,
                borderColor: 'rgba(124,58,237,0.25)',
              }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-text-primary">
                  {suggested.title}
                </Text>
                <Text className="text-sm text-text-muted">
                  ~{suggested.estimatedDuration} min
                </Text>
              </View>
              <Text className="text-sm text-text-secondary">
                {suggested.reason}
              </Text>
              <View className="flex-row items-center gap-1 flex-wrap">
                {suggested.focus.map((m) => (
                  <View
                    key={m}
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(124,58,237,0.2)' }}
                  >
                    <Text className="text-xs text-brand-primary font-medium">
                      {m}
                    </Text>
                  </View>
                ))}
              </View>
              <View
                className="py-2.5 rounded-xl items-center"
                style={{ backgroundColor: 'rgba(124,58,237,0.25)' }}
              >
                <Text className="text-sm font-semibold text-brand-primary">
                  Démarrer cette séance →
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Muscles sous-travaillés */}
        {undertrainedMuscles.length > 0 && (
          <View className="px-5">
            <Card padding="md" className="gap-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm">⚠️</Text>
                <Text className="text-sm font-semibold text-status-warning">
                  Muscles à ne pas négliger
                </Text>
              </View>
              <Text className="text-xs text-text-muted">
                {undertrainedMuscles
                  .slice(0, 4)
                  .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
                  .join(', ')}{' '}
                — peu travaillés cette semaine.
              </Text>
            </Card>
          </View>
        )}

        {/* Heatmap musculaire */}
        <View className="px-5">
          <Text className="text-base font-semibold text-text-primary mb-3">
            Activité musculaire
          </Text>
          <Card padding="md">
            <MuscleHeatmap
              workouts={workouts}
              period={heatmapPeriod}
              onPeriodChange={setHeatmapPeriod}
              compact
            />
          </Card>
        </View>

        {/* Dernières séances */}
        {recentWorkouts.length > 0 && (
          <View className="px-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-text-primary">
                Dernières séances
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/progress')}>
                <Text className="text-sm text-brand-primary">Tout voir</Text>
              </Pressable>
            </View>
            <View className="gap-2">
              {recentWorkouts.map((workout) => (
                <Pressable
                  key={workout.id}
                  onPress={() =>
                    router.push({ pathname: '/workout/[id]', params: { id: workout.id } })
                  }
                >
                  <Card padding="md" className="flex-row items-center gap-3">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: 'rgba(124,58,237,0.15)' }}
                    >
                      <Text className="text-lg">🏋️</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-text-primary">
                        {workout.name}
                      </Text>
                      <Text className="text-xs text-text-muted">
                        {format(new Date(workout.date), 'd MMM', { locale: fr })}
                        {workout.duration ? ` · ${workout.duration} min` : ''}
                        {' · '}{workout.exercises.length} exercices
                      </Text>
                    </View>
                    <View className="flex-row gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Text
                          key={star}
                          className="text-xs"
                          style={{
                            opacity: star <= (workout.feeling ?? 3) ? 1 : 0.2,
                          }}
                        >
                          ⭐
                        </Text>
                      ))}
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* CTA première séance */}
        {totalWorkouts === 0 && !activeSession && (
          <View className="px-5 items-center gap-4 py-8">
            <Text className="text-4xl">🏋️</Text>
            <Text className="text-xl font-bold text-text-primary text-center">
              Prêt pour ta première séance ?
            </Text>
            <Text className="text-text-secondary text-center">
              Commence à traquer tes progrès dès maintenant.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/session')}
              className="px-8 py-4 rounded-2xl"
              style={{ backgroundColor: '#7c3aed' }}
            >
              <Text className="text-white font-bold text-base">
                Démarrer une séance
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
