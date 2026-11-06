import { describe, expect, it } from '@jest/globals';
import { clipIds, isRecordedWeight, joinSpoken, slug, spoken, voiceInventory, weightWords } from '@/domain/voiceClips';

describe('recorded weights', () => {
  it.each([
    [1, true],
    [62.5, true],
    [300, true],
    [101.25, true],
    [150.75, false],
    [250.5, false],
    [251, true],
    [13.6, false],
    [0.5, false],
    [301, false],
  ])('%s kg → %s', (kg, recorded) => {
    expect(isRecordedWeight(kg)).toBe(recorded);
  });

  it.each([
    [1, 'un kilo'],
    [20, 'vingt kilos'],
    [62.5, 'soixante-deux kilos et demi'],
    [101.25, 'cent un virgule vingt-cinq kilos'],
    [41.75, 'quarante et un virgule soixante-quinze kilos'],
    [1.5, 'un kilo et demi'],
    [1.25, 'un virgule vingt-cinq kilo'],
  ])('%s kg is said « %s »', (kg, words) => {
    expect(weightWords(kg)).toBe(words);
  });
});

describe('clip ids', () => {
  it('names a clip only for what was recorded', () => {
    expect(clipIds.weight(62.5)).toBe('kg-62.5');
    expect(clipIds.weight(13.6)).toBeNull();
    expect(clipIds.set(21)).toBeNull();
    expect(clipIds.reps(51)).toBeNull();
    expect(clipIds.seconds(45)).toBe('sec-45');
    expect(clipIds.seconds(47)).toBeNull();
    expect(clipIds.plate(20, 5, false)).toBeNull();
    expect(clipIds.plate(3, 1, false)).toBeNull();
    expect(clipIds.nextExercise('Développé couché')).toBe('next-developpe-couche');
    expect(clipIds.nextExercise('Mon exercice')).toBeNull();
  });

  it('turns a name into a file-safe id', () => {
    expect(slug('Élévations latérales (poulie)')).toBe('elevations-laterales-poulie');
  });

  it('joins lines, recorded only if all of them are', () => {
    const a = spoken('A.', ['a']);
    const b = spoken('B.', ['b'], 'note');
    expect(joinSpoken(a, null, b)).toEqual({ text: 'A. B.', clips: ['a', 'b'], tail: 'note' });
    expect(joinSpoken(a, spoken('C.', null)).clips).toBeNull();
  });
});

describe('voice inventory', () => {
  const inventory = voiceInventory();

  it('records every clip once, each with a text', () => {
    const ids = inventory.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(inventory.every((c) => c.text.trim().length > 0)).toBe(true);
  });

  it('holds what the lines ask for', () => {
    const ids = new Set(inventory.map((c) => c.id));
    for (const id of ['set-1', 'last-set-3', 'kg-62.5', 'kg-101.25', 'reps-1', 'sec-600', 'plate-and-4x0.25', 'next-squat', 'done-3', 'hello'])
      expect(ids).toContain(id);
  });

  it('writes the text to record in words', () => {
    const text = (id: string) => inventory.find((c) => c.id === id)?.text;
    expect(text('set-2')).toBe('Série deux.');
    expect(text('kg-62.5')).toBe('Soixante-deux kilos et demi,');
    expect(text('reps-1')).toBe('une rep.');
    expect(text('plate-and-2x20')).toBe('et deux fois vingt');
    expect(text('left-3')).toBe('Plus que trois séries.');
  });
});
