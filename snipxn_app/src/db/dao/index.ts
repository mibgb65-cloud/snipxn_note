import * as folderDao from './folderDao';
import * as noteDao from './noteDao';
import * as noteTagDao from './noteTagDao';
import * as pendingDeleteDao from './pendingDeleteDao';
import * as syncMetaDao from './syncMetaDao';
import * as tagDao from './tagDao';

export {
  folderDao,
  noteDao,
  noteTagDao,
  pendingDeleteDao,
  syncMetaDao,
  tagDao,
};

export const dao = {
  folder: folderDao,
  note: noteDao,
  noteTag: noteTagDao,
  pendingDelete: pendingDeleteDao,
  syncMeta: syncMetaDao,
  tag: tagDao,
};
