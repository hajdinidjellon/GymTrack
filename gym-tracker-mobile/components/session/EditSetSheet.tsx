import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { border, colors, space } from '@/constants/theme';
import { formatKg } from '@/domain/plates';
import { nudge } from '@/domain/session';
import { Text } from '@/components/ui/Text';
import { Stepper } from '@/components/ui/Stepper';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { t } from '@/i18n';

export interface SetValues {
  weight: number;
  reps: number;
}

interface Props {
  /** The set being corrected; null: closed. */
  set: SetValues | null;
  title: string;
  /** Bodyweight: only the reps. */
  noWeight?: boolean;
  /** Held for a time: the reps are seconds. */
  timed?: boolean;
  step: number;
  repStep: number;
  onSave: (values: SetValues) => void;
  onClose: () => void;
}

/** A set already validated, corrected: the weight or the reps typed wrong. Nothing else changes. */
export function EditSetSheet({ set, title, noWeight, timed, step, repStep, onSave, onClose }: Props) {
  const insets = useSafeAreaInsets();
  // From the set itself: the parent gives each set its own sheet (`key`), so it never starts at 0
  const [draft, setDraft] = useState<SetValues>(set ?? { weight: 0, reps: 0 });

  return (
    <Modal visible={!!set} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            gap: space.md,
          }}
        >
          <View style={{ alignSelf: 'center', width: 48, height: 6, borderRadius: 3, backgroundColor: colors.line }} />
          <View style={{ gap: 4, marginTop: space.sm }}>
            <Text size={30} weight="black" accessibilityRole="header">
              {title}
            </Text>
            <Text size={16} color={colors.inkMuted} style={{ lineHeight: 22 }}>
              {t('session.editSet.hint')}
            </Text>
          </View>
          <StickerCard style={{ gap: space.sm, paddingVertical: space.md }}>
            {noWeight ? null : (
              <Stepper
                value={formatKg(draft.weight)}
                unit="kg"
                onMinus={() => setDraft((d) => ({ ...d, weight: nudge(d.weight, -step) }))}
                onPlus={() => setDraft((d) => ({ ...d, weight: nudge(d.weight, step) }))}
                minusLabel={t('session.weightMinus', { kg: formatKg(step) })}
                plusLabel={t('session.weightPlus', { kg: formatKg(step) })}
                onChange={(weight) => setDraft((d) => ({ ...d, weight }))}
                inputLabel={t('session.setView.weightInput')}
              />
            )}
            <Stepper
              value={String(draft.reps)}
              unit={timed ? t('session.setView.secondsUnit') : t('common.reps')}
              onMinus={() => setDraft((d) => ({ ...d, reps: nudge(d.reps, -repStep) }))}
              onPlus={() => setDraft((d) => ({ ...d, reps: nudge(d.reps, repStep) }))}
              minusLabel={timed ? t('session.setView.secondsMinus') : t('session.setView.repMinus')}
              plusLabel={timed ? t('session.setView.secondsPlus') : t('session.setView.repPlus')}
              onChange={(reps) => setDraft((d) => ({ ...d, reps }))}
              integer
              inputLabel={timed ? t('session.setView.secondsInput') : t('session.setView.repsInput')}
            />
          </StickerCard>
          <StickerButton label={t('common.save')} onPress={() => onSave(draft)} />
          <StickerButton label={t('common.cancel')} variant="ghost" size="small" onPress={onClose} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
