import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { border, colors, fonts, radius, space } from '@/constants/theme';
import { catalogByMuscle, MUSCLE_LABELS, searchExercises, searchKey, type ExerciseDef } from '@/domain/programs';
import { useSettingsStore } from '@/stores/settingsStore';
import type { MuscleGroup } from '@/types';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { CreateExerciseForm } from '@/components/program/CreateExerciseForm';

interface Props {
  visible: boolean;
  /** Names already in the session: shown as added. */
  taken: string[];
  onPick: (def: ExerciseDef) => void;
  onClose: () => void;
  title?: string;
  /** Shown first, e.g. the exercises for the same muscle when swapping. */
  suggested?: ExerciseDef[];
  suggestedTitle?: string;
  /** Muscle picked first in the creation form. */
  muscle?: MuscleGroup;
  /** Under the list, above "Fermer": e.g. "keep it for next time". */
  footer?: React.ReactNode;
}

/** Every exercise of the catalog and the user's own, by muscle. One tap picks it; a new one can be created. */
export function ExercisePicker({
  visible,
  taken,
  onPick,
  onClose,
  title = 'Ajouter un exercice',
  suggested,
  suggestedTitle = 'Suggestions',
  muscle,
  footer,
}: Props) {
  const insets = useSafeAreaInsets();
  const own = useSettingsStore((s) => s.settings.customExercises);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const groups = catalogByMuscle(own);
  const found = searchExercises(query, own);
  const exact = found.some((e) => searchKey(e.name) === searchKey(query));

  // Rouverte, la fenêtre repart toujours sur la liste
  const reset = () => {
    setCreating(false);
    setQuery('');
  };
  const close = () => {
    reset();
    onClose();
  };
  const pick = (def: ExerciseDef) => {
    reset();
    onPick(def);
  };

  const row = (def: ExerciseDef) => {
    const added = taken.includes(def.name);
    return (
      <Pressable
        key={def.name}
        disabled={added}
        onPress={() => pick(def)}
        accessibilityRole="button"
        accessibilityLabel={added ? `${def.name}, déjà dans la séance` : `Choisir ${def.name}`}
        style={({ pressed }) => ({
          minHeight: 52,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: radius.row,
          borderWidth: border.base,
          borderColor: added ? colors.line : colors.ink,
          backgroundColor: pressed ? colors.coralSoft : colors.card,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        })}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text size={16} weight="bold" color={added ? colors.inkFaint : colors.ink} numberOfLines={1}>
            {def.name}
          </Text>
          {def.custom ? (
            <Text size={12} weight="semibold" color={colors.inkMuted}>
              Ton exercice
            </Text>
          ) : null}
        </View>
        <Text size={20} weight="black" color={added ? colors.successText : colors.ink}>
          {added ? '✓' : '+'}
        </Text>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
      >
        <Pressable style={{ flex: 1, minHeight: 80 }} onPress={close} accessibilityLabel="Fermer" />
        <View
          style={{
            maxHeight: '88%',
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
          <Text size={28} weight="black" style={{ marginTop: 18, paddingHorizontal: 24 }} accessibilityRole="header">
            {creating ? 'Nouvel exercice' : title}
          </Text>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: space.md }}
            keyboardShouldPersistTaps="handled"
          >
            {creating ? (
              <CreateExerciseForm
                muscle={muscle}
                initialName={query.trim()}
                onCreated={pick}
                onCancel={() => setCreating(false)}
              />
            ) : (
              <>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Chercher : hack squat, smith, convergent…"
                  placeholderTextColor={colors.inkFaint}
                  returnKeyType="search"
                  autoCorrect={false}
                  accessibilityLabel="Chercher un exercice"
                  style={{
                    marginTop: space.md,
                    height: 52,
                    paddingHorizontal: 16,
                    borderRadius: radius.row,
                    borderWidth: border.base,
                    borderColor: colors.ink,
                    backgroundColor: colors.card,
                    fontFamily: fonts.bold,
                    fontSize: 16,
                    color: colors.ink,
                  }}
                />
                <Pressable
                  onPress={() => setCreating(true)}
                  accessibilityRole="button"
                  accessibilityLabel={query.trim() && !exact ? `Créer ${query.trim()}` : 'Créer un exercice'}
                  style={({ pressed }) => ({
                    marginTop: space.sm,
                    minHeight: 52,
                    paddingHorizontal: 16,
                    borderRadius: radius.row,
                    borderWidth: border.base,
                    borderStyle: 'dashed',
                    borderColor: pressed ? colors.ink : colors.line,
                    alignItems: 'center',
                    justifyContent: 'center',
                  })}
                >
                  <Text size={16} weight="bold" color={colors.inkMuted} numberOfLines={1}>
                    {query.trim() && !exact ? `+ Créer « ${query.trim()} »` : '+ Créer mon exercice'}
                  </Text>
                </Pressable>
                {query.trim() ? (
                  <View style={{ marginTop: space.lg, gap: 8 }}>
                    <Text size={14} weight="bold" color={colors.inkMuted}>
                      {found.length
                        ? `${found.length} exercice${found.length > 1 ? 's' : ''}`
                        : 'Pas dans la liste : crée-le, il sera rangé avec son muscle.'}
                    </Text>
                    {found.map(row)}
                  </View>
                ) : (
                  <>
                    {suggested?.length ? (
                      <View style={{ marginTop: space.lg, gap: 8 }}>
                        <Text size={14} weight="bold" color={colors.inkMuted}>
                          {suggestedTitle}
                        </Text>
                        {suggested.map(row)}
                      </View>
                    ) : null}
                    {groups.map(({ muscle: m, exercises }) => (
                      <View key={m} style={{ marginTop: space.lg, gap: 8 }}>
                        <Text size={14} weight="bold" color={colors.inkMuted}>
                          {MUSCLE_LABELS[m]}
                        </Text>
                        {exercises.map(row)}
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
          </ScrollView>
          <View style={{ paddingHorizontal: 24, gap: space.sm }}>
            {!creating ? footer : null}
            <StickerButton label="Fermer" variant="secondary" size="small" onPress={close} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
