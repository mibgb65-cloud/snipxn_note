import { getDatabase } from '../database';

import { getTagIdsByNoteIdWithExecutor, replaceNoteTags } from './internal';

export function getTagIdsByNoteId(noteId: string): Promise<string[]> {
  return getTagIdsByNoteIdWithExecutor(getDatabase(), noteId);
}

export async function setTagsForNote(noteId: string, tagIds: string[]): Promise<void> {
  await getDatabase().transaction(async tx => {
    await replaceNoteTags(tx, noteId, tagIds);
  });
}

export async function deleteByNoteId(noteId: string): Promise<void> {
  await getDatabase().execute('DELETE FROM note_tags WHERE note_id = ?', [noteId]);
}
