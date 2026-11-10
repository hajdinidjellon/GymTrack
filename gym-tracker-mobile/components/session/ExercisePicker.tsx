import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { border, colors, fonts, hardShadow, pressOffset, radius, space } from '@/constants/theme';
import {
  aliasMatch,
  exercisesByPopularity,
  MUSCLE_LABELS,
  namesOf,
  regionOf,
  regionsOf,
  searchExercises,
  searchKey,
  type ExerciseDef,
} from '@/domain/programs';
import { useSettingsStore } from '@/stores/settingsStore';
import type { MuscleGroup, MuscleRegion } from '@/types';
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
type RegionTab = 'all' | MuscleRegion;

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
  const [region, setRegion] = useState<RegionTab>('all');
  const searching = query.trim() !== '';
  const found = searchExercises(query, own);
  // Typed exactly, even under another name: no offer to create it again
  const exact = found.some((e) => namesOf(e).some((n) => searchKey(n) === searchKey(query)));

  const everything = exercisesByPopularity(own);
  // Only the muscles that have exercises: « Bras » stays for old own exercises
  const muscles = (Object.keys(MUSCLE_LABELS) as MuscleGroup[]).filter((m) =>
    everything.some((d) => d.muscleGroups[0] === m),
  );
  const ofMuscle = tab === 'all' ? [] : everything.filter((d) => d.muscleGroups[0] === tab);
  // Haut, milieu, bas des pecs… only the ones with exercises
  const regions = tab === 'all' ? [] : regionsOf(tab).filter((r) => ofMuscle.some((d) => regionOf(d) === r));
  const shown = region === 'all' ? ofMuscle : ofMuscle.filter((d) => regionOf(d) === region);

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
      const name = region === 'all' ? MUSCLE_LABELS[tab] : t(`domain.programs.regions.${region}`);
      const count = t('common.exercises', { count: shown.length });
      items.push({ kind: 'title', key: 'muscle', text: `${name} · ${count}` });
      items.push(...shown.map((d) => exercise(d, `${tab}/${region}`)));
    }
  }

  // Rouverte, la fenêtre repart toujours sur la liste
  const reset = () => {
    setCreating(false);
    setQuery('');
    setTab('all');
    setRegion('all');
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
                region={region === 'all' ? undefined : region}
                initialName={query.trim()}
                onCreated={pick}
                onCancel={() => setCreating(false)}
              />
            </ScrollView>
          ) : (
            <>
              {/* Marge sur un cadre : sur iOS, une marge sur le TextInput décale son texte vers le bas */}
              <View style={{ paddingHorizontal: 24, marginTop: space.md }}>
                <Input
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
                <View style={{ marginTop: space.md, gap: space.sm }}>
                  {/* Une seule ligne qui défile : la liste garde la place */}
                  <ScrollView
                    horizontal
                    accessibilityRole="tablist"
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    style={{ flexGrow: 0 }}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 3, gap: 6 }}
                  >
                    {(['all', ...muscles] as Tab[]).map((item) => (
                      <MuscleTab
                        key={item}
                        label={item === 'all' ? t('session.picker.allTab') : t(`session.picker.tabs.${item}`)}
                        a11y={item === 'all' ? t('session.picker.allTab') : MUSCLE_LABELS[item]}
                        selected={item === tab}
                        onPress={() => {
                          setTab(item);
                          setRegion('all');
                        }}
                      />
                    ))}
                  </ScrollView>
                  {regions.length > 1 ? (
                    <View style={{ paddingHorizontal: 24 }}>
                      <RegionBar
                        regions={regions}
                        value={region}
                        onChange={setRegion}
                        allA11y={t('session.picker.regionAllA11y', { muscle: MUSCLE_LABELS[tab as MuscleGroup] })}
                      />
                    </View>
                  ) : null}
                </View>
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

/** One muscle in the tab row: the chosen one is a coral-soft sticker that stands out on its shadow. */
function MuscleTab({
  label,
  a11y,
  selected,
  onPress,
}: {
  label: string;
  a11y: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        buzz('selection');
        onPress();
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={a11y}
      hitSlop={{ top: 3, bottom: 3 }}
      style={({ pressed }) => ({
        minHeight: 40,
        paddingHorizontal: 12,
        borderRadius: radius.pill,
        borderWidth: selected ? border.strong : border.base,
        borderColor: selected ? colors.outlineStrong : colors.outlineSoft,
        backgroundColor: selected ? colors.coralSoft : pressed ? colors.inset : colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        ...(selected ? hardShadow(2) : null),
        // Pressed, the chosen sticker sinks onto its shadow
        transform:
          pressed && selected
            ? [{ translateX: pressOffset(2).translateX }, { translateY: pressOffset(2).translateY }]
            : [],
      })}
    >
      <Text size={14} weight={selected ? 'black' : 'titleMedium'} color={colors.ink} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Inside a muscle: Tous · Haut · Milieu · Bas. One bar split in parts, a
 * different shape from the muscles above so the two levels never mix up.
 */
function RegionBar({
  regions,
  value,
  onChange,
  allA11y,
}: {
  regions: readonly MuscleRegion[];
  value: RegionTab;
  onChange: (region: RegionTab) => void;
  allA11y: string;
}) {
  return (
    // Tout reste visible : une deuxième ligne plutôt qu'une zone cachée à faire défiler
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 3,
        gap: 3,
        borderRadius: radius.lg,
        borderWidth: border.base,
        borderColor: colors.frame,
        backgroundColor: colors.sunSoft,
      }}
    >
      {(['all', ...regions] as RegionTab[]).map((r, _, all) => {
        const on = r === value;
        return (
          <Pressable
            key={r}
            onPress={() => {
              buzz('selection');
              onChange(r);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={r === 'all' ? allA11y : t(`domain.programs.regions.${r}`)}
            style={({ pressed }) => ({
              flexGrow: 1,
              // Five or more: two balanced lines (3 + 2) rather than one left alone
              flexBasis: all.length >= 5 ? '30%' : 'auto',
              minHeight: 36,
              paddingHorizontal: 12,
              borderRadius: radius.pill,
              borderWidth: on ? border.base : 0,
              borderColor: colors.outlineStrong,
              backgroundColor: on ? colors.sun : pressed ? colors.card : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Text size={13} weight={on ? 'black' : 'bold'} color={on ? colors.onSun : colors.ink} numberOfLines={1}>
              {r === 'all' ? t('session.picker.regionAll') : t(`domain.programs.regionTabs.${r}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
