/**
 * When the logger offers the video of the movement: only while it can help.
 * Never done (and not years of training) → put forward; done once or twice → a quiet reminder;
 * done 3 times or more, or years of training → nothing, the exercise page keeps the video.
 */

import type { Experience } from '@/types';

export type MovementHint = 'new' | 'reminder' | 'none';

/** From this many sessions with the exercise, the user knows the movement. */
export const KNOWN_AFTER = 3;

export function movementHint(timesDone: number, experience?: Experience): MovementHint {
  if (experience === 'years' || timesDone >= KNOWN_AFTER) return 'none';
  return timesDone === 0 ? 'new' : 'reminder';
}
