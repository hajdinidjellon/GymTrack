import React from 'react';
import { View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { springs } from '@/constants/theme';
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

  // Appui long pour attraper l'exercice : un simple toucher ouvre toujours son détail
  const pan = usePanGesture({
    activateAfterLongPress: 250,
    onActivate: () => {
      active.set(index);
      dragY.set(0);
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
    },
  });

  const style = useAnimatedStyle(() => {
    if (active.get() === index) {
      return {
        zIndex: 10,
        transform: [{ translateY: dragY.get() }, { scale: withSpring(1.03, springs.snappy) }],
      };
    }
    // Pas de retour animé au lâcher : la liste est déjà réordonnée
    if (active.get() < 0) return { zIndex: 0, transform: [{ translateY: 0 }, { scale: 1 }] };
    const to = dropIndex(active.get(), dragY.get(), rowHeight.get(), count);
    return {
      zIndex: 0,
      transform: [
        { translateY: withTiming(shiftFor(index, active.get(), to, rowHeight.get()), { duration: 150 }) },
        { scale: 1 },
      ],
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
