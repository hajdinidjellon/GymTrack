import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle, Defs, RadialGradient, LinearGradient as SvgLinear, Stop } from 'react-native-svg';
import { BadgeImage } from './BadgeImage';
import type { Rank } from '@/types';

const CYAN = '#17B8FF';
const N    = 28;

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg - 90) * (Math.PI / 180);
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcSeg(cx: number, cy: number, R: number, ri: number, a0: number, a1: number): string {
  const f = (n: number) => n.toFixed(3);
  const [ox0, oy0] = polar(cx, cy, R,  a0);
  const [ox1, oy1] = polar(cx, cy, R,  a1);
  const [ix0, iy0] = polar(cx, cy, ri, a0);
  const [ix1, iy1] = polar(cx, cy, ri, a1);
  return `M${f(ox0)} ${f(oy0)} A${R} ${R} 0 0 1 ${f(ox1)} ${f(oy1)} L${f(ix1)} ${f(iy1)} A${ri} ${ri} 0 0 0 ${f(ix0)} ${f(iy0)}Z`;
}

interface Props { rank: Rank; totalXp: number; size?: number; }

export function XpRing({ rank, totalXp, size = 124 }: Props) {
  const progress = rank.maxXP === Infinity
    ? 1 : Math.max(0, Math.min(1, (totalXp - rank.minXP) / (rank.maxXP - rank.minXP)));
  const targetFilled = Math.round(progress * N);

  const animVal  = useRef(new Animated.Value(targetFilled)).current;
  const flashVal = useRef(new Animated.Value(0)).current;
  const [displayFilled, setDisplayFilled] = useState(targetFilled);
  const prevRankKey = useRef(`${rank.tier}-${rank.level}`);

  useEffect(() => {
    const id = animVal.addListener(({ value }) => setDisplayFilled(Math.round(value)));
    return () => animVal.removeListener(id);
  }, [animVal]);

  useEffect(() => {
    const key = `${rank.tier}-${rank.level}`;
    const isRankUp = key !== prevRankKey.current;
    prevRankKey.current = key;
    if (isRankUp) {
      Animated.timing(animVal, { toValue: N, duration: 450, useNativeDriver: false }).start(() => {
        Animated.sequence([
          Animated.timing(flashVal, { toValue: 1, duration: 180, useNativeDriver: false }),
          Animated.timing(flashVal, { toValue: 0, duration: 500, useNativeDriver: false }),
        ]).start();
        setTimeout(() => {
          animVal.setValue(0);
          Animated.timing(animVal, { toValue: targetFilled, duration: 900, useNativeDriver: false }).start();
        }, 280);
      });
    } else {
      Animated.timing(animVal, { toValue: targetFilled, duration: 700, useNativeDriver: false }).start();
    }
  }, [targetFilled, rank.tier, rank.level]);

  // ── Geometry ────────────────────────────────────────────────────────────
  const cx     = size / 2;
  const cy     = size / 2;
  const R_out  = size * 0.462;   // rayon extérieur des segments
  const R_in   = size * 0.360;   // rayon intérieur
  const R_mid  = (R_out + R_in) / 2;
  const step   = 360 / N;
  const gap    = 2.8;            // degrés de gap angulaire → espacement symétrique
  const arc    = step - gap;

  // ── XP label ─────────────────────────────────────────────────────────────
  const currentInRank = Math.max(0, totalXp - rank.minXP);
  const rangeXp = rank.maxXP === Infinity ? '∞' : String(rank.maxXP - rank.minXP);
  const pct = Math.round(progress * 100);

  return (
    <View style={{ width: size, height: size + 22, alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Defs>

            {/* Fond verre sombre de l'anneau complet */}
            <RadialGradient id="ringBg" cx="50%" cy="50%" r="50%">
              <Stop offset="0.55" stopColor="#0A1828" stopOpacity={0} />
              <Stop offset="0.78" stopColor="#061018" stopOpacity={0.92} />
              <Stop offset="1"    stopColor="#020810" stopOpacity={1}    />
            </RadialGradient>

            {/* Segment rempli — dégradé radial plus intense */}
            <RadialGradient id="segFill"
              cx={`${cx}px`} cy={`${cy}px`} r={`${R_mid * 1.2}px`}
              fx={`${cx}px`} fy={`${cy}px`}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0"    stopColor="#AAFFFF" stopOpacity={1}    />
              <Stop offset="0.40" stopColor="#00D4FF" stopOpacity={1}    />
              <Stop offset="1"    stopColor="#0055BB" stopOpacity={1}    />
            </RadialGradient>

            {/* Segment vide — verre sombre */}
            <RadialGradient id="segEmpty"
              cx={`${cx}px`} cy={`${cy}px`} r={`${R_mid * 1.2}px`}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0"  stopColor="#0E2240" stopOpacity={0.9} />
              <Stop offset="1"  stopColor="#050E1C" stopOpacity={1}   />
            </RadialGradient>

            {/* Shine — reflet blanc sur le bord intérieur des segments */}
            <SvgLinear id="shine" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0"   stopColor="#FFFFFF" stopOpacity={0.35} />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0}    />
            </SvgLinear>

            {/* Last segment — éclat maximum */}
            <RadialGradient id="segLast"
              cx={`${cx}px`} cy={`${cy}px`} r={`${R_mid * 1.1}px`}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0"    stopColor="#FFFFFF" stopOpacity={0.9} />
              <Stop offset="0.35" stopColor="#A0F0FF" stopOpacity={1}   />
              <Stop offset="1"    stopColor="#0077CC" stopOpacity={1}   />
            </RadialGradient>

          </Defs>

          {/* ── Fond verre de l'anneau ── */}
          <Circle
            cx={cx} cy={cy}
            r={(R_out + R_in) / 2}
            fill="none"
            stroke="url(#ringBg)"
            strokeWidth={R_out - R_in + 2}
          />

          {/* ── Lueur ambiante cyan ── */}
          {displayFilled > 0 && (
            <Circle
              cx={cx} cy={cy}
              r={(R_out + R_in) / 2}
              fill="none"
              stroke={CYAN}
              strokeWidth={R_out - R_in + 6}
              strokeOpacity={0.06 + 0.06 * (displayFilled / N)}
            />
          )}

          {/* ── Segments ── */}
          {Array.from({ length: N }, (_, i) => {
            const filled   = i < displayFilled;
            const isLast   = filled && i === displayFilled - 1;
            const a0       = i * step + gap / 2;
            const a1       = a0 + arc;
            const aMid     = (a0 + a1) / 2;
            const angleRad = (aMid - 90) * (Math.PI / 180);
            const lightFactor = 0.75 + 0.25 * Math.cos(angleRad);

            const d      = arcSeg(cx, cy, R_out, R_in, a0, a1);
            const dShine = arcSeg(cx, cy, R_out, R_out - (R_out - R_in) * 0.42, a0, a1);

            return (
              <React.Fragment key={i}>
                <Path
                  d={d}
                  fill={isLast ? 'url(#segLast)' : filled ? 'url(#segFill)' : 'url(#segEmpty)'}
                  stroke={
                    isLast ? 'rgba(200,245,255,0.95)' :
                    filled ? `rgba(23,184,255,${(0.50 * lightFactor).toFixed(2)})` :
                    'rgba(23,184,255,0.14)'
                  }
                  strokeWidth={isLast ? 1.2 : filled ? 0.8 : 0.4}
                  opacity={filled ? 0.88 + 0.12 * lightFactor : 0.85}
                />
                {filled && (
                  <Path d={dShine} fill="url(#shine)" opacity={lightFactor * 0.80} />
                )}
              </React.Fragment>
            );
          })}

          {/* ── Bordure extérieure fine de l'anneau — style verre ── */}
          <Circle cx={cx} cy={cy} r={R_out + 1} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.8} />
          <Circle cx={cx} cy={cy} r={R_in  - 1} fill="none" stroke="rgba(23,184,255,0.12)"  strokeWidth={0.8} />

        </Svg>

        {/* ── Flash rank-up ── */}
        <Animated.View
          pointerEvents="none"
          style={{ ...StyleSheet.absoluteFillObject, borderRadius: size / 2, backgroundColor: CYAN, opacity: flashVal }}
        />

        {/* ── Centre: badge ── */}
        <View style={styles.center}>
          <BadgeImage tier={rank.tier} size={Math.round(size * 0.84)} />
        </View>
      </View>

      {/* ── XP sous l'anneau ── */}
      <Text style={styles.xpLabel}>{currentInRank} / {rangeXp} XP · {pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  xpLabel: {
    fontFamily: 'Rajdhani-SemiBold', fontSize: 9.5, color: CYAN,
    letterSpacing: 1.1, marginTop: 5, opacity: 0.80,
  },
});
