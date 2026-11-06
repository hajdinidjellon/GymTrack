/**
 * RECOVERY CODE ON SCREEN — memory only, never persisted: the code is shown once, then forgotten.
 */

import { create } from 'zustand';

/** Where to go once the code is kept: the app or the goal question after sign-up, the login after a reset. */
export type AfterCode = 'app' | 'goal' | 'login';

interface RecoveryStore {
  /** The code to show, until the user says they kept it. */
  code: string | null;
  username: string;
  then: AfterCode;
  show: (code: string, username: string, then: AfterCode) => void;
  forget: () => void;
}

export const useRecoveryStore = create<RecoveryStore>((set) => ({
  code: null,
  username: '',
  then: 'app',
  show: (code, username, then) => set({ code, username, then }),
  forget: () => set({ code: null }),
}));
