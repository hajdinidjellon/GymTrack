import { describe, expect, it } from '@jest/globals';
import { requestVoicePermission, startListening, voiceInputAvailable } from '@/services/voiceInput';

// No native module here, like in Expo Go: nothing listens, nothing breaks
describe('voiceInput without the native module', () => {
  it('stays off', async () => {
    expect(voiceInputAvailable()).toBe(false);
    await expect(requestVoicePermission()).resolves.toBe(false);
    expect(() => startListening('fr-FR', [], () => undefined)()).not.toThrow();
  });
});
