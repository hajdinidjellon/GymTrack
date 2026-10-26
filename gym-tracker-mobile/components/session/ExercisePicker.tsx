import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { border, colors, radius, space } from '@/constants/theme';
import { catalogByMuscle, MUSCLE_LABELS, type ExerciseDef } from '@/domain/programs';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';

interface Props {
  visible: boolean;
  /** Names already in the session: shown as added. */
  taken: string[];
  onPick: (def: ExerciseDef) => void;
  onClose: () => void;
}

const GROUPS = catalogByMuscle();

/** Every exercise of the catalog, by muscle. One tap adds it to the session. */
export function ExercisePicker({ visible, taken, onPick, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1, minHeight: 80 }} onPress={onClose} accessibilityLabel="Fermer" />
        <View
          style={{
            maxHeight: '85%',
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            backgroundColor: colors.paper,
            borderWidth: border.strong,
            borderBottomWidth: 0,
            borderColor: colors.ink,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          }}
        >
          <View style={{ alignSelf: 'center', width: 48, height: 6, borderRadius: 3, backgroundColor: colors.line }} />
          <Text size={28} weight="black" style={{ marginTop: 18, paddingHorizontal: 24 }}>
            Ajouter un exercice
          </Text>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: space.md }}>
            {GROUPS.map(({ muscle, exercises }) => (
              <View key={muscle} style={{ marginTop: space.lg, gap: 8 }}>
                <Text size={14} weight="bold" color={colors.inkMuted}>
                  {MUSCLE_LABELS[muscle]}
                </Text>
                {exercises.map((def) => {
                  const added = taken.includes(def.name);
                  return (
                    <Pressable
                      key={def.name}
                      disabled={added}
                      onPress={() => onPick(def)}
                      accessibilityRole="button"
                      accessibilityLabel={added ? `${def.name}, déjà dans la séance` : `Ajouter ${def.name}`}
                      style={({ pressed }) => ({
                        height: 52,
                        paddingHorizontal: 16,
                        borderRadius: radius.row,
                        borderWidth: border.base,
                        borderColor: added ? colors.line : colors.ink,
                        backgroundColor: pressed ? colors.coralSoft : colors.card,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      })}
                    >
                      <Text size={16} weight="bold" color={added ? colors.inkFaint : colors.ink} numberOfLines={1}>
                        {def.name}
                      </Text>
                      <Text size={20} weight="black" color={added ? colors.successText : colors.ink}>
                        {added ? '✓' : '+'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
          <View style={{ paddingHorizontal: 24 }}>
            <StickerButton label="Fermer" variant="secondary" size="small" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
