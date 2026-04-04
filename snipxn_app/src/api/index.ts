import * as aiApi from './ai';
import * as appVersionApi from './appVersion';
import * as authApi from './auth';
import * as commentApi from './comment';
import * as fileApi from './file';
import * as followApi from './follow';
import * as folderApi from './folder';
import * as noteApi from './note';
import * as postApi from './post';
import * as sandboxApi from './sandbox';
import * as syncApi from './sync';
import * as tagApi from './tag';
import * as userApi from './user';

export * from './axios';
export {
  aiApi,
  appVersionApi,
  authApi,
  commentApi,
  fileApi,
  followApi,
  folderApi,
  noteApi,
  postApi,
  sandboxApi,
  syncApi,
  tagApi,
  userApi,
};

export const api = {
  ai: aiApi,
  appVersion: appVersionApi,
  auth: authApi,
  comment: commentApi,
  file: fileApi,
  follow: followApi,
  folder: folderApi,
  note: noteApi,
  post: postApi,
  sandbox: sandboxApi,
  sync: syncApi,
  tag: tagApi,
  user: userApi,
};
