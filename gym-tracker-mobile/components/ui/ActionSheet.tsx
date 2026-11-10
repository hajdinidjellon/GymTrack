import React, { useRef } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { border, colors, hardShadow, pressOffset, radius, space } from '@/constants/theme';
import { Text } from './Text';
import { StickerButton } from './StickerButton';
import { t } from '@/i18n';

export interface SheetAction {
  label: string;
  /** One line under the label: what it does. */
  hint?: string;
  onPress: () => void;
  /** Removes something: in red. */
  danger?: boolean;
  /** It opens another sheet: on iOS it waits for this one to be gone (two at once fail). */
  opensSheet?: boolean;
}

interface Props {
  visible: boolean;
  title: string;
  actions: SheetAction[];
  onClose: () => void;
}

/**
 * The app's own menu, from the bottom: a sticker per choice, « Annuler » under them. Instead of
 * the system's grey alert, which looked foreign to the app. A choice closes it, then runs: on iOS
 * once the sheet is gone, so a choice that opens another sheet is not lost.
 */
export function ActionSheet({ visible, title, actions, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const pending = useRef<(() => void) | null>(null);
  const runPending = () => {
    const run = pending.current;
    pending.current = null;
    run?.();
  };
  const choose = (action: SheetAction) => {
    onClose();
    if (!action.opensSheet || Platform.OS !== 'ios') {
      action.onPress();
      return;
    }
    pending.current = action.onPress;
    // onDismiss, else this: the slide down is over by then
    setTimeout(runPending, 500);
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onDismiss={runPending}>
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
            gap: space.sm,
          }}
        >
          <View style={{ alignSelf: 'center', width: 48, height: 6, borderRadius: 3, backgroundColor: colors.line }} />
          <Text size={28} weight="black" accessibilityRole="header" style={{ marginTop: space.sm, marginBottom: 4 }}>
            {title}
          </Text>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => choose(action)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityHint={action.hint}
              style={({ pressed }) => ({
                minHeight: 58,
                paddingHorizontal: 18,
                paddingVertical: 10,
                justifyContent: 'center',
                borderRadius: radius.row,
                borderCurve: 'continuous',
                borderWidth: border.base,
                borderColor: action.danger ? colors.danger : colors.outline,
                backgroundColor: pressed ? colors.coralSoft : colors.card,
                ...(pressed ? {} : hardShadow(2, action.danger ? colors.danger : colors.shadow)),
                transform: pressed
                  ? [{ translateX: pressOffset(2).translateX }, { translateY: pressOffset(2).translateY }]
                  : [],
              })}
            >
              <Text size={17} weight="titleMedium" color={action.danger ? colors.danger : colors.ink}>
                {action.label}
              </Text>
              {action.hint ? (
                <Text size={13} color={colors.inkMuted} style={{ marginTop: 2 }}>
                  {action.hint}
                </Text>
              ) : null}
            </Pressable>
          ))}
          <StickerButton label={t('common.cancel')} variant="ghost" size="small" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
