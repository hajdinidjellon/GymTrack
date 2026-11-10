import React from 'react';
import { Pressable, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { border, colors, radius } from '@/constants/theme';
import { Text } from './Text';
import { t } from '@/i18n';

interface Props {
  /** No delete action: no red button. */
  onDelete?: () => void;
  deleteLabel: string;
  /** « Modifier », before « Supprimer »: a set already validated, to correct. */
  onEdit?: () => void;
  editLabel?: string;
  children: React.ReactNode;
}

function Action({
  label,
  a11y,
  danger,
  onPress,
}: {
  label: string;
  a11y: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => ({
        width: 104,
        marginLeft: 8,
        borderRadius: radius.row,
        borderWidth: border.base,
        borderColor: colors.outline,
        backgroundColor: pressed ? colors.ink : danger ? colors.danger : colors.sun,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      {({ pressed }) => (
        <Text size={15} weight="black" color={pressed || danger ? colors.card : colors.onSun}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** Swipe the row to the left: « Modifier » and/or a red « Supprimer ». Neither: it does not swipe. */
export function SwipeToDelete({ onDelete, deleteLabel, onEdit, editLabel, children }: Props) {
  if (!onDelete && !onEdit) return <>{children}</>;
  return (
    <Swipeable
      friction={1.6}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={(_progress, _translation, methods) => (
        <View style={{ flexDirection: 'row' }}>
          {onEdit ? (
            <Action
              label={t('common.edit')}
              a11y={editLabel ?? t('common.edit')}
              onPress={() => {
                methods.close();
                onEdit();
              }}
            />
          ) : null}
          {onDelete ? (
            <Action
              label={t('common.delete')}
              a11y={deleteLabel}
              danger
              onPress={() => {
                methods.close();
                onDelete();
              }}
            />
          ) : null}
        </View>
      )}
    >
      {children}
    </Swipeable>
  );
}
