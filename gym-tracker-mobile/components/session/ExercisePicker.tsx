import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { border, colors, fonts, radius, space } from '@/constants/theme';
import {
  aliasMatch,
  exercisesByPopularity,
  MUSCLE_LABELS,
  namesOf,
  searchExercises,
  searchKey,
  type ExerciseDef,
} from '@/domain/programs';
import { useSettingsStore } from '@/stores/settingsStore';
import type { MuscleGroup } from '@/types';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { buzz } from '@/components/ui/PressableScale';
import { CreateExerciseForm } from '@/components/program/CreateExerciseForm';
import { exerciseName, t } from '@/i18n';

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
  /** Options read before choosing, under the title: e.g. "keep it for next time". Shown while creating too. */
  options?: React.ReactNode;
}

type Item =
  | { kind: 'title'; key: string; text: string }
  | { kind: 'exercise'; key: string; def: ExerciseDef }
  | { kind: 'create'; key: string };

type Tab = 'all' | MuscleGroup;

/**
 * Every exercise of the catalog and the user's own, from the most known to the
 * least known: all of them (the suggestions, same muscle when swapping, on top)
 * or one muscle tab at a time. A search looks through every name. One tap picks it; a new one can be created.
 */
export function ExercisePicker({
  visible,
  taken,
  onPick,
  onClose,
  title = t('session.add.title'),
  suggested,
  suggestedTitle = t('session.picker.suggestions'),
  muscle,
  options,
}: Props) {
  const insets = useSafeAreaInsets();
  const own = useSettingsStore((s) => s.settings.customExercises);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const searching = query.trim() !== '';
  const found = searchExercises(query, own);
  // Typed exactly, even under another name: no offer to create it again
  const exact = found.some((e) => namesOf(e).some((n) => searchKey(n) === searchKey(query)));

  const everything = exercisesByPopularity(own);
  // Only the muscles that have exercises: « Bras » stays for old own exercises
  const muscles = (Object.keys(MUSCLE_LABELS) as MuscleGroup[]).filter((m) =>
    everything.some((d) => d.muscleGroups[0] === m),
  );

  const items: Item[] = [];
  const exercise = (def: ExerciseDef, at: string): Item => ({ kind: 'exercise', key: `${at}/${def.name}`, def });
  if (searching) {
    const count = found.length ? t('common.exercises', { count: found.length }) : t('session.picker.notFound');
    items.push({ kind: 'title', key: 'found', text: count }, ...found.map((d) => exercise(d, 'found')));
    items.push({ kind: 'create', key: 'create' });
  } else {
    // Le bouton « créer » en haut : la liste complète est longue
    items.push({ kind: 'create', key: 'create' });
    if (tab === 'all') {
      const first = suggested ?? [];
      if (first.length) {
        items.push({ kind: 'title', key: 'suggested', text: suggestedTitle }, ...first.map((d) => exercise(d, 's')));
      }
      const rest = everything.filter((d) => !first.some((s) => s.name === d.name));
      items.push({ kind: 'title', key: 'all', text: t('session.picker.all') }, ...rest.map((d) => exercise(d, 'all')));
    } else {
      items.push(...everything.filter((d) => d.muscleGroups[0] === tab).map((d) => exercise(d, tab)));
    }
  }

  // Rouverte, la fenêtre repart toujours sur la liste
  const reset = () => {
    setCreating(false);
    setQuery('');
    setTab('all');
  };
  const close = () => {
    reset();
    onClose();
  };
  // Left open by the parent (several in a row), the list comes back with the added one ticked
  const pick = (def: ExerciseDef) => {
    // Same tab: the next one of the same muscle is one tap away
    setCreating(false);
    setQuery('');
    onPick(def);
  };

  const row = (def: ExerciseDef) => {
    const added = taken.includes(def.name);
    const alias = aliasMatch(def, query);
    return (
      <Pressable
        disabled={added}
        onPress={() => pick(def)}
        accessibilityRole="button"
        accessibilityLabel={
          added
            ? t('session.picker.taken', { name: exerciseName(def.name) })
            : t('session.picker.choose', { name: exerciseName(def.name) })
        }
        style={({ pressed }) => ({
          minHeight: 52,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: radius.row,
          borderWidth: border.base,
          borderColor: added ? colors.outlineSoft : colors.outlineStrong,
          backgroundColor: pressed ? colors.coralSoft : colors.card,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        })}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text size={16} weight="bold" color={added ? colors.inkFaint : colors.ink} numberOfLines={1}>
            {exerciseName(def.name)}
          </Text>
          {alias ? (
            <Text size={12} weight="semibold" color={colors.inkMuted}>
              {t('session.picker.alias', { alias })}
            </Text>
          ) : def.custom ? (
            <Text size={12} weight="semibold" color={colors.inkMuted}>
              {t('session.picker.own')}
            </Text>
          ) : null}
        </View>
        <Text size={20} weight="black" color={added ? colors.successText : colors.ink}>
          {added ? '✓' : '+'}
        </Text>
      </Pressable>
    );
  };

  const createButton = () => (
    <Pressable
      onPress={() => setCreating(true)}
      accessibilityRole="button"
      accessibilityLabel={
        searching && !exact
          ? t('session.picker.createNamedA11y', { name: query.trim() })
          : t('session.picker.createA11y')
      }
      style={({ pressed }) => ({
        minHeight: 52,
        paddingHorizontal: 16,
        borderRadius: radius.row,
        borderWidth: border.base,
        borderStyle: 'dashed',
        borderColor: pressed ? colors.outlineStrong : colors.outlineSoft,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text size={16} weight="bold" color={colors.inkMuted} numberOfLines={1}>
        {searching && !exact ? t('session.picker.createNamed', { name: query.trim() }) : t('session.picker.create')}
      </Text>
    </Pressable>
  );

  const renderItem = ({ item }: { item: Item }) => {
    if (item.kind === 'title') {
      return (
        <Text size={14} weight="bold" color={colors.inkMuted} style={{ marginTop: space.md }}>
          {item.text}
        </Text>
      );
    }
    return <View style={{ marginTop: 8 }}>{item.kind === 'create' ? createButton() : row(item.def)}</View>;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
      >
        <Pressable style={{ flex: 1, minHeight: 80 }} onPress={close} accessibilityLabel={t('common.close')} />
        <View
          style={{
            maxHeight: '88%',
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            backgroundColor: colors.paper,
            borderWidth: border.strong,
            borderBottomWidth: 0,
            borderColor: colors.outline,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          }}
        >
          <View style={{ alignSelf: 'center', width: 48, height: 6, borderRadius: 3, backgroundColor: colors.line }} />
          <Text size={28} weight="black" style={{ marginTop: 18, paddingHorizontal: 24 }} accessibilityRole="header">
            {creating ? t('session.picker.newExercise') : title}
          </Text>
          {options ? <View style={{ paddingHorizontal: 24, marginTop: space.sm }}>{options}</View> : null}
          {creating ? (
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: space.md }}
              keyboardShouldPersistTaps="handled"
            >
              <CreateExerciseForm
                muscle={tab === 'all' ? muscle : tab}
                initialName={query.trim()}
                onCreated={pick}
                onCancel={() => setCreating(false)}
              />
            </ScrollView>
          ) : (
            <>
              {/* Marge sur un cadre : sur iOS, une marge sur le TextInput décale son texte vers le bas */}
              <View style={{ paddingHorizontal: 24, marginTop: space.md }}>
                <TextInput
                  maxFontSizeMultiplier={1.5}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t('session.picker.searchPlaceholder')}
                  placeholderTextColor={colors.inkFaint}
                  returnKeyType="search"
                  autoCorrect={false}
                  accessibilityLabel={t('session.picker.searchA11y')}
                  style={{
                    minHeight: 52,
                    paddingHorizontal: 16,
                    paddingVertical: 0,
                    borderRadius: radius.row,
                    borderWidth: border.base,
                    borderColor: colors.outline,
                    backgroundColor: colors.card,
                    fontFamily: fonts.bold,
                    fontSize: 16,
                    color: colors.ink,
                  }}
                />
              </View>
              {!searching ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  accessibilityRole="tablist"
                  style={{ flexGrow: 0, marginTop: space.sm }}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 4, gap: 8 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {(['all', ...muscles] as Tab[]).map((item) => (
                    <MuscleTab
                      key={item}
                      label={item === 'all' ? t('session.picker.allTab') : MUSCLE_LABELS[item]}
                      selected={item === tab}
                      onPress={() => setTab(item)}
                    />
                  ))}
                </ScrollView>
              ) : null}
              {/* Plus de 200 exercices : la liste ne dessine que ce qui est à l'écran */}
              <FlatList
                data={items}
                keyExtractor={(item) => item.key}
                renderItem={renderItem}
                initialNumToRender={24}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: space.md }}
              />
            </>
          )}
          <View style={{ paddingHorizontal: 24, gap: space.sm }}>
            <StickerButton label={t('common.close')} variant="secondary" size="small" onPress={close} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** One muscle in the tab row: coral-soft and outlined thicker when it is the one shown. */
function MuscleTab({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        buzz('selection');
        onPress();
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: 16,
        borderRadius: radius.pill,
        borderWidth: selected ? border.strong : border.base,
        borderColor: colors.outline,
        backgroundColor: selected || pressed ? colors.coralSoft : colors.card,
        justifyContent: 'center',
      })}
    >
      <Text size={15} weight={selected ? 'black' : 'titleMedium'} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
