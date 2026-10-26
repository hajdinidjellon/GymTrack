import React from 'react';
import { View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { dropIndex, shiftFor } from '@/domain/reorder';
import { buzz } from './PressableScale';

interface Props<T> {
  items: T[];
  keyOf: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Called once, when the item is dropped somewhere else. */
  onReorder: (from: number, to: number) => void;
  /** True while an item is held: the screen should stop scrolling. */
  onDragChange?: (dragging: boolean) => void;
  gap?: number;
}

/**
 * A list you reorder by holding an item, then sliding it up or down.
 * Rows are assumed to be the same height: the first one is measured.
 */
export function DraggableList<T>({ items, keyOf, renderItem, onReorder, onDragChange, gap = 12 }: Props<T>) {
  const active = useSharedValue(-1);
  const dragY = useSharedValue(0);
  const rowHeight = useSharedValue(0);

  return (
    <View style={{ gap }}>
      {items.map((item, index) => (
        <Row
          key={keyOf(item)}
          index={index}
          count={items.length}
          active={active}
          dragY={dragY}
          rowHeight={rowHeight}
          gap={gap}
          onReorder={onReorder}
          onDragChange={onDragChange}
        >
          {renderItem(item, index)}
        </Row>
      ))}
    </View>
  );
}

interface RowProps {
  index: number;
  count: number;
  active: SharedValue<number>;
  dragY: SharedValue<number>;
  rowHeight: SharedValue<number>;
  gap: number;
  onReorder: (from: number, to: number) => void;
  onDragChange?: (dragging: boolean) => void;
  children: React.ReactNode;
}

function Row({ index, count, active, dragY, rowHeight, gap, onReorder, onDragChange, children }: RowProps) {
  const dragStarted = () => {
    buzz('medium');
    onDragChange?.(true);
  };
  const dropped = (to: number) => {
    onDragChange?.(false);
    if (to !== index) {
      buzz('selection');
      onReorder(index, to);
    }
  };

  // Les animations partent une seule fois par changement, jamais à chaque mouvement du doigt
  const lift = useSharedValue(0);
  const shift = useSharedValue(0);

  useAnimatedReaction(
    () =>
      active.get() < 0
        ? null
        : shiftFor(index, active.get(), dropIndex(active.get(), dragY.get(), rowHeight.get(), count), rowHeight.get()),
    (next, previous) => {
      // Au lâcher, pas de retour animé : la liste est déjà réordonnée
      if (next === null) shift.set(0);
      else if (next !== previous) shift.set(withTiming(next, { duration: 150 }));
    },
  );

  // Appui long pour attraper l'exercice : un simple toucher ouvre toujours son détail
  const pan = usePanGesture({
    activateAfterLongPress: 250,
    onActivate: () => {
      active.set(index);
      dragY.set(0);
      lift.set(withTiming(1, { duration: 120 }));
      scheduleOnRN(dragStarted);
    },
    onUpdate: (e) => {
      dragY.set(e.translationY);
    },
    onDeactivate: () => {
      const to = dropIndex(index, dragY.get(), rowHeight.get(), count);
      scheduleOnRN(dropped, to);
    },
    onFinalize: () => {
      active.set(-1);
      dragY.set(0);
      lift.set(0);
    },
  });

  const style = useAnimatedStyle(() => {
    const dragged = active.get() === index;
    return {
      zIndex: dragged ? 10 : 0,
      transform: [{ translateY: dragged ? dragY.get() : shift.get() }, { scale: 1 + lift.get() * 0.02 }],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={style}
        onLayout={
          index === 0
            ? (e) => {
                rowHeight.set(e.nativeEvent.layout.height + gap);
              }
            : undefined
        }
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
