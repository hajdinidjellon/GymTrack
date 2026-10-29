import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { border, colors, radius } from '@/constants/theme';
import { formatKg } from '@/domain/plates';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';

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
  const [picked, setPicked] = useState(Math.max(0, target - 2));

  const first = Math.max(0, target - 6);
  const options = Array.from({ length: 9 }, (_, i) => first + i);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => setPicked(Math.max(0, target - 2))}
    >
      <View style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Fermer" />
        <View
          style={{
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            backgroundColor: colors.paper,
            borderWidth: border.strong,
            borderBottomWidth: 0,
            borderColor: colors.ink,
            paddingTop: 14,
            paddingHorizontal: 24,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          }}
        >
          <View style={{ alignSelf: 'center', width: 48, height: 6, borderRadius: 3, backgroundColor: colors.line }} />
          <Text size={32} weight="black" style={{ marginTop: 22 }}>
            Combien de reps ?
          </Text>
          <Text size={17} color={colors.inkMuted} style={{ marginTop: 6, lineHeight: 23 }}>
            Objectif {target}
            {weight > 0 ? ` à ${formatKg(weight)} kg` : ''}. Pas grave : la prochaine séance en tient compte.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
            {options.map((n) => {
              const on = n === picked;
              const isTarget = n === target;
              return (
                <Pressable
                  key={n}
                  onPress={() => setPicked(n)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${n} reps${isTarget ? ' (objectif)' : ''}`}
                  style={{
                    width: '31.5%',
                    height: 72,
                    borderRadius: radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? colors.coralSoft : colors.card,
                    borderWidth: on ? border.strong : border.base,
                    borderStyle: isTarget && !on ? 'dashed' : 'solid',
                    borderColor: colors.ink,
                  }}
                >
                  <Text size={32} weight="black">
                    {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <StickerButton
            label={`Enregistrer ${picked} reps`}
            onPress={() => onSave(picked)}
            style={{ marginTop: 24 }}
          />
          <StickerButton label="Annuler" variant="ghost" size="small" onPress={onClose} style={{ marginTop: 6 }} />
        </View>
      </View>
    </Modal>
  );
}
