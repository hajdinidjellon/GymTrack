import { describe, expect, it } from '@jest/globals';
import manifest from '@/assets/voice/fr/manifest.json';
import { voiceInventory } from '@/domain/voiceClips';

const recorded: Record<string, string> = manifest;

// Only used to hand the list to the recording script (no Node types in this app)
const { writeFileSync } = require('fs') as { writeFileSync: (path: string, data: string) => void };

describe('voice pack', () => {
  const inventory = voiceInventory();

  // scripts/voice/build_pack.py reads the clips to record from here
  if (process.env.VOICE_INVENTORY_OUT) writeFileSync(process.env.VOICE_INVENTORY_OUT, JSON.stringify(inventory));

  it('holds every clip the app can say, recorded from the same text', () => {
    const missing = inventory.filter((c) => recorded[c.id] !== c.text).map((c) => c.id);
    // Run `python scripts/voice/build_pack.py` to record what is missing
    expect(missing).toEqual([]);
  });
});
