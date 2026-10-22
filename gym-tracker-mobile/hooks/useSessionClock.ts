import { useEffect, useState } from 'react';

// Ticks once per second, but only in the component that calls it.
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    // Recalé tout de suite au démarrage, puis chaque seconde
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [active]);
  return now;
}

export function getElapsedSeconds(startedAt: string, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
}

export function useElapsedSeconds(startedAt: string | undefined) {
  const now = useNow(!!startedAt);
  return startedAt ? getElapsedSeconds(startedAt, now) : 0;
}

/** Seconds left on the rest timer, or null when not resting. */
export function useRestSecondsLeft(restEndsAt: number | null | undefined) {
  const now = useNow(restEndsAt != null);
  if (restEndsAt == null) return null;
  return Math.max(0, Math.ceil((restEndsAt - now) / 1000));
}
