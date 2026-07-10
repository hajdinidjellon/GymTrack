/**
 * LICENCES OPEN SOURCE — attributions des bibliothèques tierces.
 * Accessible depuis Profil → Réglages → Légal.
 * Données : constants/licenses.ts (générées depuis package.json).
 */
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useT } from '@/lib/i18n';
import { OSS_LICENSES } from '@/constants/licenses';
import { colors } from '@/constants/theme';

export default function LicensesScreen() {
  const t = useT();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.back')}
            style={({ pressed }) => ({
              width: 38, height: 38, borderRadius: 12,
              backgroundColor: colors.bg.card,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: colors.text.primary, letterSpacing: -0.3 }}>
            {t('legal.licenses')}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, gap: 14 }}>
          <Text style={{ fontSize: 13, lineHeight: 20, color: colors.text.secondary }}>
            {t('legal.licensesIntro')}
          </Text>

          <View style={{
            borderRadius: 16,
            backgroundColor: colors.bg.card,
            borderWidth: 1, borderColor: colors.bg.cardBorder,
            paddingHorizontal: 14,
          }}>
            {OSS_LICENSES.map((lib, i) => (
              <View
                key={lib.name}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  paddingVertical: 11,
                  borderBottomWidth: i === OSS_LICENSES.length - 1 ? 0 : 1,
                  borderColor: colors.bg.cardBorder,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text.primary }} numberOfLines={1}>
                    {lib.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.text.muted, marginTop: 1 }}>
                    v{lib.version}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.brand.secondary }}>
                  {lib.license}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
