import React from 'react';
import { View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { catalogKeyOf } from '@/domain/catalog/muscles';
import { border, colors, hardShadow } from '@/constants/theme';
import { t } from '@/i18n';
import { VIDEO_SOURCES } from './videoSources';

/** The video of an exercise (its stored name); nothing for one without a video. */
export const videoFor = (name: string): number | undefined => {
  const key = catalogKeyOf(name);
  return key ? VIDEO_SOURCES[key] : undefined;
};

interface Props {
  source: number;
  /** Inside the popup: thinner outline, no shadow. */
  inset?: boolean;
}

/** The movement, square, looping without sound. The worked muscles glow on the mascot. */
export function ExerciseVideo({ source, inset }: Props) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View
      style={{
        aspectRatio: 1,
        width: '100%',
        borderRadius: inset ? 14 : 20,
        borderCurve: 'continuous',
        borderWidth: inset ? border.base : border.strong,
        borderColor: colors.frame,
        // The studio's own dark background, in both modes
        backgroundColor: '#0B0D11',
        overflow: 'hidden',
        ...(inset ? {} : hardShadow(5)),
      }}
    >
      <VideoView
        player={player}
        style={{ flex: 1 }}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
        accessible
        accessibilityLabel={t('exercise.video.a11y')}
      />
    </View>
  );
}
