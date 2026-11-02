/**
 * FICHIERS — write a file and open the share sheet, or let the user pick
 * one. Nothing is read or sent anywhere else: the user decides where the
 * file goes (Files, mail, Drive…).
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Writes the file in the cache, then opens the share sheet on it. */
export async function shareFile(name: string, content: string, mimeType: string, dialogTitle: string): Promise<void> {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  await file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle });
}

/** The text of a file the user picks. Null when they cancel. */
export async function pickTextFile(mimeTypes: string[]): Promise<string | null> {
  const picked = await File.pickFileAsync({ mimeTypes });
  if (picked.canceled || !picked.result) return null;
  return picked.result.text();
}
