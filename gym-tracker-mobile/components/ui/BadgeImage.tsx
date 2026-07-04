import React from 'react';
import { View, Image } from 'react-native';

const RANK_IMAGE = require('@/assets/rank.png') as number;
const RANK_IMG_W = 1408;
const RANK_IMG_H = 768;

const BADGE_CROPS: Record<string, { x: number; y: number; w: number; h: number }> = {
  bronze:   { x: 36,   y: 254, w: 242, h: 250 },
  silver:   { x: 279,  y: 253, w: 195, h: 249 },
  gold:     { x: 495,  y: 250, w: 199, h: 254 },
  platinum: { x: 715,  y: 252, w: 197, h: 250 },
  diamond:  { x: 928,  y: 254, w: 205, h: 249 },
  legend:   { x: 1133, y: 220, w: 242, h: 290 },
};

export function BadgeImage({ tier, size }: { tier: string; size: number }) {
  const crop = BADGE_CROPS[tier] ?? BADGE_CROPS.bronze!;
  const scale = size / crop.h;
  return (
    <View style={{ width: crop.w * scale, height: size, overflow: 'hidden' }}>
      <Image
        source={RANK_IMAGE}
        style={{
          width:      RANK_IMG_W * scale,
          height:     RANK_IMG_H * scale,
          marginLeft: -crop.x * scale,
          marginTop:  -crop.y * scale,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}
