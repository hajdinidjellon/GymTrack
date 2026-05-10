/**
 * MANNEQUIN MUSCULAIRE — react-native-svg (compatible Expo Go)
 * Fond : FullBody.svg / FullBodyBack.svg via SvgXml
 * Overlay : paths musculaires colorés selon heatmap
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Svg, { Path, G, SvgXml } from 'react-native-svg';
import { getMuscleHeatColor } from '@/constants/theme';
import { MUSCLE_LABELS } from '@/lib/gamification';
import type { MuscleGroup } from '@/types';

// ViewBox commun à tous les SVGs sources (0 0 402 874)
const VB_W = 402;
const VB_H = 874;

// ── Paths musculaires réels ────────────────────────────────────

const FRONT_PATHS: Record<MuscleGroup, string | null> = {
  chest:
    'M116.5 226L121 238.5L129 251L140 260.5L163 265.5L185 260.5L196 254.5L202 247.5V238.5V216V202V192.5L198 187.5L194 184.5L186.5 183L170 179.5L161 179H151L140 184.5L132 197L125.5 208L116.5 219V226Z ' +
    'M208 196V212L210 213L208 217.5V246.5L218 254.5L234.5 263L260 265.5L278.5 254.5L289.5 238.5L296.5 223.5L269.5 185L260 178.5L225.5 181.5L214 185L208 196Z',
  shoulders:
    'M91 238.5L83.5 247L78.5 237L77 228.5V216.5L80 204L83.5 195L91 183.5L99 177.5L112.5 171L128 169.5L134.5 171L137 174L142.5 177.5V183.5L137 191.5L130 199.5L121.5 212L115 220.5L105 228.5L96.5 232.5L91 238.5Z ' +
    'M295.5 223L266 178L279 170.5H295.5L312.5 176.5L324.5 187L332 204.5L334.5 234L327 246.5L314 234L295.5 223Z ' +
    'M145 160L133.5 167.5L135.5 170L145 172.5H158.5L167 176H191L185.5 167.5L177.5 162L175 156V143.5L165 150.5L155 156L145 160Z',
  arms:
    'M105 229H115.5L119 237.5L123 245.5V253V267L119 278.5L115.5 289.5L112.5 300.5L108.5 306L108 313L101.5 316.5L96 322H90.5L82.5V315.5L78 308L75.5 300.5L73 289.5V282L75.5 271.5L78 260L82.5 248L91.5 237.5L99.5 232.5L105 229Z ' +
    'M304 230H294L286.5 244.5L287.5 253.5V265.5L291.5 279.5L294 293.5L304 310L309 320L317 323.5H322.5L328 320V314L333.5 305.5L335.5 289V265.5L328 246.5L317 235L304 230Z ' +
    'M50.5 323.5L63 300.5H66.5L69.5 310.5L74.5 329L80 335.5L90.5 323.5H100V335.5V349L96.5 367.5L90.5 378.5L80 392.5L74.5 404.5L66.5 410.5L59.5 404.5L57 378.5L50.5 360V323.5Z ' +
    'M309.5 339V322.5L318.5 329L326.5 336L331 341.5V339L334 325L340.5 313L347 301L349.5 305L356 313L359 325V339V359L356 374L352.5 389.5L343.5 393V410.5L338 418V410.5L334 398.5L326.5 387L318.5 374L314 362L309.5 351V339Z',
  core:
    'M167 275L170.5 271.5L176.5 268L184.5 265.5L191 263.5H196L201 265.5L202.5 271.5V280.5V287.5V293L201 297H196L201 300L202.5 303V310.5V319.5V328L201 333.5L197 334.5H173L169 339L167 345.5V352L169 362.5L173 377.5L176.5 391.5L181 402L186.5 419L191 425.5H219L222 421L226 410.5L229 400L232.5 391.5L236.5 380L238.5 370.5L241 359V347V339L236.5 334.5H234L238.5 330L241 325.5V321L242.5 317V312.5L241 306.5L238.5 303L236.5 300L238.5 297L242.5 293V289L244 282.5L242.5 275L241 273L232.5 268L226 265.5L219 263.5H213L211 265.5L208 268L206 273V282.5V289L208 293L211 297L208 300L206 303V315V319.5V325.5L208 330L211 334.5H234',
  legs:
    'M136 409L145.5 388H148L152 397.5V414L161 445L164.5 458L169 471L177.5 492L184 517V538.5V555L180 573L175.5 582L169 587H161L152 573L148 563.5V552H145.5V557L142 568L132 582L127 573L121.5 557L116 538.5L114 512.5L116 485.5L121.5 454.5L129 427L136 409Z ' +
    'M273 412L265.5 388H259V405L256.5 422L252 435.5L247 453.5L238.5 474.5L233.5 486L230 505L224.5 521.5V546V556.5L227.5 563L230 573L233.5 582.5L238.5 586.5L243 588.5L247 586.5L252 577.5L256.5 573L261 563V549.5L265.5 561L269.5 573L273 577.5L277.5 582.5L280.5 577.5L283.5 568.5L288 549.5L292 530.5L294 501.5L292 474.5L288 453.5L280.5 428.5L273 412Z',
  calves:
    'M152 590L148 608L145.5 625L143 645L142 665L144 685L149 700L158 706L166 700L172 685L173 665L170 645L165 625L161 608L157 593Z ' +
    'M244 590L247 608L250 625L254 645L254 665L251 685L245 700L237 706L229 700L224 685L223 665L226 645L231 625L237 608L241 593Z',
  glutes: null,
  back: null,
};

const BACK_PATHS: Record<MuscleGroup, string | null> = {
  back:
    'M115.5 263.5V250L122 255.5L127 257.5L139 260L148 257.5L159 252.5L166 247.5L168.5 250L175 257.5L178 263.5L182 272L191 286L188.5 292L186 299.5L182 306.5L178 313.5L175 319.5L172.5 327L168.5 332L166 337L163.5 344L159 348L156.5 344L151 337L139 319.5L132 311L122 292L117.5 278.5L115.5 263.5Z ' +
    'M216.5 284.5L222.5 275L228 265L237 254.5L240 247.5L253.5 256.5L265.5 259.5H274.5L282.5 254.5L290.5 247.5V256.5V268.5L288.5 279L282.5 292L274.5 310L268 318.5L260.5 329L253.5 338L248 345.5L245 349L240 342.5L237 332L232.5 324.5L228 315L225 310L222.5 301.5L220 295L216.5 290V286.5 ' +
    'M168.5 334.5L160.5 348L164 355L168.5 362L175 373L178 381.5L187 390L195 401.5L200 409V368.5V348V326V316V305L198 297.5L191.5 285.5L189 293L184.5 305L175 321L168.5 334.5Z',
  glutes:
    'M155.5 478.5L132 469.5L128.5 466L126 455V433L128.5 421.5L132 413.5L139 401L145.5 389.5L155.5 380L165.5 376.5L177 384L190.5 395L200.5 410.5V443V463.5L194 469.5L177 478.5H155.5Z ' +
    'M213 470.5L203.5 459V423.5V414.5L208 403L213 395L224.5 385L232 379L241.5 376L251 381L254.5 385L266 401L273.5 414.5L279 427.5V454.5L277 461.5L268.5 470.5L251 478L227 475.5L213 470.5Z',
  shoulders:
    'M77.5 229V241.5L87 235L91.5 229L102 220.5L110 213L122.5 202.5L131.5 194L135.5 189.5V186.5L131.5 180.5L122.5 176L110 180.5L102 184.5L94 192L84 202.5L80.5 213L77.5 220.5V229Z ' +
    'M273.5 183.5L271.5 190.5L277 194L283 200L288 206L296.5 213L302.5 218.5L310 225L317.5 233L322 237.5L328.5 241V222.5L325 210.5L317.5 196.5L310 187.5L299.5 182L288 177.5H283L277 179.5L273.5 183.5Z ' +
    'M176.5 133.5L180 119H199V130.5L196.5 137L194 143.5L190 151L183.5 159.5L176.5 163.5L182 167L190 173.5L195 181.5L199 200L201.5 254.5L199 272V299L190 283.5L180 265.5L169 250L155.5 222L145.5 203L133 183L120 175.5L130.5 167L157.5 154L173.5 141L176.5 133.5Z ' +
    'M209 130.5V120L229.5 118V120L231 130.5L233.5 137.5L244.5 149L263.5 159L280.5 170L287.5 175.5L280.5 178.5L272.5 186.5L267 195.5L259 212.5L251.5 228.5L241 247.5L223 273L216.5 284L205.5 303.5L207 294.5L205.5 258.5V203L211 186.5L216.5 175.5L223 168.5L229.5 164L220.5 156L214.5 145.5L209 130.5Z',
  arms:
    'M62.5 289.5L66.5 296.5L69 286.5L73 280.5L77.5 275.5L81 273L85 268.5L87.5 301L85 332L92.5 325L98 318L105.5 305.5L110.5 293.5L113.5 282L115 265.5L113.5 254L110.5 237.5L108.5 228L105.5 229.5L98 232.5L85 237.5L77.5 243L71 249.5L66.5 260L62.5 268.5V289.5Z ' +
    'M293 243.5L299 229H302.5L309 232L318 234.5L323.5 238.5L330 243.5L335.5 251.5L339 258L342.5 267.5V288L339 296.5L337.5 292.5V288L335.5 282.5L328 276L319.5 270.5V300V308.5L321.5 336L299 308.5L293 292.5L290.5 267.5V258L293 243.5Z',
  legs:
    'M163.5 625L169.5 607L173.5 592L178.5 573.5L181.5 558.5L180 554V539L181.5 524.5L185.5 512.5V483V474.5L173.5 479H153L139 493L130 508.5L127 527.5L123 539V554V580.5L118 589V614.5L123 611L130 600L136.5 589L148 577V586.5L153 600L156.5 611L163.5 627 ' +
    'M263.5 491.5L251 480L234 477.5L217.5 474V491.5V524L224 551L231 577L228 583.5L231 591.5V600L236.5 615L242 624.5L247 604L251 591.5L255.5 577L268 591.5L276 604L284 615V583.5L280 581V543L278 524L271.5 504.5L263.5 491.5Z',
  calves:
    'M104.5 685.5L103 671V657.5L104.5 647.5L109.5 635L115 624L119 617L127.5 603L132 598L138 599.5L140.5 603L142 608V613.5L145.5 608L149 603L152.5 601L154.5 608L161 624L165.5 636.5L170 659L171.5 677L168.5 693.5L163 704L154.5 709L149 706.5L145.5 701L140.5 693.5L138 685.5V682L133.5 693.5L127.5 699L118 705L113 702.5L109.5 699L104.5 691V687 ' +
    'M245 616L250.5 601L254 604L256.5 608L259 616V606.5L264 599.5L270 598L281 613L293.5 634L298.5 652L300 673L295.5 696L290.5 701.5L281 703.5L275.5 701.5L270 696L264 681.5L259 696L252.5 705.5L245 708.5L235.5 701.5L232 679V660L235.5 644.5L241 628L245 616Z',
  chest: null,
  core: null,
};

const HIT_ZONES_FRONT: Array<{ muscle: MuscleGroup; x: [number, number]; y: [number, number] }> = [
  { muscle: 'chest',     x: [115, 300], y: [175, 270] },
  { muscle: 'shoulders', x: [70,  340], y: [130, 250] },
  { muscle: 'arms',      x: [45,  370], y: [225, 420] },
  { muscle: 'core',      x: [130, 280], y: [263, 430] },
  { muscle: 'legs',      x: [110, 300], y: [385, 595] },
  { muscle: 'calves',    x: [120, 285], y: [590, 720] },
];

const HIT_ZONES_BACK: Array<{ muscle: MuscleGroup; x: [number, number]; y: [number, number] }> = [
  { muscle: 'back',      x: [115, 295], y: [245, 360] },
  { muscle: 'glutes',    x: [120, 285], y: [375, 485] },
  { muscle: 'shoulders', x: [70,  335], y: [118, 250] },
  { muscle: 'arms',      x: [55,  350], y: [225, 345] },
  { muscle: 'legs',      x: [115, 295], y: [465, 630] },
  { muscle: 'calves',    x: [100, 305], y: [595, 725] },
];

// Silhouette corps simplifiée (SVG paths)
const BODY_SVG_FRONT = `
<svg viewBox="0 0 402 874" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="201" cy="75" rx="42" ry="52" fill="rgba(255,255,255,0.07)"/>
  <rect x="183" y="120" width="36" height="22" fill="rgba(255,255,255,0.07)"/>
  <path d="M130 142 L272 142 L285 410 L201 425 L117 410 Z" fill="rgba(255,255,255,0.07)"/>
  <path d="M130 142 C95 148 60 185 52 250 C44 315 58 375 78 405 C98 435 120 425 130 410 L145 320 L155 200 Z" fill="rgba(255,255,255,0.07)"/>
  <path d="M272 142 C307 148 342 185 350 250 C358 315 344 375 324 405 C304 435 282 425 272 410 L257 320 L247 200 Z" fill="rgba(255,255,255,0.07)"/>
  <path d="M155 415 L201 425 L247 415 L258 585 L246 725 L201 735 L156 725 L144 585 Z" fill="rgba(255,255,255,0.07)"/>
</svg>`;

const BODY_SVG_BACK = `
<svg viewBox="0 0 402 874" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="201" cy="75" rx="42" ry="52" fill="rgba(255,255,255,0.07)"/>
  <rect x="183" y="120" width="36" height="22" fill="rgba(255,255,255,0.07)"/>
  <path d="M130 142 L272 142 L285 410 L201 425 L117 410 Z" fill="rgba(255,255,255,0.07)"/>
  <path d="M130 142 C95 148 60 185 52 250 C44 315 58 375 78 405 C98 435 120 425 130 410 L145 320 L155 200 Z" fill="rgba(255,255,255,0.07)"/>
  <path d="M272 142 C307 148 342 185 350 250 C358 315 344 375 324 405 C304 435 282 425 272 410 L257 320 L247 200 Z" fill="rgba(255,255,255,0.07)"/>
  <path d="M155 415 L201 425 L247 415 L258 585 L246 725 L201 735 L156 725 L144 585 Z" fill="rgba(255,255,255,0.07)"/>
</svg>`;

// ── Composant principal ───────────────────────────────────────

interface MuscleMapSVGProps {
  muscleActivity: Record<MuscleGroup, number>;
  onMusclePress?: (muscle: MuscleGroup) => void;
  selectedMuscle?: MuscleGroup | null;
  view?: 'front' | 'back' | 'both';
  width?: number;
  showLegend?: boolean;
}

export function MuscleMapSVG({
  muscleActivity,
  onMusclePress,
  selectedMuscle,
  view = 'both',
  width = 160,
  showLegend = false,
}: MuscleMapSVGProps) {
  const height = (width / VB_W) * VB_H;

  const handlePress = useCallback(
    (
      e: { nativeEvent: { locationX: number; locationY: number } },
      zones: typeof HIT_ZONES_FRONT,
      paths: Record<MuscleGroup, string | null>,
      w: number,
    ) => {
      if (!onMusclePress) return;
      const scaleX = VB_W / w;
      const scaleY = VB_H / height;
      const x = e.nativeEvent.locationX * scaleX;
      const y = e.nativeEvent.locationY * scaleY;
      for (const z of zones) {
        if (paths[z.muscle] === null) continue;
        if (x >= z.x[0] && x <= z.x[1] && y >= z.y[0] && y <= z.y[1]) {
          onMusclePress(z.muscle);
          return;
        }
      }
    },
    [onMusclePress, height],
  );

  const renderSide = (side: 'front' | 'back', w: number) => {
    const paths = side === 'front' ? FRONT_PATHS : BACK_PATHS;
    const zones = side === 'front' ? HIT_ZONES_FRONT : HIT_ZONES_BACK;
    const bodySvg = side === 'front' ? BODY_SVG_FRONT : BODY_SVG_BACK;
    const h = (w / VB_W) * VB_H;

    return (
      <Pressable key={side} onPress={(e) => handlePress(e, zones, paths, w)}>
        <View style={{ width: w, height: h }}>
          {/* Corps de base */}
          <SvgXml xml={bodySvg} width={w} height={h} style={{ position: 'absolute' }} />
          {/* Overlay musculaire */}
          <Svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            width={w}
            height={h}
            style={{ position: 'absolute' }}
          >
            {(Object.entries(paths) as Array<[MuscleGroup, string | null]>).map(([muscle, path]) => {
              if (!path) return null;
              const intensity = muscleActivity[muscle] ?? 0;
              const color = getMuscleHeatColor(intensity);
              const isSelected = selectedMuscle === muscle;
              return (
                <G key={`${side}-${muscle}`}>
                  <Path d={path} fill={color} opacity={intensity > 0 ? 0.85 : 0} />
                  {isSelected && (
                    <Path d={path} fill="none" stroke="white" strokeWidth={2} opacity={0.9} />
                  )}
                </G>
              );
            })}
          </Svg>
        </View>
      </Pressable>
    );
  };

  if (view === 'both') {
    return (
      <View>
        <View className="flex-row gap-3 items-start justify-center">
          {renderSide('front', width)}
          {renderSide('back', width)}
        </View>
        {showLegend && <MuscleHeatLegend />}
      </View>
    );
  }

  return (
    <View>
      {renderSide(view, width * 1.4)}
      {showLegend && <MuscleHeatLegend />}
    </View>
  );
}

