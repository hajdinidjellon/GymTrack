import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

// ─── Palette ──────────────────────────────────────────────────────────
const COLORS = {
  cyan:             '#5DDEFF',
  cyanFill08:       'rgba(0,200,255,0.08)',
  cyanFill05:       'rgba(0,200,255,0.05)',
  cyanBorderStrong: 'rgba(93,222,255,0.35)',
  cyanBorderMed:    'rgba(93,222,255,0.25)',
  cyanBorderLight:  'rgba(93,222,255,0.18)',
  cyanDivider:      'rgba(93,222,255,0.08)',
  cardBgTop:        'rgba(11,26,48,0.85)',
  cardBgBottom:     'rgba(5,13,27,0.92)',
  listBg:           'rgba(0,200,255,0.025)',
  whiteHi:    '#fff',
  whiteMid:   'rgba(255,255,255,0.92)',
  whiteLo:    'rgba(255,255,255,0.55)',
  whiteFaint: 'rgba(255,255,255,0.42)',
} as const;

const FONT = {
  regular:  'Rajdhani_400Regular',
  medium:   'Rajdhani_500Medium',
  semibold: 'Rajdhani_600SemiBold',
  bold:     'Rajdhani_700Bold',
} as const;

// ─── Types ────────────────────────────────────────────────────────────
export type RecentSession = {
  id: string;
  type: 'push' | 'pull' | 'legs' | string;
  label: string;
  when: string;
  duration: string;
};

export interface RecentSessionsCardProps {
  title?: string;
  actionLabel?: string;
  sessions: RecentSession[];
  onSeeAll?: () => void;
  onSelect?: (session: RecentSession) => void;
}

// ─── Octagonal frame primitives ───────────────────────────────────────
function OctagonIcon({ size = 24, chamfer = 6, type }: {
  size?: number;
  chamfer?: number;
  type: RecentSession['type'];
}) {
  const c = chamfer;
  const s = size;
  const path = `M ${c} 0 H ${s - c} L ${s} ${c} V ${s - c} L ${s - c} ${s} H ${c} L 0 ${s - c} V ${c} Z`;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={s} height={s} style={StyleSheet.absoluteFill}>
        <Path
          d={path}
          fill={COLORS.cyanFill08}
          stroke={COLORS.cyanBorderStrong}
          strokeWidth={1}
        />
      </Svg>
      <InnerSessionGlyph type={type} />
    </View>
  );
}

