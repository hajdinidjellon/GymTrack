/**
 * A second tap this soon after the first is the same tap: "Valider" twice in a row would
 * validate the next set too (no rest between warm-ups or inside a superset), "Commencer"
 * would open two loggers. The tests set it to 0 (jest.setup.ts): they tap faster than anyone.
 */
export const PRESS_LOCK = { ms: 400 };
