/**
 * POLITIQUE DE CONFIDENTIALITÉ — consultable hors ligne depuis
 * Profil → Réglages → Légal (exigence stores : lien in-app).
 * Contenu : constants/legalContent.ts (miroir de docs/legal/privacy-policy.html).
 */
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useT } from '@/lib/i18n';
import { useLanguage } from '@/stores/settingsStore';
import { PRIVACY_POLICY } from '@/constants/legalContent';
import { colors } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const t = useT();
  const language = useLanguage();
  const doc = PRIVACY_POLICY[language];

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
            {t('legal.privacy')}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, gap: 22 }}>
          <Text style={{ fontSize: 12, color: colors.text.muted, fontWeight: '600' }}>
            {t('legal.updated', { date: doc.updated })}
          </Text>

          {doc.sections.map((section) => (
            <View key={section.title} style={{ gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.brand.primary, letterSpacing: -0.2 }}>
                {section.title}
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 22, color: colors.text.secondary }}>
                {section.body}
              </Text>
            </View>
          ))}

          {/* Disclaimer santé — rappelé à la fin du document légal */}
          <View style={{
            borderRadius: 14, padding: 14,
            backgroundColor: colors.bg.card,
            borderWidth: 1, borderColor: colors.bg.cardBorder,
          }}>
            <Text style={{ fontSize: 12, lineHeight: 18, color: colors.text.muted }}>
              {t('legal.disclaimer')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
