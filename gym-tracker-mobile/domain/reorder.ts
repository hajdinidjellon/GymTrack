/**
 * GLISSER-DÉPOSER — où atterrit l'élément qu'on déplace dans une liste.
 * Tourne aussi sur le thread UI pendant le geste, d'où la directive 'worklet'.
 */

/** Index where an item dragged by `dy` points would land, rows of `rowHeight`. */
export function dropIndex(from: number, dy: number, rowHeight: number, count: number): number {
  'worklet';
  if (rowHeight <= 0 || count <= 0) return from;
  return Math.max(0, Math.min(count - 1, Math.round(from + dy / rowHeight)));
}

/** How far a row moves to make room while another one is dragged from `from` to `to`. */
export function shiftFor(index: number, from: number, to: number, rowHeight: number): number {
  'worklet';
  if (from < 0 || index === from) return 0;
  if (from < index && index <= to) return -rowHeight;
  if (to <= index && index < from) return rowHeight;
  return 0;
}

/** A copy of the list with one item moved. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const out = [...list];
  const [item] = out.splice(from, 1);
  if (item === undefined) return [...list];
  out.splice(Math.max(0, Math.min(out.length, to)), 0, item);
  return out;
}
