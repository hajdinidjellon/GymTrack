import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { border, colors, hardShadow, pressOffset, radius, space } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { exerciseName, t } from '@/i18n';
import { ExerciseVideo } from './ExerciseVideo';

const SIZE = 104;

/**
 * In the logger, top right of the exercise: its video, small and looping, so it is seen at once.
 * A tap opens it big from the bottom; any tap outside, the ✕ or the button closes it.
 */
export function DemoThumb({ name, source }: { name: string; source: number }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const close = () => setOpen(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('exercise.video.thumbA11y', { name: exerciseName(name) })}
        style={({ pressed }) => ({
          width: SIZE,
          borderRadius: radius.row,
          borderCurve: 'continuous',
          borderWidth: border.strong,
          borderColor: colors.outline,
          backgroundColor: colors.card,
          overflow: 'hidden',
          ...(pressed ? {} : hardShadow(4)),
          transform: pressed
            ? [{ translateX: pressOffset(4).translateX }, { translateY: pressOffset(4).translateY }]
            : [],
        })}
      >
        <View pointerEvents="none" style={{ height: SIZE - 18, backgroundColor: '#0B0D11' }}>
          <VideoView
            player={player}
            style={{ flex: 1 }}
            contentFit="cover"
            nativeControls={false}
            allowsPictureInPicture={false}
          />
        </View>
        <View
          style={{
            height: 26,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            backgroundColor: colors.sun,
            borderTopWidth: border.base,
            borderTopColor: colors.outline,
          }}
        >
          <Text size={10} weight="black" color={colors.onSun}>
            ▶
          </Text>
          <Text size={13} weight="black" color={colors.onSun}>
            {t('exercise.video.thumb')}
          </Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <Pressable
          onPress={close}
          accessibilityLabel={t('exercise.video.close')}
          style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
        >
          {/* The sheet itself: a tap on it does not close it */}
          <Pressable
            onPress={() => null}
            accessible={false}
            style={{
              backgroundColor: colors.paper,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderWidth: border.strong,
              borderBottomWidth: 0,
              borderColor: colors.frame,
              paddingHorizontal: space.gutter,
              paddingTop: space.sm,
              paddingBottom: insets.bottom + space.md,
              gap: space.md,
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 48,
                height: 5,
                borderRadius: 3,
                backgroundColor: colors.outlineSoft,
              }}
            />
            <View
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}
            >
              <Text size={24} weight="black" accessibilityRole="header" numberOfLines={2} style={{ flexShrink: 1 }}>
                {t('exercise.video.sheetTitle', { name: exerciseName(name) })}
              </Text>
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel={t('exercise.video.close')}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: border.base,
                  borderColor: colors.outline,
                  backgroundColor: colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...(pressed ? {} : hardShadow(2)),
                  transform: pressed
                    ? [{ translateX: pressOffset(2).translateX }, { translateY: pressOffset(2).translateY }]
                    : [],
                })}
              >
                <Text size={18} weight="black">
                  ✕
                </Text>
              </Pressable>
            </View>
            <ExerciseVideo source={source} />
            <Text size={15} color={colors.inkMuted} style={{ lineHeight: 21 }}>
              {t('exercise.video.sheetHint')}
            </Text>
            <StickerButton label={t('exercise.video.gotIt')} onPress={close} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
