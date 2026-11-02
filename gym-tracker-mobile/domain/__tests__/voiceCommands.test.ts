import { describe, expect, it } from '@jest/globals';
import { normalize, parseCommand } from '@/domain/voiceCommands';

describe('parseCommand', () => {
  it.each([
    ['Fait', { kind: 'validate' }],
    ["C'est fait !", { kind: 'validate' }],
    ['valide', { kind: 'validate' }],
    ['Done', { kind: 'validate' }],
    ['8', { kind: 'reps', reps: 8 }],
    ['huit reps', { kind: 'reps', reps: 8 }],
    ['fait 12', { kind: 'reps', reps: 12 }],
    ['ten', { kind: 'reps', reps: 10 }],
    ['plus tard', { kind: 'later' }],
    ['Later', { kind: 'later' }],
    ['facile', { kind: 'effort', effort: 'easy' }],
    ['juste bien', { kind: 'effort', effort: 'good' }],
    ['à fond', { kind: 'effort', effort: 'max' }],
    ['trop dur', { kind: 'effort', effort: 'max' }],
    ['on y va', { kind: 'skipRest' }],
    ['passe le repos', { kind: 'skipRest' }],
  ])('understands "%s"', (heard, command) => {
    expect(parseCommand(heard)).toEqual(command);
  });

  it("never takes the app's own voice, or a sentence, for a command", () => {
    expect(parseCommand('Série 2. 60 kilos, 10 reps.')).toBeNull();
    expect(parseCommand('Mets 10 de chaque côté.')).toBeNull();
    expect(parseCommand("C'est parti.")).toBeNull();
    expect(parseCommand('tu as vu le match hier soir')).toBeNull();
    expect(parseCommand('')).toBeNull();
    expect(parseCommand('bonjour')).toBeNull();
    expect(parseCommand('0')).toBeNull();
    expect(parseCommand('500')).toBeNull();
  });

  it('cleans what was heard', () => {
    expect(normalize("  C'est FAIT ! ")).toBe('c est fait');
  });
});
