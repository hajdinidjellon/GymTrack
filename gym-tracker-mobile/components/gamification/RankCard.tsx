import React from 'react';
import { View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, getRankGradient } from '@/constants/theme';
import { getProgressToNextRank, getNextRank } from '@/lib/gamification';
import type { Rank } from '@/types';

const RANK_IMAGE = require('@/assets/rank.png') as number;

const IMG_W = 1408;
const IMG_H = 768;

// Coordonnées pixel-perfect de chaque badge dans rank.png
interface BadgeCrop { x: number; y: number; w: number; h: number }

const BADGE_CROPS: Record<string, BadgeCrop> = {
  bronze:   { x: 36,   y: 254, w: 242, h: 250 },
  silver:   { x: 279,  y: 253, w: 195, h: 249 },
  gold:     { x: 495,  y: 250, w: 199, h: 254 },
  platinum: { x: 715,  y: 252, w: 197, h: 250 },
  diamond:  { x: 928,  y: 254, w: 205, h: 249 },
  legend:   { x: 1133, y: 220, w: 242, h: 290 },
};

const TIER_LABEL: Record<string, string> = {
  bronze:   'BRONZE',
  silver:   'ARGENT',
  gold:     'OR',
  platinum: 'PLATINE',
  diamond:  'DIAMANT',
  legend:   'CHAMPION',
};

interface BadgeImageProps {
  tier: string;
  size: number; // hauteur d'affichage souhaitée
}

function BadgeImage({ tier, size }: BadgeImageProps) {
  const crop  = BADGE_CROPS[tier] ?? BADGE_CROPS.bronze!;

  // Scale pour que la hauteur du badge = size
  const scale = size / crop.h;

  // Largeur d'affichage proportionnelle au crop
  const dispW = crop.w * scale;

  // Décalage pour ne montrer que la zone exacte du badge
  const offX  = -crop.x * scale;
  const offY  = -crop.y * scale;

  return (
    <View style={{ width: dispW, height: size, overflow: 'hidden' }}>
      <Image
        source={RANK_IMAGE}
        style={{
          width:      IMG_W * scale,
          height:     IMG_H * scale,
          marginLeft: offX,
          marginTop:  offY,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}

// ── Composant principal ─────────────────────────────────────────

interface RankCardProps {
  rank: Rank;
  totalXP: number;
  compact?: boolean;
  homeHero?: boolean;
}

export function RankCard({ rank, totalXP, compact = false, homeHero = false }: RankCardProps) {
  const progress     = getProgressToNextRank(totalXP);
  const nextRank     = getNextRank(rank.tier, rank.level);
  const rankGradient = getRankGradient(rank.tier);
  const tierLabel    = TIER_LABEL[rank.tier] ?? rank.tier.toUpperCase();

  /* ── Home Hero : card immersive (accueil) ─────────────────── */
  if (homeHero) {
    const xpToNext = nextRank ? Math.max(0, nextRank.minXP - totalXP) : 0;
    return (
      <LinearGradient
        colors={[`${rank.color}22`, `${rank.color}08`, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24, padding: 20,
          borderWidth: 1, borderColor: `${rank.color}35`,
          shadowColor: rank.color,
          shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <BadgeImage tier={rank.tier} size={100} />

          <View style={{ flex: 1, gap: 10 }}>
            <View>
              <Text style={{
                fontSize: 10, fontWeight: '900', color: rank.color,
                letterSpacing: 2.8, textTransform: 'uppercase',
              }}>
                {tierLabel}
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 30, marginTop: 2 }}>
                {rank.name}
              </Text>
            </View>

            <ProgressBar progress={progress} gradient={rankGradient} backgroundColor="rgba(255,255,255,0.08)" height={7} animated />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: '700' }}>
                {totalXP.toLocaleString('fr-FR')} XP
              </Text>
              {nextRank ? (
                <Text style={{ fontSize: 11, fontWeight: '900', color: rank.color }}>
                  +{xpToNext.toLocaleString('fr-FR')} XP → {nextRank.name}
                </Text>
              ) : (
                <Text style={{ fontSize: 11, fontWeight: '900', color: rank.color }}>★ Rang max</Text>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  /* ── Compact : une ligne ──────────────────────────────────── */
  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BadgeImage tier={rank.tier} size={72} />

        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={{ fontSize: 17, fontWeight: '900', color: rank.color }}>{rank.name}</Text>
            <Text style={{ fontSize: 12, color: colors.text.muted }}>
              {totalXP.toLocaleString('fr-FR')} XP
            </Text>
          </View>
          <ProgressBar progress={progress} gradient={rankGradient} height={5} animated />
          {nextRank && (
            <Text style={{ fontSize: 11, color: colors.text.muted }}>
              encore {(nextRank.minXP - totalXP).toLocaleString('fr-FR')} XP → {nextRank.name}
            </Text>
          )}
        </View>
      </View>
    );
  }

  /* ── Full (page Profil) ──────────────────────────────────── */
  return (
    <View style={{
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: `${rank.color}28`,
      shadowColor: rank.color,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.30,
      shadowRadius: 24,
      elevation: 10,
    }}>
      <LinearGradient
        colors={[`${rank.color}14`, `${rank.color}04`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 24, gap: 20 }}
      >
        {/* Badge centré */}
        <View style={{ alignItems: 'center', gap: 12 }}>
          <BadgeImage tier={rank.tier} size={140} />

          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{
              fontSize: 11, fontWeight: '700', color: rank.color,
              letterSpacing: 3, textTransform: 'uppercase',
            }}>
              {tierLabel}
            </Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: rank.color, letterSpacing: -0.5 }}>
              {rank.name}
            </Text>
            <Text style={{ fontSize: 13, color: colors.text.secondary, fontStyle: 'italic' }}>
              {rank.description}
            </Text>
          </View>
        </View>

        {/* Séparateur */}
        <View style={{ height: 1, backgroundColor: `${rank.color}18` }} />

        {/* XP + barre */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.text.muted }}>XP total</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text.primary }}>
              {totalXP.toLocaleString('fr-FR')}
              <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text.muted }}> XP</Text>
            </Text>
          </View>

          <View style={{ gap: 7 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: colors.text.muted }}>
                {nextRank ? `Vers ${nextRank.name}` : 'Rang maximum'}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: rank.color }}>{progress}%</Text>
            </View>
            <ProgressBar
              progress={progress}
              gradient={rankGradient}
              backgroundColor="rgba(255,255,255,0.07)"
              height={10}
              animated
            />
            {nextRank && (
              <Text style={{ fontSize: 11, color: colors.text.muted, textAlign: 'right' }}>
                encore {(nextRank.minXP - totalXP).toLocaleString('fr-FR')} XP
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
