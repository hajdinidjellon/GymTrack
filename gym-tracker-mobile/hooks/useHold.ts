import { useEffect, useRef, useState } from 'react';
import { holdPhase, type HoldPhase } from '@/domain/hold';

interface Hold {
  /** Null until "Lancer". */
  state: HoldPhase | null;
  start: () => void;
  /** During the countdown: cancels. During the hold: ends it with the seconds held. */
  stop: () => void;
}

type Callbacks = { onGo: () => void; onEnd: (held: number, reached: boolean) => void };

/**
 * The timer of a held set. `onGo` when the hold starts, `onEnd` with the
 * seconds held and whether the target was reached.
 */
export function useHold(target: number, onGo: Callbacks['onGo'], onEnd: Callbacks['onEnd']): Hold {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const callbacks = useRef<Callbacks>({ onGo, onEnd });
  useEffect(() => {
    callbacks.current = { onGo, onEnd };
  });

  // The transitions happen in the tick: no state set from an effect body
  useEffect(() => {
    if (startedAt === null) return;
    let last = holdPhase(startedAt, Date.now(), target).phase;
    const id = setInterval(() => {
      const time = Date.now();
      const next = holdPhase(startedAt, time, target);
      if (next.phase === 'hold' && last === 'prep') callbacks.current.onGo();
      last = next.phase;
      if (next.phase === 'done') {
        clearInterval(id);
        setStartedAt(null);
        callbacks.current.onEnd(next.held, true);
        return;
      }
      setNow(time);
    }, 200);
    return () => clearInterval(id);
  }, [startedAt, target]);

  const state = startedAt === null ? null : holdPhase(startedAt, now, target);
  return {
    state,
    start: () => {
      const time = Date.now();
      setNow(time);
      setStartedAt(time);
    },
    stop: () => {
      setStartedAt(null);
      if (state?.phase === 'hold' && state.held > 0) onEnd(state.held, false);
    },
  };
}