function InnerSessionGlyph({ type }: { type: RecentSession['type'] }) {
  if (type === 'legs') {
    return (
      <Svg width={12} height={12} viewBox="0 0 12 12">
        <Path d="M 1 1 L 11 11" stroke={COLORS.cyan} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M 11 1 L 1 11" stroke={COLORS.cyan} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }
  // push / pull / other → horizontal dumbbell (15×10)
  return (
    <Svg width={15} height={10} viewBox="0 0 15 10">
      <Path d="M 4 5 H 11"  stroke={COLORS.cyan} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M 2 2 V 8"   stroke={COLORS.cyan} strokeWidth={2}   strokeLinecap="round" />
      <Path d="M 0.5 3 V 7" stroke={COLORS.cyan} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M 13 2 V 8"  stroke={COLORS.cyan} strokeWidth={2}   strokeLinecap="round" />
      <Path d="M 14.5 3 V 7" stroke={COLORS.cyan} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

function ChevronBox({ size = 18, chamfer = 4 }: { size?: number; chamfer?: number }) {
  const c = chamfer;
  const s = size;
  const path = `M ${c} 0 H ${s - c} L ${s} ${c} V ${s - c} L ${s - c} ${s} H ${c} L 0 ${s - c} V ${c} Z`;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={s} height={s} style={StyleSheet.absoluteFill}>
        <Path
          d={path}
          fill={COLORS.cyanFill05}
          stroke={COLORS.cyanBorderMed}
          strokeWidth={1}
        />
      </Svg>
      <Text
        style={{
          fontFamily: FONT.semibold,
          fontSize: 11,
          color: COLORS.cyan,
          lineHeight: 11,
          includeFontPadding: false,
          marginTop: -1,
        }}
      >
        ›
      </Text>
    </View>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────
//
// ONE horizontal line, 5 columns:
//   [icon 24] [label 48] [when flex:1] [duration auto] [chevron 18]
//
// Parent is hard-locked to flexDirection: 'row'. Each column lives in its own
// fixed-width View so widths can never collapse into a vertical stack.
function SessionRow({
  session, onPress, isLast,
}: {
  session: RecentSession;
  onPress?: () => void;
  isLast: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          opacity: pressed ? 0.7 : 1,
        },
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: COLORS.cyanDivider,
        },
      ]}
    >
      {/* col 1 — icon (width 24) */}
      <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
        <OctagonIcon type={session.type} size={24} chamfer={6} />
      </View>

      {/* col 2 — label (width 48) */}
      <View style={{ width: 48, marginLeft: 12, justifyContent: 'center' }}>
        <Text style={styles.label} numberOfLines={1}>{session.label}</Text>
      </View>

      {/* col 3 — "Il y a X jours" (flex: 1, pushes the right cluster) */}
      <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
        <Text style={styles.when} numberOfLines={1}>{session.when}</Text>
      </View>

      {/* col 4 — duration (auto) */}
      <Text
        style={[styles.duration, { marginLeft: 12 }]}
        numberOfLines={1}
      >
        {session.duration}
      </Text>

      {/* col 5 — chevron (width 18) */}
      <View style={{ width: 18, height: 18, marginLeft: 12, alignItems: 'center', justifyContent: 'center' }}>
        <ChevronBox size={18} chamfer={4} />
      </View>
    </Pressable>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────
export function RecentSessionsCard({
  title = 'SÉANCES RÉCENTES',
  actionLabel = 'VOIR TOUT',
  sessions,
  onSeeAll,
  onSelect,
}: RecentSessionsCardProps) {
  return (
    <View style={styles.cardShadow}>
      <LinearGradient
        colors={[COLORS.cardBgTop, COLORS.cardBgBottom]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={styles.card}
      >
        {/* Inner-top highlight (1px inset white .03) */}
        <View pointerEvents="none" style={styles.cardHighlight} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Pressable onPress={onSeeAll} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.headerAction}>{actionLabel}</Text>
            <Text style={styles.headerArrow}> →</Text>
          </Pressable>
        </View>

        {/* Inner list (2nd frame) */}
        <View style={styles.list}>
          {sessions.map((s, i) => (
            <SessionRow
              key={s.id}
              session={s}
              isLast={i === sessions.length - 1}
              onPress={() => onSelect?.(s)}
            />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  cardShadow: {
    marginHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.7,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cyanBorderLight,
    paddingHorizontal: 13,
    paddingTop: 11,
    paddingBottom: 3,
    overflow: 'hidden',
  },
  cardHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontFamily: FONT.semibold,
    fontSize: 10.5,
    letterSpacing: 1.8,
    color: COLORS.whiteMid,
    textTransform: 'uppercase',
  },
  headerAction: {
    fontFamily: FONT.semibold,
    fontSize: 9.5,
    letterSpacing: 1.4,
    color: COLORS.whiteFaint,
    textTransform: 'uppercase',
  },
  headerArrow: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    color: COLORS.whiteLo,
    marginLeft: 2,
  },

  list: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cyanBorderLight,
    backgroundColor: COLORS.listBg,
    paddingHorizontal: 11,
  },

  label: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    letterSpacing: 0.7,
    color: COLORS.whiteHi,
  },
  when: {
    fontFamily: FONT.regular,
    fontSize: 10.5,
    color: COLORS.whiteFaint,
  },
  duration: {
    fontFamily: FONT.semibold,
    fontSize: 10.5,
    letterSpacing: 0.9,
    color: COLORS.whiteHi,
  },
});

export default RecentSessionsCard;
