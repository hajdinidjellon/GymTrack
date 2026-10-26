import React from 'react';
import { Pressable } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { border, colors, radius } from '@/constants/theme';
import { Text } from './Text';

interface Props {
  /** No delete action: the row does not swipe. */
  onDelete?: () => void;
  deleteLabel: string;
  children: React.ReactNode;
}

/** Swipe the row to the left to show a red "Supprimer" button. */
export function SwipeToDelete({ onDelete, deleteLabel, children }: Props) {
  if (!onDelete) return <>{children}</>;
  return (
    <Swipeable
      friction={1.6}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={(_progress, _translation, methods) => (
        <Pressable
          onPress={() => {
            methods.close();
            onDelete();
          }}
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
          style={({ pressed }) => ({
            width: 104,
            marginLeft: 8,
            borderRadius: radius.row,
            borderWidth: border.base,
            borderColor: colors.ink,
            backgroundColor: pressed ? colors.ink : colors.danger,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text size={15} weight="black" color={colors.card}>
            Supprimer
          </Text>
        </Pressable>
      )}
    >
      {children}
    </Swipeable>
  );
}
