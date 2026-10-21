import React from 'react';
import { View } from 'react-native';
import { colors } from '@/constants/theme';
import { BackButton } from './BackButton';

/** Back arrow and the onboarding progress, or just the arrow when editing from the profile. */
export function StepHeader({ step, total }: { step?: number; total?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <BackButton />
      {step != null && total != null ? (
        <View accessible accessibilityLabel={`Étape ${step} sur ${total}`} style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
          {Array.from({ length: total }, (_, i) => (
            <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < step ? colors.cream : colors.line }} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
