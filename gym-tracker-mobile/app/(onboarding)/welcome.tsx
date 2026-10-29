import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { border, colors, hardShadow, plateColor, radius, space } from '@/constants/theme';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { Sparkle } from '@/components/ui/Sparkle';
import { Chip } from '@/components/ui/Chip';
import { Barbell } from '@/components/disc/Barbell';

/** Height the preview needs, tilt and shadow included. */
const PREVIEW_HEIGHT = 200;

export default function Welcome() {
  const [roomy, setRoomy] = useState(false);
  return (
    <Screen
      background={<BigPlate />}
      footer={
        <>
          <StickerButton label="C'est parti" onPress={() => router.push('/setup')} />
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

      {/* What the app does, shown before it is said: today's lift, its target, the plates */}
      <View
        style={{ flex: 1, justifyContent: 'center' }}
        onLayout={(e) => setRoomy(e.nativeEvent.layout.height >= PREVIEW_HEIGHT)}
      >
        {/* A small phone has no room for it: the plate alone fills the gap */}
        {roomy ? <PreviewCard /> : null}
      </View>

      <Text size={60} weight="black" style={{ lineHeight: 64 }}>
        Tu charges.{'\n'}On calcule.
      </Text>
      <Text size={19} color={colors.inkMuted} style={{ marginTop: 16, lineHeight: 27 }}>
        Dis-nous comment tu t'entraînes : on prépare tes séances, les charges et les disques à mettre.
      </Text>
      <View style={{ marginTop: 18, marginBottom: 30 }}>
        <Chip label="4 questions · 30 secondes" tone="sun" />
      </View>
    </Screen>
  );
}

/** A tilted sticker of the logger: the next lift with its target and the plates per side. */
function PreviewCard() {
  return (
    <View
      accessible
      accessibilityLabel="Exemple : squat, 80 kilos pour 5 reps, 20 et 10 de chaque côté"
      style={{
        width: 236,
        padding: space.md,
        borderRadius: radius.md,
        borderWidth: border.strong,
        borderColor: colors.ink,
        backgroundColor: colors.card,
        transform: [{ rotate: '-4deg' }],
        ...hardShadow(4),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text size={13} weight="bold" color={colors.inkMuted}>
          Séance du jour · Legs
        </Text>
        <Chip tone="success" label="+2,5 kg" />
      </View>
      <View style={{ height: 70, justifyContent: 'center' }}>
        <Barbell perSide={[20, 10]} scale={0.62} barWidth={70} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text size={17} weight="black">
          Squat
        </Text>
        <Text size={22} weight="black">
          80
          <Text size={13} weight="bold" color={colors.inkMuted}>
            {' '}
            kg × 5
          </Text>
        </Text>
      </View>
      <Text size={13} color={colors.inkMuted}>
        Par côté : 20 + 10
      </Text>
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
