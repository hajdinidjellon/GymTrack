import type { ViewStyle } from 'react-native';
import { border, colors, radius } from '@/constants/theme';

/**
 * The small actions under the exercise name (« Changer d'exo », « Faire plus tard »): a light
 * outline, enough to read as buttons without competing with « Valider ».
 */
export function chipStyle(pressed: boolean): ViewStyle {
  return {
    minHeight: 30,
    paddingVertical: 2,
    flexShrink: 1,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: border.base - 0.5,
    borderColor: pressed ? colors.outlineStrong : colors.outlineSoft,
    backgroundColor: pressed ? colors.coralSoft : colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  };
}
