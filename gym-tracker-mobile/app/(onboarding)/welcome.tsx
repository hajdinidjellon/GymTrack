import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

export default function Welcome() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BigPlate />
      <Screen
        style={{ backgroundColor: 'transparent' }}
        footer={
          <>
            <Button label="Commencer" onPress={() => router.push('/goal')} />
            <Button label="J'ai déjà un compte" variant="ghost" height={56} onPress={() => router.push('/login')} />
          </>
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 6, borderColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cream }} />
          </View>
          <Text size={22} weight="black">GymTrack</Text>
        </View>

        <View style={{ flex: 1 }} />

        <Text size={66} weight="black" style={{ lineHeight: 64 }}>Tu charges.{'\n'}On calcule.</Text>
        <Text size={19} color={colors.muted} style={{ marginTop: 16, marginBottom: 30, lineHeight: 27 }}>
          Ton programme en pilote automatique : la charge, les reps et les disques à mettre, prêts à chaque série.
        </Text>
      </Screen>
    </View>
  );
}

/** A 20 kg plate peeking from the right edge. */
function BigPlate() {
  return (
    <View
      accessible={false}
      style={{
        position: 'absolute',
        right: -150,
        top: 70,
        width: 400,
        height: 400,
        borderRadius: 200,
        borderWidth: 26,
        borderColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: 300, height: 300, borderRadius: 150, borderWidth: 3, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
        <Text size={30} weight="black" style={{ position: 'absolute', top: 34, letterSpacing: 2 }}>20 KG</Text>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bg, borderWidth: 3, borderColor: colors.line }} />
        </View>
      </View>
    </View>
  );
}
