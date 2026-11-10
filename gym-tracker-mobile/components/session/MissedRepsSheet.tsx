import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { border, colors, radius } from '@/constants/theme';
import { formatKg } from '@/domain/plates';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { t } from '@/i18n';

interface Props {
  visible: boolean;
  target: number;
  weight: number;
  onSave: (reps: number) => void;
  onClose: () => void;
}

/** Reps done, in one tap, no keyboard. Centered on the target. */
export function MissedRepsSheet({ visible, target, weight, onSave, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState(Math.max(0, target - 1));

  const first = Math.max(0, target - 6);
  const options = Array.from({ length: 9 }, (_, i) => first + i);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => setPicked(Math.max(0, target - 1))}
    >
      <View style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel={t('common.close')} />
        <View
          style={{
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            backgroundColor: colors.paper,
            borderWidth: border.strong,
            borderBottomWidth: 0,
            borderColor: colors.outline,
            paddingTop: 14,
            paddingHorizontal: 24,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          }}
        >
          <View style={{ alignSelf: 'center', width: 48, height: 6, borderRadius: 3, backgroundColor: colors.line }} />
          <Text size={32} weight="black" style={{ marginTop: 22 }}>
            {t('session.missed.title')}
          </Text>
          <Text size={17} color={colors.inkMuted} style={{ marginTop: 6, lineHeight: 23 }}>
            {weight > 0
              ? t('session.missed.hintWeight', { target, kg: formatKg(weight) })
              : t('session.missed.hint', { target })}
          </Text>
          {/* Three per row: each a third of the width, the gap inside it (percent widths plus a gap ran
              over and fell back to two) */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, marginTop: 22, marginHorizontal: -5 }}>
            {options.map((n) => {
              const on = n === picked;
              const isTarget = n === target;
              return (
                <View key={n} style={{ width: '33.333%', paddingHorizontal: 5 }}>
                  <Pressable
                    onPress={() => setPicked(n)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={t(isTarget ? 'session.missed.optionTarget' : 'session.missed.option', { n })}
                    style={{
                      height: 72,
                      borderRadius: radius.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: on ? colors.coralSoft : colors.card,
                      borderWidth: on ? border.strong : border.base,
                      borderStyle: isTarget && !on ? 'dashed' : 'solid',
                      borderColor: colors.outline,
                    }}
                  >
                    <Text size={32} weight="black">
                      {n}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
          <StickerButton
            label={t('session.missed.save', { n: picked })}
            onPress={() => onSave(picked)}
            style={{ marginTop: 24 }}
          />
          <StickerButton
            label={t('common.cancel')}
            variant="ghost"
            size="small"
            onPress={onClose}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>
    </Modal>
  );
}
