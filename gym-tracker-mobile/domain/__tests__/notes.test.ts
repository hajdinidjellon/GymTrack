import { describe, expect, it } from '@jest/globals';
import { cleanNote, NOTE_MAX_LENGTH } from '@/domain/notes';

describe('cleanNote', () => {
  it('keeps a note on one tidy line', () => {
    expect(cleanNote('  siège   cran 4\nprise serrée ')).toBe('siège cran 4 prise serrée');
  });

  it('turns an empty note into no note', () => {
    expect(cleanNote('')).toBeNull();
    expect(cleanNote(' \n\t ')).toBeNull();
  });

  it('cuts a note that is too long', () => {
    expect(cleanNote('a'.repeat(NOTE_MAX_LENGTH + 50))).toHaveLength(NOTE_MAX_LENGTH);
  });
});
