import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { border, colors, hardShadow, plateColor } from '@/constants/theme';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { Sparkle } from '@/components/ui/Sparkle';

export default function Welcome() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <BigPlate />
      <Screen
        style={{ backgroundColor: 'transparent' }}
        footer={
          <>
            <StickerButton label="Commencer" onPress={() => router.push('/goal')} />
            <StickerButton
              label="J'ai déjà un compte"
              variant="ghost"
              size="small"
              onPress={() => router.push('/login')}
            />
          </>
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              borderWidth: border.strong,
              borderColor: colors.ink,
              backgroundColor: colors.coral,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                borderWidth: 2,
                borderColor: colors.ink,
                backgroundColor: colors.paper,
              }}
            />
          </View>
          <Text size={24} weight="black">
            GymTrack
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <Text size={60} weight="black" style={{ lineHeight: 64 }}>
          Tu charges.{'\n'}On calcule.
        </Text>
        <Text size={19} color={colors.inkMuted} style={{ marginTop: 16, marginBottom: 30, lineHeight: 27 }}>
          Ton programme en pilote automatique : la charge, les reps et les disques à mettre, prêts à chaque série.
        </Text>
      </Screen>
    </View>
  );
}

/** A 20 kg plate sticker peeking from the right edge, with its two sparkles. */
function BigPlate() {
  return (
    <View accessible={false} style={{ position: 'absolute', right: -140, top: 90 }}>
      <View
        style={{
          width: 380,
          height: 380,
          borderRadius: 190,
          borderWidth: border.strong,
          borderColor: colors.ink,
          backgroundColor: plateColor(20),
          alignItems: 'center',
          justifyContent: 'center',
          ...hardShadow(5),
        }}
      >
        <View
          style={{
            width: 300,
            height: 300,
            borderRadius: 150,
            borderWidth: 2,
            borderColor: colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text size={30} weight="black" color={colors.card} style={{ position: 'absolute', top: 30 }}>
            20 kg
          </Text>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: border.strong,
              borderColor: colors.ink,
              backgroundColor: colors.steel,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: border.base,
                borderColor: colors.ink,
                backgroundColor: colors.paper,
              }}
            />
          </View>
        </View>
      </View>
      <View style={{ position: 'absolute', left: -30, top: -26 }}>
        <Sparkle size={52} />
      </View>
      <View style={{ position: 'absolute', left: 4, bottom: 10 }}>
        <Sparkle size={26} fill={colors.coral} />
      </View>
    </View>
  );
}
