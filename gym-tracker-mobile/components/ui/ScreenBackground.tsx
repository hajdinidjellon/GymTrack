import React from 'react';
import { View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

/**
 * Palette du fond welcome partagée — extraite pour être réutilisée
 * dans toutes les pages principales de l'app (DA unifiée).
 */
export const BG_COLORS = {
  base:   '#07090f',
  blob1:  '#0d2435',
  blob2:  '#0e2a3f',
  dot1:   '#1a4a63',
  dot2:   '#0e3050',
  accent: '#38bdf8',
} as const;

// ── Blob organique double ─────────────────────────────────────────
function Blob({
  top, left, right, bottom, rotate, scale = 1, opacity = 1,
}: {
  top?: number; left?: number; right?: number; bottom?: number;
  rotate: string; scale?: number; opacity?: number;
}) {
  return (
    <View style={{ position: 'absolute', top, left, right, bottom, opacity }}>
      <View style={{
        width: W * 0.72 * scale, height: W * 0.62 * scale,
        backgroundColor: BG_COLORS.blob1,
        borderTopLeftRadius: 40, borderTopRightRadius: 180,
        borderBottomLeftRadius: 220, borderBottomRightRadius: 60,
        transform: [{ rotate }],
      }} />
      <View style={{
        position: 'absolute',
        width: W * 0.52 * scale, height: W * 0.44 * scale,
        backgroundColor: BG_COLORS.blob2,
        borderTopLeftRadius: 150, borderTopRightRadius: 40,
        borderBottomLeftRadius: 60, borderBottomRightRadius: 160,
        top: W * 0.12 * scale, left: W * 0.08 * scale,
        transform: [{ rotate: '-20deg' }],
      }} />
    </View>
  );
}

interface ScreenBackgroundProps {
  /** Variante visuelle — chaque écran principal a sa signature */
  variant?: 'home' | 'session' | 'progress' | 'planner' | 'profile';
  /** Si true, ajoute un halo cyan en haut (utile pour les hero sections) */
  topHalo?: boolean;
}

/**
 * Fond décoratif partagé : 2 blobs deep-blue + petits ronds flottants
 * + halo cyan subtil. À placer en tout premier dans le View root,
 * tout le contenu de la page passe par-dessus.
 *
 * Chaque variant ajuste la position des blobs pour éviter la monotonie
 * tout en gardant l'identité visuelle.
 */
export function ScreenBackground({ variant = 'home', topHalo = true }: ScreenBackgroundProps) {
  const blobs = BLOB_LAYOUTS[variant];
  const dots  = DOT_LAYOUTS[variant];

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Fond uni de base */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: BG_COLORS.base }} />

      {/* Halo cyan subtil en haut */}
      {topHalo && (
        <LinearGradient
          colors={['rgba(56,189,248,0.08)', 'transparent']}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute', top: -W * 0.3, left: 0, right: 0,
            height: W * 0.9, borderRadius: W,
          }}
        />
      )}

      {/* Blobs */}
      {blobs.map((b, i) => (
        <Blob key={i} {...b} />
      ))}

      {/* Petits ronds flottants */}
      {dots.map((d, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: d.top, left: d.left, right: d.right, bottom: d.bottom,
            width: d.size, height: d.size, borderRadius: d.size / 2,
            backgroundColor: d.color, opacity: d.opacity,
          }}
        />
      ))}
    </View>
  );
}

// ── Layouts spécifiques par variante ──────────────────────────────

type BlobLayout = {
  top?: number; left?: number; right?: number; bottom?: number;
  rotate: string; scale?: number; opacity?: number;
};

type DotLayout = {
  top?: number; left?: number; right?: number; bottom?: number;
  size: number; color: string; opacity: number;
};

const BLOB_LAYOUTS: Record<NonNullable<ScreenBackgroundProps['variant']>, BlobLayout[]> = {
  home: [
    { top: -H * 0.06, left:  -W * 0.22, rotate: '-12deg', opacity: 0.7 },
    { bottom: -H * 0.04, right: -W * 0.30, rotate: '165deg', scale: 0.85, opacity: 0.5 },
  ],
  session: [
    { top: -H * 0.08, right: -W * 0.30, rotate: '40deg', opacity: 0.65 },
    { bottom: H * 0.10, left: -W * 0.28, rotate: '-150deg', scale: 0.7, opacity: 0.5 },
  ],
  progress: [
    { top: -H * 0.04, left: -W * 0.28, rotate: '15deg', scale: 0.9, opacity: 0.55 },
    { bottom: -H * 0.05, right: -W * 0.20, rotate: '-160deg', scale: 0.95, opacity: 0.6 },
  ],
  planner: [
    { top: H * 0.05, right: -W * 0.35, rotate: '-25deg', scale: 0.8, opacity: 0.6 },
    { bottom: H * 0.05, left: -W * 0.22, rotate: '155deg', scale: 0.75, opacity: 0.5 },
  ],
  profile: [
    { top: -H * 0.10, left: -W * 0.18, rotate: '20deg', scale: 0.85, opacity: 0.7 },
    { bottom: H * 0.08, right: -W * 0.25, rotate: '180deg', scale: 0.8, opacity: 0.5 },
  ],
};

const DOT_LAYOUTS: Record<NonNullable<ScreenBackgroundProps['variant']>, DotLayout[]> = {
  home: [
    { top: H * 0.10, left:  W * 0.12, size: 18, color: BG_COLORS.dot1, opacity: 0.7 },
    { top: H * 0.34, right: W * 0.06, size: 24, color: BG_COLORS.dot1, opacity: 0.55 },
    { bottom: H * 0.32, left: W * 0.07, size: 14, color: BG_COLORS.dot2, opacity: 0.85 },
  ],
  session: [
    { top: H * 0.14, right: W * 0.10, size: 16, color: BG_COLORS.dot1, opacity: 0.7 },
    { bottom: H * 0.20, left: W * 0.08, size: 22, color: BG_COLORS.dot2, opacity: 0.55 },
  ],
  progress: [
    { top: H * 0.12, left: W * 0.10, size: 20, color: BG_COLORS.dot1, opacity: 0.7 },
    { top: H * 0.40, right: W * 0.08, size: 14, color: BG_COLORS.dot2, opacity: 0.6 },
  ],
  planner: [
    { top: H * 0.08, left: W * 0.06, size: 16, color: BG_COLORS.dot1, opacity: 0.6 },
    { bottom: H * 0.22, right: W * 0.10, size: 22, color: BG_COLORS.dot2, opacity: 0.55 },
  ],
  profile: [
    { top: H * 0.18, right: W * 0.08, size: 22, color: BG_COLORS.dot1, opacity: 0.65 },
    { bottom: H * 0.18, left: W * 0.10, size: 16, color: BG_COLORS.dot2, opacity: 0.75 },
  ],
};
