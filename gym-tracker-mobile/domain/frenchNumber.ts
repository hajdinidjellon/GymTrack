/**
 * NOMBRES EN LETTRES — « soixante-deux », « quatre-vingts », « deux cent un ».
 * Spelling with hyphens everywhere except around « et » (vingt et un),
 * for the texts the voice is recorded from.
 */

const UNITS = [
  'zéro',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
  'dix-sept',
  'dix-huit',
  'dix-neuf',
];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

function belowHundred(n: number): string {
  if (n < 20) return UNITS[n]!;
  const ten = Math.floor(n / 10);
  const unit = n % 10;
  if (ten === 7) return n === 71 ? 'soixante et onze' : `soixante-${UNITS[10 + unit]}`;
  if (ten === 8) return unit === 0 ? 'quatre-vingts' : `quatre-vingt-${UNITS[unit]}`;
  if (ten === 9) return `quatre-vingt-${UNITS[10 + unit]}`;
  if (unit === 0) return TENS[ten]!;
  if (unit === 1) return `${TENS[ten]} et un`;
  return `${TENS[ten]}-${UNITS[unit]}`;
}

/** A whole number from 0 to 9 999, in French words. */
export function frenchNumber(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 9999) throw new RangeError(`frenchNumber: ${n}`);
  if (n < 100) return belowHundred(n);
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const head = hundreds === 1 ? 'cent' : `${UNITS[hundreds]} cent${rest === 0 ? 's' : ''}`;
    return rest === 0 ? head : `${head} ${belowHundred(rest)}`;
  }
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const head = thousands === 1 ? 'mille' : `${UNITS[thousands]} mille`;
  return rest === 0 ? head : `${head} ${frenchNumber(rest)}`;
}
