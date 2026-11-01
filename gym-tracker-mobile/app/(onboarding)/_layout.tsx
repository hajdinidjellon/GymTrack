import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';
import { useLocale } from '@/hooks/useLocale';

export default function OnboardingLayout() {
  useLocale();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.paper },
        animation: 'slide_from_right',
      }}
    />
  );
}
