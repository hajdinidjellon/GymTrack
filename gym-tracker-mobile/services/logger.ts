/**
 * Logs in development only. In a release build nothing is printed:
 * error messages can carry user data (emails, workout content).
 */
export const logger = {
  warn(message: string, error?: unknown) {
    if (__DEV__) console.warn(`[gymtrack] ${message}`, error ?? '');
  },
  error(message: string, error?: unknown) {
    if (__DEV__) console.error(`[gymtrack] ${message}`, error ?? '');
  },
};
