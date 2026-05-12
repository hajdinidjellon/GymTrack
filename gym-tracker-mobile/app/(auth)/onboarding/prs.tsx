import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

export default function OnboardingPRsRedirect() {
  const params = useLocalSearchParams<{ name: string; goal: string; level: string; frequency: string }>();

  useEffect(() => {
    router.replace({ pathname: '/(auth)/onboarding/bench', params });
  }, []);

  return null;
}
