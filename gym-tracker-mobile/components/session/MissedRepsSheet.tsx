import React, { useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/constants/theme';
import { formatKg } from '@/lib/plates';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

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
  useEffect(() => {
    if (visible) setPicked(Math.max(0, target - 2));
  }, [visible, target]);

  const first = Math.max(0, target - 6);
  const options = Array.from({ length: 9 }, (_, i) => first + i);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(8, 42, 32, 0.85)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Fermer" />
        <View
          style={{
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            backgroundColor: colors.surface,
            paddingTop: 14,
            paddingHorizontal: 24,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          }}
        >
          <View style={{ alignSelf: 'center', width: 48, height: 6, borderRadius: 3, backgroundColor: colors.line }} />
          <Text size={36} weight="black" style={{ marginTop: 22 }}>Combien de reps ?</Text>
          <Text size={17} color={colors.muted} style={{ marginTop: 6, lineHeight: 23 }}>
            Objectif {target}{weight > 0 ? ` à ${formatKg(weight)} kg` : ''}. Pas grave : on garde la même charge la prochaine fois.
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
                    height: 76,
                    borderRadius: radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? colors.cream : colors.bg,
                    borderWidth: 2.5,
                    borderStyle: isTarget && !on ? 'dashed' : 'solid',
                    borderColor: on ? colors.cream : isTarget ? colors.steel : colors.bg,
                  }}
                >
                  <Text size={34} weight="black" color={on ? colors.bg : colors.cream}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
          <Button label={`Enregistrer ${picked} reps`} onPress={() => onSave(picked)} style={{ marginTop: 24 }} />
          <Button label="Annuler" variant="ghost" height={52} onPress={onClose} style={{ marginTop: 6 }} />
        </View>
      </View>
    </Modal>
  );
}