function MuscleHeatLegend() {
  const steps = [
    { label: 'Aucun',  color: 'rgba(255,255,255,0.07)' },
    { label: 'Faible', color: 'rgba(147,197,253,0.6)'  },
    { label: 'Moyen',  color: 'rgba(251,191,36,0.75)'  },
    { label: 'Élevé',  color: 'rgba(249,115,22,0.85)'  },
    { label: 'Max',    color: 'rgba(239,68,68,0.95)'   },
  ];
  return (
    <View className="flex-row items-center justify-center gap-3 mt-2 flex-wrap">
      {steps.map((s) => (
        <View key={s.label} className="flex-row items-center gap-1">
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: s.color }} />
          <Text className="text-xs text-text-muted">{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

interface MuscleHeatmapListProps {
  muscleActivity: Record<MuscleGroup, number>;
  onMusclePress?: (muscle: MuscleGroup) => void;
  selectedMuscle?: MuscleGroup | null;
}

export function MuscleHeatmapList({ muscleActivity, onMusclePress, selectedMuscle }: MuscleHeatmapListProps) {
  const muscles = Object.keys(muscleActivity) as MuscleGroup[];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-1">
      {muscles.map((muscle) => {
        const intensity  = muscleActivity[muscle] ?? 0;
        const color      = getMuscleHeatColor(intensity);
        const isSelected = selectedMuscle === muscle;
        return (
          <Pressable
            key={muscle}
            onPress={() => onMusclePress?.(muscle)}
            className={`items-center gap-1.5 px-3 py-2 rounded-xl ${isSelected ? 'bg-white/15' : 'bg-white/[0.04]'}`}
          >
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: color, borderWidth: 1, borderColor: isSelected ? 'white' : 'transparent' }} />
            <Text className="text-xs text-text-secondary">{MUSCLE_LABELS[muscle]}</Text>
            <Text className="text-xs font-semibold text-text-primary">{intensity}%</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
