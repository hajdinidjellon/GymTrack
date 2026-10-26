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
        <View
          accessible
          accessibilityLabel={`Étape ${step} sur ${total}`}
          style={{ flex: 1, flexDirection: 'row', gap: 8 }}
        >
          {Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 12,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: i < step ? colors.ink : colors.line,
                borderStyle: i < step ? 'solid' : 'dashed',
                backgroundColor: i < step ? colors.coral : 'transparent',
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
