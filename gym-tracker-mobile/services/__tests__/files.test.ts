import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system';
import { pickTextFile, shareFile } from '@/services/files';

const written: { uri: string; content?: string; deleted: boolean; created: boolean; exists: boolean }[] = [];

jest.mock('expo-sharing', () => ({ shareAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('expo-file-system', () => {
  class MockFile {
    uri: string;
    exists: boolean;
    record: (typeof written)[number];
    constructor(dir: { uri: string }, name: string) {
      this.uri = `${dir.uri}/${name}`;
      this.exists = name.startsWith('old');
      this.record = { uri: this.uri, deleted: false, created: false, exists: this.exists };
      written.push(this.record);
    }
    delete() {
      this.record.deleted = true;
    }
    create() {
      this.record.created = true;
    }
    async write(content: string) {
      this.record.content = content;
    }
    static pickFileAsync = jest.fn();
  }
  return { File: MockFile, Paths: { cache: { uri: 'file:///cache' } } };
});

const pick = (File as unknown as { pickFileAsync: jest.Mock<(o: unknown) => Promise<unknown>> }).pickFileAsync;

beforeEach(() => {
  written.length = 0;
  jest.clearAllMocks();
});

describe('shareFile', () => {
  it('writes a fresh file in the cache and opens the share sheet on it', async () => {
    await shareFile('okilo.json', '{}', 'application/json', 'Sauvegarde');
    expect(written[0]).toMatchObject({
      uri: 'file:///cache/okilo.json',
      created: true,
      deleted: false,
      content: '{}',
    });
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/okilo.json', {
      mimeType: 'application/json',
      dialogTitle: 'Sauvegarde',
    });
  });

  it('replaces a file left from a previous share', async () => {
    await shareFile('old.csv', 'a;b', 'text/csv', 'Export');
    expect(written[0]).toMatchObject({ deleted: true, created: true, content: 'a;b' });
  });
});

describe('pickTextFile', () => {
  it('reads the picked file', async () => {
    pick.mockResolvedValue({ canceled: false, result: { text: () => Promise.resolve('hello') } });
    await expect(pickTextFile(['*/*'])).resolves.toBe('hello');
    expect(pick).toHaveBeenCalledWith({ mimeTypes: ['*/*'] });
  });

  it('gives null when the user closes the picker', async () => {
    pick.mockResolvedValue({ canceled: true, result: null });
    await expect(pickTextFile(['*/*'])).resolves.toBeNull();
  });
});
