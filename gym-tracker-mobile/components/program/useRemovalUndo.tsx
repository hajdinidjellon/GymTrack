import React, { useState } from 'react';
import { UndoBar } from '@/components/ui/UndoBar';
import { exerciseName, t } from '@/i18n';

interface Pending {
  name: string;
  restore: () => void;
}

/**
 * The last exercise taken off a day, with a way back. The screen shows `bar`
 * in its footer, under the thumb, wherever the list is scrolled.
 */
export function useRemovalUndo() {
  const [pending, setPending] = useState<Pending | null>(null);
  const bar = pending ? (
    <UndoBar
      message={t('program.editor.removed', { name: exerciseName(pending.name) })}
      actionLabel={t('program.editor.undo')}
      actionA11y={t('program.editor.undoA11y', { name: exerciseName(pending.name) })}
      onUndo={() => {
        pending.restore();
        setPending(null);
      }}
    />
  ) : null;
  return {
    bar,
    onRemoved: (name: string, restore: () => void) => setPending({ name, restore }),
    onEdited: () => setPending(null),
  };
}
