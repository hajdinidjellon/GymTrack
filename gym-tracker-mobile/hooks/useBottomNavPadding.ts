import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_NAV_RESERVED_SPACE } from '@/components/ui/BottomNav';

export function useBottomNavPadding(extra = 16) {
  const insets = useSafeAreaInsets();
  return BOTTOM_NAV_RESERVED_SPACE + insets.bottom + extra;
}
