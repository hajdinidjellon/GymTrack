import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, Animated, Easing,
  Dimensions, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const BG = require('@/assets/images/welcome-background.png') as number;
const { height: H } = Dimensions.get('window');

export default function WelcomeScreen() {
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#07090f' }}>
      <StatusBar style="light" />

      <ImageBackground source={BG} style={{ flex: 1 }} resizeMode="cover">
        <LinearGradient
          colors={['rgba(7,9,15,0.0)', 'rgba(7,9,15,0.10)', 'rgba(7,9,15,0.75)', '#07090f']}
          locations={[0, 0.42, 0.74, 1]}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <Animated.View style={{ flex: 1, opacity: fadeIn, transform: [{ translateY: slideUp }] }}>

              {/* ── Titre en haut ─────────────────────────── */}
              <View style={{ alignItems: 'center', marginTop: H * 0.07, gap: 10, paddingHorizontal: 24 }}>
                <Text style={{
                  fontSize: 52, fontWeight: '900', letterSpacing: -2,
                  color: '#fff', textAlign: 'center', lineHeight: 56,
                }}>
                  GymTrack
                </Text>
                <Text style={{
                  fontSize: 17, fontWeight: '600',
                  color: 'rgba(255,255,255,0.65)',
                  textAlign: 'center', lineHeight: 24,
                }}>
                  Soulève plus, progresse mieux, recommence.
                </Text>
              </View>

              <View style={{ flex: 1 }} />

              {/* ── Boutons en bas ────────────────────────── */}
              <View style={{ paddingHorizontal: 24, paddingBottom: 32, gap: 14 }}>
                <Pressable
                  onPress={() => router.push('/(auth)/onboarding/name')}
                  style={({ pressed }) => ({
                    borderRadius: 20,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    shadowColor: '#38bdf8', shadowOpacity: 0.50,
                    shadowRadius: 22, shadowOffset: { width: 0, height: 8 },
                    elevation: 12,
                  })}
                >
                  <View style={{ backgroundColor: '#38bdf8', borderRadius: 20, paddingVertical: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#07090f', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                      Commencer maintenant
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => router.push('/(auth)/login')}
                  style={({ pressed }) => ({
                    borderRadius: 20,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.10)',
                    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
                    paddingVertical: 20, alignItems: 'center', borderRadius: 20,
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                      J'ai un compte
                    </Text>
                  </View>
                </Pressable>
              </View>

            </Animated.View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}
