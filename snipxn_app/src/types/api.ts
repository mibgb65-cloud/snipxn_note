// ===== 认证模块 =====
export interface CheckEmailRequest {
  email: string;
}

export type CheckEmailResponse = boolean | { exists: boolean };

export interface SendCodeRequest {
  email: string;
  scene: 'REGISTER' | 'RESET_PASSWORD';
}

export interface RegisterRequest {
  email: string;
  code: string;
  password: string;
  deviceId: string;
  deviceName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId: string;
  deviceName: string;
}

export interface OAuthLoginRequest {
  code: string;
  redirectUri: string;
  deviceId: string;
  deviceName: string;
}

export interface GoogleMobileLoginRequest {
  googleId: string;
  email: string;
  name: string | null;
  avatar: string | null;
  deviceId: string;
  deviceName: string;
}

export interface GoogleMobileBindRequest {
  googleId: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  userInfo: {
    id: string;
    email: string | null;
    nickname: string | null;
    avatar: string | null;
    bio: string | null;
    gender: number | null;
    birthday: string | null;
    website: string | null;
    github: string | null;
    location: string | null;
    company: string | null;
    techStack: string | null;
    storageUsed: number;
    storageLimit: number;
    status: 'ACTIVE' | 'BANNED' | 'LOCKED' | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
  deviceId: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

// ===== 用户模块 =====
export interface UpdateMeRequest {
  nickname?: string | null;
  avatar?: string | null;
  bio?: string | null;
  gender?: number;
  birthday?: string | null;
  website?: string | null;
  github?: string | null;
  location?: string | null;
  company?: string | null;
  techStack?: string | null;
}

export interface ChangePasswordRequest {
  password: string;
}

export interface OAuthBindRequest {
  code: string;
  redirectUri: string;
}

// ===== 笔记模块 =====
export interface CreateNoteRequest {
  folderId: string;
  title?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  primaryLanguage?: string;
  isStarred?: boolean;
  tagIds?: string[];
  version: number;
}

export interface CreateFolderRequest {
  name: string;
  icon?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  icon?: string;
  rankIndex?: string;
}

export interface CreateTagRequest {
  name: string;
  color?: string | null;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string | null;
}

export interface NoteListParams {
  folderId?: string;
  page?: number;
  size?: number;
}

export interface NoteListItemResponse {
  id: string;
  title: string;
  summary: string | null;
  primaryLanguage: string | null;
  isStarred: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface NoteDetailResponse {
  id: string;
  folderId: string;
  title: string;
  content: string;
  summary: string | null;
  primaryLanguage: string | null;
  isStarred: boolean;
  status: string;
  tagIds: string[];
  version: number;
  lastDeviceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderResponse {
  id: string;
  name: string;
  icon: string;
  isDefault: boolean;
  rankIndex: string | null;
  noteCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagResponse {
  id: string;
  name: string;
  color: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShareStatusResponse {
  shareToken: string | null;
  isShared?: boolean;
}

export interface ShareResponse {
  shareToken: string;
}

export interface StorageBreakdownResponse {
  [key: string]: unknown;
}

export interface ImportNotesResponse {
  [key: string]: unknown;
}

// ===== 同步模块 =====
export interface SyncPushRequest {
  deviceId: string;
  lastPulledAt: string | null;
  folders: SyncFolderChange[];
  notes: SyncNoteChange[];
  tags: SyncTagChange[];
}

export interface SyncFolderChange {
  id: string | null;
  name: string;
  icon: string;
  rankIndex: string | null;
  isDeleted: boolean;
  version: number | null;
}

export interface SyncNoteChange {
  id: string | null;
  folderId: string;
  title: string;
  content: string;
  primaryLanguage: string | null;
  isStarred: boolean;
  isDeleted: boolean;
  version: number | null;
  tagIds: string[];
}

export interface SyncTagChange {
  id: string | null;
  name: string;
  color: string | null;
  isDeleted: boolean;
  version: number | null;
}

export interface SyncPullResponse {
  serverTime: string;
  folders: FolderResponse[];
  notes: NoteDetailResponse[];
  tags: {
    id: string;
    name: string;
    color: string | null;
    version: number;
    updatedAt: string;
  }[];
  deletedItems: {
    tableName: 'folders' | 'notes' | 'tags';
    recordId: string;
    deletedAt: string;
  }[];
}

// ===== 社区模块 =====
export interface CreatePostRequest {
  title: string;
  content: string;
  language?: string;
  tags?: string[];
  originNoteId?: string;
}

export interface PostListParams {
  page?: number;
  size?: number;
}

export interface PostListItemResponse {
  id: string;
  userId: string;
  title: string;
  summary: string;
  language: string | null;
  tags: string[];
  viewCount: number;
  likeCount: number;
  collectCount: number;
  commentCount: number;
  createdAt: string;
  authorNickname: string;
  authorAvatar: string | null;
  isLiked: boolean;
  isCollected: boolean;
}

export interface PostDetailResponse extends PostListItemResponse {
  content: string;
  originNoteId: string | null;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}

export interface CommentListParams {
  page?: number;
  size?: number;
}

export interface CommentResponse {
  id: string;
  postId?: string;
  userId: string;
  content: string;
  parentId: string | null;
  replyToUserId?: string | null;
  replyToNickname?: string | null;
  likeCount: number;
  createdAt: string;
  authorNickname: string;
  authorAvatar: string | null;
  isLiked: boolean;
  liked?: boolean;
  replyCount?: number;
}

// ===== 关注模块 =====
export interface FollowStatsResponse {
  followingCount: number;
  followerCount: number;
}

export interface UserProfileResponse {
  id: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  createdAt: string;
  postCount: number;
  primaryLanguage: string | null;
  website: string | null;
  github: string | null;
  location: string | null;
  company: string | null;
  techStack: string | null;
  isFollowing: boolean | null;
  followingCount: number;
  followerCount: number;
}

// ===== 文件模块 =====
export interface UploadResponse {
  fileId: string;
  url: string;
  fileSize: number;
}

// ===== AI 模块 =====
export interface ReviewRequest {
  code: string;
  errorMessage: string;
  language?: string | null;
}

export interface AiResponse {
  content: string;
  model: string | null;
  totalTokens: number | null;
}

export type ReviewResponse = AiResponse;

export interface GenerateRequest {
  description: string;
  language?: string | null;
}

export type GenerateResponse = AiResponse;

// ===== 沙盒模块 =====
export interface RunCodeRequest {
  language: string;
  sourceCode: string;
  stdin?: string;
}

export interface RunCodeResponse {
  stdout?: string | null;
  stderr?: string | null;
  status?: string;
  executionTime?: string | null;
  executionTimeMs?: number | null;
  duration?: string | null;
  durationMs?: number | null;
  memory?: string | null;
  memoryUsed?: string | number | null;
  memoryBytes?: number | null;
  memoryKb?: number | null;
  memoryMb?: number | null;
  exitCode?: number | null;
  [key: string]: unknown;
}

// ===== 版本更新 =====
export type AppVersionPlatform = 'ANDROID' | 'IOS';

export interface AppVersionResponse {
  version: string;
  buildNumber?: string | null;
  build_number?: string | null;
  updateUrl?: string | null;
  update_url?: string | null;
  releaseNotes?: string | null;
  release_notes?: string | null;
  publishedAt?: string | null;
  published_at?: string | null;
}

export interface AppVersionInfo {
  version: string;
  buildNumber: string | null;
  updateUrl: string | null;
  releaseNotes: string | null;
  publishedAt: string | null;
}
// ===== 通用 =====
export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  total: number;
  list: T[];
}

