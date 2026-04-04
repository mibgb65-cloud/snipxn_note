export type SyncStatus = 'synced' | 'created' | 'updated' | 'deleted';

export interface User {
  id: string;
  email: string;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  gender: number;
  birthday: string | null;
  website: string | null;
  github: string | null;
  location: string | null;
  company: string | null;
  techStack: string | null;
  storageLimit: number;
  storageUsed: number;
  status: 'ACTIVE' | 'BANNED' | 'LOCKED';
  createdAt: string;
  updatedAt: string;
}

export interface UserDevice {
  id: string;
  deviceName: string | null;
  deviceId: string;
  lastLoginIp: string | null;
  lastLoginAt: string;
  isRevoked: boolean;
  createdAt: string;
}

export interface LinkedAccount {
  identityType: 'PASSWORD' | 'GITHUB' | 'GOOGLE';
  identifier: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  icon: string;
  isDefault: boolean;
  rankIndex: string | null;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface Note {
  id: string;
  userId: string;
  folderId: string;
  title: string;
  content: string;
  summary: string | null;
  primaryLanguage: string | null;
  isStarred: boolean;
  isDeleted: boolean;
  status: 'NORMAL' | 'ARCHIVED' | 'LOCKED';
  version: number;
  lastDeviceId: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  tagIds: string[];
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface NoteTag {
  noteId: string;
  tagId: string;
}

export interface PendingDelete {
  id: string;
  tableName: 'folders' | 'notes' | 'tags';
  recordId: string;
  version: number;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  originNoteId: string | null;
  title: string;
  content: string;
  language: string | null;
  tags: string[];
  viewCount: number;
  likeCount: number;
  collectCount: number;
  commentCount: number;
  status: 'PUBLISHED' | 'HIDDEN';
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  createdAt: string;
}

export interface UserFollow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Interaction {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'POST';
  actionType: 'LIKE' | 'COLLECT';
  createdAt: string;
}
