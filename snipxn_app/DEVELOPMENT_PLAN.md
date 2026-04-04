# Snipxn Android 端开发计划

> 本文档为 Codex 逐步执行的开发任务清单。每个 Step 是一个独立可执行的小任务，按顺序执行。标注 `🔍 审查点` 的位置需要暂停，将代码交给 Claude 进行审查后再继续。

---

## 项目背景

Snipxn 是一个**代码片段笔记 + 社区分享**平台，已有 Spring Boot 后端（74 个 REST API）和 Vue 3 Web 前端。现在需要开发 Android 客户端（React Native），需适配手机和平板。

**后端 API 基础路径**：`/api/v1/`
**认证方式**：Bearer JWT Token（Access Token + Refresh Token）
**数据库主键**：UUID（客户端可生成）
**同步机制**：时间戳增量同步 + 乐观锁版本控制
**UI 组件库**：HeroUI Native（https://heroui.com/docs/native/getting-started）+ Uniwind（Tailwind CSS v4 for RN）

---

## 阶段一：项目骨架与基础设施

### Step 1：安装核心依赖

在项目根目录 `E:/web/snipxn_app` 执行安装。项目已经初始化好了 React Native 0.84.1 + TypeScript，在此基础上安装以下依赖：

> **注意**：部分依赖已经安装好了（见当前 package.json），只需补装缺失的即可。安装前先对比已有依赖，避免重复。

**UI 组件库（HeroUI Native + Uniwind）：**
```
heroui-native uniwind tailwindcss tailwind-variants@^3.2.2 tailwind-merge@^3.4.0 react-native-svg@^15.12.1
```

**HeroUI 可选依赖（BottomSheet、Dialog、Menu、Popover、Select、Toast 组件需要）：**
```
react-native-screens@^4.16.0 @gorhom/bottom-sheet@^5.2.8
```

**导航：**
```
@react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs @react-navigation/drawer
```

**状态管理：**
```
zustand
```

**网络请求：**
```
axios
```

**本地数据库：**
```
@op-engineering/op-sqlite
```

**安全存储（Token）：**
```
react-native-keychain
```

**网络状态监听：**
```
@react-native-community/netinfo
```

**设备信息（生成 deviceId）：**
```
react-native-device-info
```

**UUID 生成：**
```
uuid
```

**图片选择器：**
```
react-native-image-picker
```

**其他：**
```
@react-native-async-storage/async-storage@2.2.0
```

> **重要**：`@react-native-async-storage/async-storage` 必须使用 **2.2.0** 版本，3.x 版本有 Android 编译兼容问题。
> **重要**：`react-native-vector-icons` 不再需要，HeroUI Native 自带图标系统。

**已预装的依赖（无需重复安装）：**
```
react-native-gesture-handler react-native-reanimated react-native-worklets
react-native-safe-area-context react-native-screens
```

安装完成后执行编译验证：
```bash
cd android && ./gradlew app:installDebug
```

---

### Step 1.5：配置 Uniwind（Tailwind CSS for React Native）

HeroUI Native 依赖 Uniwind 作为样式引擎，必须先配置好。

**1. 创建 `src/global.css`：**

```css
@import 'tailwindcss';
@import 'uniwind';

@import 'heroui-native/styles';

@source './node_modules/heroui-native/lib';
```

> `@source` 的路径相对于 global.css 所在目录。如果 global.css 放在 `src/` 下，路径为 `../node_modules/heroui-native/lib`。

**2. 在 `App.tsx` 中导入 global.css（不要在 index.js 中导入，否则热重载失效）：**

```tsx
import './src/global.css';
```

**3. 修改 `metro.config.js`：**

```js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const baseConfig = getDefaultConfig(__dirname);

// withUniwindConfig 必须是最外层包装
module.exports = withUniwindConfig(
  mergeConfig(baseConfig, {
    // 其他自定义 metro 配置
  }),
  {
    cssEntryFile: './src/global.css',
    dtsFile: './src/uniwind-types.d.ts',
  }
);
```

> **关键**：`withUniwindConfig` 必须是最外层包装器。使用相对路径，不要用 `path.resolve()`。

**4. 修改 `App.tsx`，包装 HeroUI Provider：**

```tsx
import './src/global.css';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HeroUINativeProvider>
          {/* 后续放导航 */}
        </HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
```

**5. 验证 HeroUI 组件可用：**

临时在 App 中放一个 HeroUI Button 测试：
```tsx
import { Button } from 'heroui-native';
import { View } from 'react-native';

// 在 HeroUINativeProvider 内部
<View className="flex-1 justify-center items-center bg-background">
  <Button onPress={() => console.log('HeroUI works!')}>Hello HeroUI</Button>
</View>
```

编译运行，确认按钮正常显示后再继续。

---

### Step 2：创建项目目录结构

在 `E:/web/snipxn_app/src/` 下创建以下目录结构，每个目录放一个空的 `index.ts` 作为入口文件（只写 `export {};` 即可）：

```
src/
├── api/                # API 请求层
├── stores/             # Zustand 状态管理
├── db/                 # 本地数据库
│   ├── dao/            # 数据访问对象
│   └── sync/           # 同步引擎
├── navigation/         # 导航配置
├── screens/            # 页面
│   ├── auth/           # 认证相关页面
│   ├── main/           # 主工作区页面
│   ├── community/      # 社区页面
│   └── settings/       # 设置页面
├── components/         # 可复用组件
│   ├── common/         # 通用组件
│   ├── note/           # 笔记相关组件
│   ├── community/      # 社区相关组件
│   └── sidebar/        # 侧边栏组件
├── hooks/              # 自定义 Hooks
├── theme/              # 主题系统
├── i18n/               # 国际化
├── types/              # TypeScript 类型定义
└── utils/              # 工具函数
```

---

### Step 3：TypeScript 类型定义

在 `src/types/` 下创建以下类型文件，所有类型严格对齐后端数据库字段。

**`src/types/models.ts`** — 数据模型类型：

```typescript
// ===== 基础类型 =====
export type SyncStatus = 'synced' | 'created' | 'updated' | 'deleted';

// ===== 用户模块 =====
export interface User {
  id: string;             // UUID
  email: string;
  nickname: string | null;
  avatar: string | null;  // 格式 /api/v1/files/{id}
  bio: string | null;
  gender: number;         // 0-未知 1-男 2-女
  birthday: string | null;
  storageLimit: number;   // 字节
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

// ===== 笔记模块 =====
export interface Folder {
  id: string;
  userId: string;
  name: string;
  icon: string;           // Emoji 或内置图标 ID，默认 'folder'
  isDefault: boolean;
  rankIndex: string | null; // LexoRank 排序
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  // 本地专用
  syncStatus: SyncStatus;
}

export interface Note {
  id: string;
  userId: string;
  folderId: string;
  title: string;          // 默认 '无标题笔记'
  content: string;        // Markdown 全文
  summary: string | null; // 纯文本摘要，前200字
  primaryLanguage: string | null; // 如 java / python
  isStarred: boolean;
  isDeleted: boolean;
  status: 'NORMAL' | 'ARCHIVED' | 'LOCKED';
  version: number;
  lastDeviceId: string | null;
  createdAt: string;
  updatedAt: string;
  // 本地专用
  syncStatus: SyncStatus;
  tagIds: string[];       // 关联的标签 ID 列表
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string | null;   // 如 #7B3FE4
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  // 本地专用
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

// ===== 社区模块 =====
export interface Post {
  id: string;
  userId: string;
  originNoteId: string | null;
  title: string;
  content: string;
  language: string | null;
  tags: string[];         // JSONB 数组如 ["React", "CSS"]
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
  parentId: string | null; // 回复的父评论 ID
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
```

**`src/types/api.ts`** — API 请求/响应类型：

```typescript
// ===== 认证模块 =====
export interface SendCodeRequest {
  email: string;
  scene: 'REGISTER' | 'RESET_PASSWORD';
}

export interface RegisterRequest {
  email: string;
  code: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId: string;
  deviceName: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  userInfo: {
    id: string;
    nickname: string | null;
    avatar: string | null;
    bio: string | null;
    storageUsed: number;
    storageLimit: number;
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

// ===== 同步模块 =====
export interface SyncPushRequest {
  deviceId: string;
  lastPulledAt: string | null;
  folders: SyncFolderChange[];
  notes: SyncNoteChange[];
  tags: SyncTagChange[];
}

export interface SyncFolderChange {
  id: string | null;     // null 表示新建
  name: string;
  icon: string;
  rankIndex: string | null;
  isDeleted: boolean;
  version: number | null; // null 表示新建
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
  serverTime: string;    // ISO 8601，保存为 last_pulled_at
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
  // 作者信息（后端 JOIN 返回）
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

export interface CommentResponse {
  id: string;
  userId: string;
  content: string;
  parentId: string | null;
  likeCount: number;
  createdAt: string;
  authorNickname: string;
  authorAvatar: string | null;
  isLiked: boolean;
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
  isFollowing: boolean;
  followingCount: number;
  followerCount: number;
}

// ===== 文件模块 =====
export interface UploadResponse {
  fileId: string;
  url: string;           // /api/v1/files/{id}
  fileSize: number;
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
```

---

### Step 4：主题系统

HeroUI Native 自带完善的主题系统，支持 light/dark 模式和 Tailwind CSS 类名。我们在此基础上做少量扩展。

**`src/theme/colors.ts`** — 品牌色扩展（HeroUI 已内置 background/foreground/primary 等语义色，这里只定义 HeroUI 没有的）：
```typescript
// HeroUI 已内置的语义色通过 Tailwind className 使用，如：
// bg-background, bg-content1, text-foreground, text-primary, bg-danger, bg-success 等
// 以下为项目自定义扩展色
export const brandColors = {
  star: '#F59E0B',
  codeBackground: {
    light: '#F8F8F8',
    dark: '#2D2D2D',
  },
};
```

**`src/theme/typography.ts`**：
```typescript
// 根据设备类型（手机/平板）返回不同字体大小
// 配合 Tailwind className 使用，如 className={`text-${typography.body}`}
export const createTypography = (isTablet: boolean) => ({
  h1: isTablet ? 'text-3xl font-bold' : 'text-2xl font-bold',
  h2: isTablet ? 'text-xl font-semibold' : 'text-lg font-semibold',
  h3: isTablet ? 'text-lg font-semibold' : 'text-base font-semibold',
  body: isTablet ? 'text-base' : 'text-sm',
  bodySmall: isTablet ? 'text-sm' : 'text-xs',
  caption: isTablet ? 'text-xs' : 'text-[10px]',
  code: isTablet ? 'text-[15px] font-mono' : 'text-[13px] font-mono',
});
```

**`src/theme/ThemeContext.tsx`**：

创建 React Context，管理主题切换：
- 使用 `useColorScheme()` 获取系统主题作为默认值
- 提供 `theme`（'light' | 'dark'）、`toggleTheme`、`isTablet`、`typography`
- HeroUI 的 `HeroUINativeProvider` 自带 dark mode 支持，通过 `colorScheme` prop 传递当前主题
- 将用户选择持久化到 AsyncStorage

**更新 App.tsx 的 Provider 结构：**
```tsx
<GestureHandlerRootView style={{ flex: 1 }}>
  <SafeAreaProvider>
    <ThemeProvider>
      <HeroUINativeProvider colorScheme={theme}>
        {/* 导航 */}
      </HeroUINativeProvider>
    </ThemeProvider>
  </SafeAreaProvider>
</GestureHandlerRootView>
```

> **样式规范**：全项目统一使用 Tailwind className 写样式（通过 Uniwind），不再使用 `StyleSheet.create()`。HeroUI 组件直接用其内置 props/variants 定制外观。

---

### Step 5：自定义 Hooks

**`src/hooks/useDeviceType.ts`**：

使用 `useWindowDimensions()` 返回设备信息：
```typescript
interface DeviceType {
  isTablet: boolean;         // 宽度 >= 600
  isLandscape: boolean;      // 宽度 > 高度
  isTabletLandscape: boolean; // 宽度 >= 960
  screenWidth: number;
  screenHeight: number;
  // 布局断点
  showSidebar: boolean;      // >= 600 时常驻侧边栏
  showMasterDetail: boolean; // >= 960 时使用 Master-Detail
  columns: number;           // 社区卡片列数：1 / 2 / 3
}
```

断点定义：
- `< 600`：手机模式，单栏，底部 Tab 导航
- `600 ~ 959`：平板竖屏，双栏，侧边 Drawer
- `>= 960`：平板横屏，三栏，常驻侧边栏

**`src/hooks/useAutoSave.ts`**：

防抖自动保存 Hook，2 秒无输入后触发保存回调：
```typescript
function useAutoSave(callback: () => void, delay?: number): {
  trigger: () => void;   // 内容变化时调用
  flush: () => void;     // 立即保存（如离开页面时）
  isPending: boolean;    // 是否有待保存的内容
}
```

**`src/hooks/useAuth.ts`**：

认证状态 Hook，从 Zustand authStore 读取：
```typescript
function useAuth(): {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
}
```

---

### Step 6：工具函数

**`src/utils/deviceId.ts`**：

使用 `react-native-device-info` 生成唯一设备指纹，格式为 `Android_{uniqueId}`。首次生成后缓存到 AsyncStorage，后续读取缓存。这个 deviceId 对应后端 `user_devices.device_id` 字段。

**`src/utils/markdown.ts`**：

提供 `buildSummary(content: string): string` 函数，去除 Markdown 符号后截取前 200 字作为纯文本摘要。与后端 `MarkdownUtils.buildSummary()` 逻辑一致，保存笔记时本地也生成摘要。

**`src/utils/uuid.ts`**：

封装 `uuid` 库的 `v4()` 方法，提供 `generateUUID(): string`。新建笔记/文件夹/标签时在客户端本地生成 UUID 作为主键，无需请求服务端。

**`src/utils/time.ts`**：

提供时间格式化工具函数：
- `formatRelativeTime(isoString: string): string` — "刚刚" / "5分钟前" / "昨天" / "2025-03-15"
- `toISOString(): string` — 返回当前时间的 ISO 8601 字符串
- `parseISO(str: string): Date`

---

## 🔍 审查点 A

> **执行完 Step 1 ~ 6 后暂停。** 将项目交给 Claude 审查以下内容：
> 1. 依赖是否安装正确，项目是否能编译
> 2. 类型定义是否完整、与后端对齐
> 3. 目录结构是否合理
> 4. 主题系统和 Hooks 的实现质量

---

## 阶段二：API 层与网络请求

### Step 7：Axios 实例与拦截器

**`src/api/axios.ts`**：

创建 Axios 实例，配置如下：
- `baseURL`：从环境变量读取，开发环境默认 `http://10.0.2.2:8080/api/v1`（Android 模拟器访问宿主机），真机改为局域网 IP
- `timeout`：15000ms
- 请求拦截器：从 `react-native-keychain` 读取 accessToken，添加到 `Authorization: Bearer {token}` 头
- 响应拦截器：
  - 成功：解包 `ApiResult<T>` 结构，直接返回 `data` 字段
  - 401 错误：自动调用 `/auth/refresh` 刷新 Token，刷新成功后重试原请求，刷新失败则清除本地登录态并跳转登录页
  - Token 刷新逻辑需要防止并发刷新（用 Promise 队列，多个 401 请求只触发一次 refresh）
  - 其他错误：统一包装为 `{ code, message }` 格式抛出

---

### Step 8：API 模块（对齐后端 14 个 Controller 的接口）

每个文件导出一组函数，使用 Step 7 创建的 axios 实例。

**`src/api/auth.ts`** — 认证接口（对接 AuthController）：
```
- checkEmail(email) → POST /auth/check-email
- sendCode(req: SendCodeRequest) → POST /auth/code
- register(req: RegisterRequest) → POST /auth/register
- login(req: LoginRequest) → POST /auth/login → LoginResponse
- refresh(req: RefreshTokenRequest) → POST /auth/refresh → TokenResponse
- resetPassword(req: ResetPasswordRequest) → POST /auth/reset-password
- logout() → POST /auth/logout
- oauthGithub(code, redirectUri, deviceId, deviceName) → POST /auth/oauth/github
- oauthGoogle(code, redirectUri, deviceId, deviceName) → POST /auth/oauth/google
```

**`src/api/user.ts`** — 用户接口（对接 UserController）：
```
- getMe() → GET /user/me
- updateMe(data) → PUT /user/me
- changePassword(password) → PUT /user/me/password
- getDevices() → GET /user/me/devices
- revokeDevice(deviceId) → DELETE /user/me/devices/{deviceId}
- revokeOtherDevices() → DELETE /user/me/devices
- getLinkedAccounts() → GET /user/me/linked-accounts
- bindGithub(code, redirectUri) → POST /user/me/linked-accounts/github
- bindGoogle(code, redirectUri) → POST /user/me/linked-accounts/google
- unlinkAccount(identityType) → DELETE /user/me/linked-accounts/{identityType}
```

**`src/api/folder.ts`** — 文件夹接口（对接 FolderController）：
```
- listFolders() → GET /folders → FolderResponse[]
- createFolder(req: CreateFolderRequest) → POST /folders
- updateFolder(id, req: UpdateFolderRequest) → PUT /folders/{id}
- deleteFolder(id) → DELETE /folders/{id}
```

**`src/api/note.ts`** — 笔记接口（对接 NoteController）：
```
- listNotes(params: { folderId?, page?, size? }) → GET /notes → PageResult<NoteListItemResponse>
- listStarred(params) → GET /notes/starred
- listTrash(params) → GET /notes/trash
- getNoteDetail(id) → GET /notes/{id} → NoteDetailResponse
- createNote(req: CreateNoteRequest) → POST /notes
- updateNote(id, req: UpdateNoteRequest) → PUT /notes/{id}
- deleteNote(id) → DELETE /notes/{id}（移入回收站）
- restoreNote(id) → POST /notes/{id}/restore
- permanentDelete(id) → DELETE /notes/{id}/permanent
- getShareStatus(id) → GET /notes/{id}/share
- shareNote(id) → POST /notes/{id}/share
- cancelShare(id) → DELETE /notes/{id}/share
- getStorageBreakdown() → GET /notes/storage-breakdown
- importNotes(file) → POST /notes/import（multipart/form-data）
```

**`src/api/tag.ts`** — 标签接口（对接 TagController）：
```
- listTags() → GET /tags
- createTag(req) → POST /tags
- updateTag(id, req) → PUT /tags/{id}
- deleteTag(id) → DELETE /tags/{id}
```

**`src/api/sync.ts`** — 同步接口（对接 SyncController）：
```
- pull(lastPulledAt?: string) → GET /sync/pull → SyncPullResponse
- push(req: SyncPushRequest) → POST /sync/push
```

**`src/api/post.ts`** — 帖子接口（对接 PostController）：
```
- listPosts(params: { page?, size? }) → GET /posts → PageResult<PostListItemResponse>
- listUserPosts(userId, params) → GET /posts/user/{userId}
- listHotPosts(params) → GET /posts/hot
- getPostDetail(id) → GET /posts/{id} → PostDetailResponse
- createPost(req: CreatePostRequest) → POST /posts
- deletePost(id) → DELETE /posts/{id}
- likePost(id) → POST /posts/{id}/like
- unlikePost(id) → DELETE /posts/{id}/like
- collectPost(id) → POST /posts/{id}/collect
- uncollectPost(id) → DELETE /posts/{id}/collect
- sharePost(id) → POST /posts/{id}/share
- getShareStatus(id) → GET /posts/{id}/share
- cancelShare(id) → DELETE /posts/{id}/share
```

**`src/api/comment.ts`** — 评论接口（对接 CommentController）：
```
- listComments(postId, params) → GET /posts/{postId}/comments
- listReplies(postId, commentId, params) → GET /posts/{postId}/comments/{commentId}/replies
- createComment(postId, req: CreateCommentRequest) → POST /posts/{postId}/comments
- deleteComment(postId, commentId) → DELETE /posts/{postId}/comments/{commentId}
- likeComment(postId, commentId) → POST /posts/{postId}/comments/{commentId}/like
- unlikeComment(postId, commentId) → DELETE /posts/{postId}/comments/{commentId}/like
```

**`src/api/follow.ts`** — 关注接口（对接 FollowController）：
```
- follow(userId) → POST /follow/{userId}
- unfollow(userId) → DELETE /follow/{userId}
- getFollowing() → GET /follow/following
- getFollowers() → GET /follow/followers
- getRecommended() → GET /follow/recommended
- getStats() → GET /follow/stats → FollowStatsResponse
- getUserProfile(userId) → GET /follow/user/{userId}/profile → UserProfileResponse
```

**`src/api/file.ts`** — 文件接口（对接 UploadController）：
```
- uploadFile(file: FormData) → POST /files → UploadResponse
- getFileUrl(fileId: string) → 返回完整 URL 字符串 `${baseURL}/files/${fileId}`
```

**`src/api/ai.ts`** — AI 接口（对接 AiController）：
```
- review(code: string) → POST /ai/review
- generate(prompt: string) → POST /ai/generate
```

**`src/api/sandbox.ts`** — 沙盒接口（对接 SandboxController）：
```
- runCode(req: { language: string; sourceCode: string; stdin?: string }) → POST /sandbox/run
```

---

## 🔍 审查点 B

> **执行完 Step 7 ~ 8 后暂停。** 将项目交给 Claude 审查：
> 1. Axios 拦截器和 Token 刷新逻辑
> 2. 所有 API 函数签名是否与后端接口一一对应
> 3. 错误处理是否完善

---

## 阶段三：本地数据库与离线存储

### Step 9：数据库初始化与建表

**`src/db/schema.ts`**：

定义所有 CREATE TABLE 的 SQL 语句，作为字符串常量导出。

**表结构：**

```sql
-- 同步元数据
CREATE TABLE IF NOT EXISTS sync_meta (
    key   TEXT PRIMARY KEY,
    value TEXT
);

-- 文件夹
CREATE TABLE IF NOT EXISTS folders (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    name        TEXT NOT NULL,
    icon        TEXT NOT NULL DEFAULT 'folder',
    is_default  INTEGER NOT NULL DEFAULT 0,
    rank_index  TEXT,
    is_deleted  INTEGER NOT NULL DEFAULT 0,
    version     INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced'
);

-- 笔记
CREATE TABLE IF NOT EXISTS notes (
    id               TEXT PRIMARY KEY,
    user_id          TEXT NOT NULL,
    folder_id        TEXT NOT NULL,
    title            TEXT NOT NULL DEFAULT '无标题笔记',
    content          TEXT NOT NULL DEFAULT '',
    summary          TEXT,
    primary_language TEXT,
    is_starred       INTEGER NOT NULL DEFAULT 0,
    is_deleted       INTEGER NOT NULL DEFAULT 0,
    status           TEXT NOT NULL DEFAULT 'NORMAL',
    version          INTEGER NOT NULL DEFAULT 1,
    last_device_id   TEXT,
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL,
    sync_status      TEXT NOT NULL DEFAULT 'synced'
);

CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_starred ON notes(user_id) WHERE is_starred = 1 AND is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_notes_trash ON notes(user_id) WHERE is_deleted = 1;

-- 标签
CREATE TABLE IF NOT EXISTS tags (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    name        TEXT NOT NULL,
    color       TEXT,
    is_deleted  INTEGER NOT NULL DEFAULT 0,
    version     INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced',
    UNIQUE(user_id, name)
);

-- 笔记-标签关联
CREATE TABLE IF NOT EXISTS note_tags (
    note_id TEXT NOT NULL,
    tag_id  TEXT NOT NULL,
    PRIMARY KEY (note_id, tag_id)
);

-- 待同步删除记录
CREATE TABLE IF NOT EXISTS pending_deletes (
    id         TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id  TEXT NOT NULL,
    version    INTEGER NOT NULL,
    created_at TEXT NOT NULL
);
```

**`src/db/database.ts`**：

提供以下功能：
- `initDatabase()` — 打开 op-sqlite 数据库（库名 `snipxn.db`），执行所有建表语句
- `getDatabase()` — 获取已初始化的数据库实例（单例）
- `resetDatabase()` — 删库重建（用于退出登录时清除本地数据）

在 App 启动时（App.tsx 的 useEffect 中）调用 `initDatabase()`。

---

### Step 10：DAO 层（数据访问对象）

每个 DAO 文件封装一张表的所有 SQL 操作。

**`src/db/dao/syncMetaDao.ts`**：
```
- getMeta(key: string): Promise<string | null>
- setMeta(key: string, value: string): Promise<void>
- getLastPulledAt(): Promise<string | null>
- setLastPulledAt(time: string): Promise<void>
- getDeviceId(): Promise<string>
```

**`src/db/dao/folderDao.ts`**：
```
- getAll(userId: string): Promise<Folder[]>           // WHERE is_deleted=0 ORDER BY rank_index
- getById(id: string): Promise<Folder | null>
- getDefault(userId: string): Promise<Folder>          // WHERE is_default=1
- insert(folder: Folder): Promise<void>
- update(folder: Partial<Folder> & { id: string }): Promise<void>
- markDeleted(id: string, version: number): Promise<void>  // 设 is_deleted=1, sync_status='deleted'，写 pending_deletes
- getDirty(): Promise<Folder[]>                        // WHERE sync_status != 'synced'
- upsertFromServer(folder: FolderResponse): Promise<void>  // Pull 时用，INSERT OR REPLACE
- resetSyncStatus(): Promise<void>                     // 全部重置为 'synced'
```

**`src/db/dao/noteDao.ts`**：
```
- getByFolder(folderId: string, page: number, size: number): Promise<Note[]>
- getStarred(userId: string): Promise<Note[]>          // WHERE is_starred=1 AND is_deleted=0
- getTrash(userId: string): Promise<Note[]>            // WHERE is_deleted=1
- getById(id: string): Promise<Note | null>            // 含 tagIds（JOIN note_tags）
- search(userId: string, query: string): Promise<Note[]>  // 搜索 title 和 content
- insert(note: Note): Promise<void>                    // 同时插入 note_tags
- update(note: Partial<Note> & { id: string }): Promise<void>  // 同时更新 note_tags
- markDeleted(id: string, version: number): Promise<void>
- restore(id: string): Promise<void>                   // 恢复：is_deleted=0, sync_status='updated'
- permanentDelete(id: string): Promise<void>           // 物理删除
- getDirty(): Promise<Note[]>                          // 含 tagIds
- upsertFromServer(note: NoteDetailResponse): Promise<void>
- resetSyncStatus(): Promise<void>
- getNoteCount(folderId: string): Promise<number>
```

**`src/db/dao/tagDao.ts`**：
```
- getAll(userId: string): Promise<Tag[]>               // WHERE is_deleted=0
- getById(id: string): Promise<Tag | null>
- insert(tag: Tag): Promise<void>
- update(tag: Partial<Tag> & { id: string }): Promise<void>
- markDeleted(id: string, version: number): Promise<void>
- getDirty(): Promise<Tag[]>
- upsertFromServer(tag): Promise<void>
- resetSyncStatus(): Promise<void>
```

**`src/db/dao/noteTagDao.ts`**：
```
- getTagIdsByNoteId(noteId: string): Promise<string[]>
- setTagsForNote(noteId: string, tagIds: string[]): Promise<void>  // 先 DELETE 再批量 INSERT
- deleteByNoteId(noteId: string): Promise<void>
```

**`src/db/dao/pendingDeleteDao.ts`**：
```
- getAll(): Promise<PendingDelete[]>
- insert(item: PendingDelete): Promise<void>
- clearAll(): Promise<void>
```

**重要**：所有 DAO 方法中涉及多表操作的（如创建笔记时同时写 note_tags），必须使用数据库事务（`db.transaction()`）。

---

### Step 11：同步引擎

**`src/db/sync/networkMonitor.ts`**：

使用 `@react-native-community/netinfo` 监听网络状态变化：
- 导出 `startNetworkMonitor(onOnline: () => void)` — 当网络从离线变为在线时回调
- 导出 `stopNetworkMonitor()`
- 导出 `isOnline(): Promise<boolean>`

**`src/db/sync/pushService.ts`**：

```typescript
async function pushChanges(): Promise<void> {
  // 1. 从 DAO 收集所有 sync_status != 'synced' 的记录
  // 2. 从 pendingDeleteDao 收集待删除记录
  // 3. 如果全部为空，直接 return（无需推送）
  // 4. 组装 SyncPushRequest 对象：
  //    - created 的记录：id 设为实际 UUID，version 设为 null（后端识别为新建）
  //    - updated 的记录：id 和 version 设为当前值
  //    - pending_deletes 的记录：isDeleted 设为 true，version 设为删除时记录的版本
  // 5. 调用 api.sync.push(request)
  // 6. 成功后：
  //    - 各表执行 resetSyncStatus()
  //    - pendingDeleteDao.clearAll()
  //    - 对于本地标记为 deleted 的记录，物理删除
}
```

**`src/db/sync/pullService.ts`**：

```typescript
async function pullChanges(): Promise<void> {
  // 1. 从 syncMetaDao 读取 lastPulledAt
  // 2. 调用 api.sync.pull(lastPulledAt)
  // 3. 在一个事务中处理所有返回数据：
  //
  //    对于 folders：
  //      遍历每个 folder：
  //        - 查本地是否存在
  //        - 不存在 → INSERT（sync_status='synced'）
  //        - 存在且 sync_status='synced' → 直接 UPDATE 覆盖
  //        - 存在且 sync_status!='synced' → 冲突处理（服务端 version 更高则覆盖，否则保留本地）
  //
  //    对于 notes：
  //      遍历每个 note：
  //        - 同文件夹逻辑
  //        - 额外处理 note_tags 关联（DELETE 旧关联 → INSERT 新关联）
  //
  //    对于 tags：
  //      遍历每个 tag（同逻辑）
  //
  //    对于 deletedItems：
  //      遍历每项：
  //        - 物理删除本地对应记录
  //        - 如果是 notes，同时删除 note_tags 关联
  //
  // 4. 保存 serverTime 到 syncMetaDao 作为新的 lastPulledAt
}
```

**`src/db/sync/conflictResolver.ts`**：

```typescript
// 冲突处理策略：服务端优先（Last-Write-Wins）
// 如果服务端 version > 本地 version → 覆盖本地，sync_status 设为 'synced'
// 如果服务端 version <= 本地 version → 保留本地变更（下次 push 会再尝试）
function resolveConflict(tableName: string, local: any, remote: any): 'use_remote' | 'keep_local';
```

**`src/db/sync/syncEngine.ts`**：

主入口，协调 push 和 pull：
```typescript
async function syncAll(): Promise<SyncResult> {
  // 1. 检查是否在线（isOnline）
  //    - 离线则直接 return { status: 'offline' }
  // 2. 检查是否已有同步任务在进行（防并发，用 mutex 标志位）
  //    - 有则 return { status: 'already_syncing' }
  // 3. try:
  //    a. await pushChanges()
  //    b. await pullChanges()
  //    c. return { status: 'success' }
  // 4. catch:
  //    - 网络错误 → return { status: 'network_error' }
  //    - 401 错误 → return { status: 'auth_error' }（触发重新登录）
  //    - 其他错误 → return { status: 'error', message }
  // 5. finally: 释放 mutex
}

// 导出同步状态类型
type SyncResult = {
  status: 'success' | 'offline' | 'already_syncing' | 'network_error' | 'auth_error' | 'error';
  message?: string;
};
```

---

## 🔍 审查点 C

> **执行完 Step 9 ~ 11 后暂停。** 将项目交给 Claude 审查：
> 1. 数据库 Schema 是否与后端完全对齐
> 2. DAO 层 SQL 是否正确（特别是事务、索引）
> 3. 同步引擎的 push/pull 逻辑是否严谨
> 4. 冲突处理策略是否合理
> 5. 网络监听和并发控制是否可靠

---

## 阶段四：Zustand 状态管理

### Step 12：Auth Store

**`src/stores/authStore.ts`**：

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;     // computed: !!accessToken
  isNewUser: boolean;           // 需要设置昵称

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, code: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  setUser: (user: User) => void;
  clearAuth: () => void;       // 清除所有登录态 + 清空本地数据库
  restoreSession: () => Promise<void>; // App 启动时从 keychain 恢复 Token
}
```

关键逻辑：
- `login`：调用 `api.auth.login()` → 将 Token 存入 `react-native-keychain` → 将 userInfo 存入 state → 触发首次全量同步
- `logout`：调用 `api.auth.logout()` → 清除 keychain → 重置所有 store → 调用 `resetDatabase()` 清除本地数据
- `restoreSession`：App 启动时从 keychain 读取 Token，如有则设为已登录态，然后调用 `api.user.getMe()` 获取最新用户信息
- Token 存储在 `react-native-keychain`（安全加密），不用 AsyncStorage

---

### Step 13：Folder Store

**`src/stores/folderStore.ts`**：

```typescript
interface FolderState {
  folders: Folder[];
  activeFolderId: string | null;
  loading: boolean;

  // Actions
  fetchFolders: () => Promise<void>;       // 从本地 DB 读取
  createFolder: (name: string, icon?: string) => Promise<void>;
  updateFolder: (id: string, data: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  setActiveFolder: (id: string | null) => void;
}
```

关键逻辑：
- **所有读操作从本地 DB 读取**（folderDao.getAll）
- **所有写操作先写本地 DB**（设 sync_status 为 created/updated/deleted），再尝试同步
- `createFolder`：用 `generateUUID()` 生成 ID → 写入本地 DB（sync_status='created'）→ 如果在线则立即同步
- `deleteFolder`：检查 isDefault，默认文件夹不可删除 → 先把该文件夹下的笔记移到默认文件夹 → 标记软删除

---

### Step 14：Note Store

**`src/stores/noteStore.ts`**：

```typescript
interface NoteState {
  notes: Note[];
  currentNote: Note | null;
  selectedNoteId: string | null;
  tags: Tag[];
  loading: boolean;
  saving: boolean;

  // 视图状态
  activeView: 'folder' | 'starred' | 'trash';
  searchQuery: string;
  activeTagId: string | null;

  // Computed（用 getter 模拟）
  filteredNotes: () => Note[];    // 根据 searchQuery + activeTagId 过滤

  // 笔记 Actions
  fetchNotes: () => Promise<void>;         // 根据 activeView 从本地 DB 读取
  selectNote: (id: string) => Promise<void>; // 加载完整内容
  createNote: (folderId: string) => Promise<Note>;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  permanentDeleteNote: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  setActiveView: (view: 'folder' | 'starred' | 'trash') => void;
  setSearchQuery: (query: string) => void;

  // 标签 Actions
  fetchTags: () => Promise<void>;
  createTag: (name: string, color?: string) => Promise<void>;
  updateTag: (id: string, data: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
}
```

关键逻辑：
- 与 folderStore 相同，**读本地 DB、写本地 DB + 异步同步**
- `createNote`：生成 UUID → 写入 DB（title='无标题笔记', content='', sync_status='created'）→ 返回新笔记对象，UI 立即可编辑
- `updateNote`：更新 DB（sync_status='updated', updated_at=now()）→ 本地生成 summary → 触发同步
- `selectNote`：从 noteDao.getById 加载完整 content 和 tagIds
- `filteredNotes`：如果 searchQuery 非空，调用 noteDao.search；如果 activeTagId 非空，根据 note_tags 筛选

---

### Step 15：Community Store

**`src/stores/communityStore.ts`**：

```typescript
interface CommunityState {
  posts: PostListItemResponse[];
  hotPosts: PostListItemResponse[];
  currentPost: PostDetailResponse | null;
  comments: CommentResponse[];
  recommendedUsers: UserProfileResponse[];
  followingIds: string[];
  loading: boolean;

  // Feed Actions
  fetchPosts: (page?: number) => Promise<void>;
  fetchHotPosts: (page?: number) => Promise<void>;
  fetchPostDetail: (id: string) => Promise<void>;
  createPost: (req: CreatePostRequest) => Promise<void>;
  deletePost: (id: string) => Promise<void>;

  // 互动 Actions
  likePost: (id: string) => Promise<void>;
  unlikePost: (id: string) => Promise<void>;
  collectPost: (id: string) => Promise<void>;
  uncollectPost: (id: string) => Promise<void>;

  // 评论 Actions
  fetchComments: (postId: string) => Promise<void>;
  fetchReplies: (postId: string, commentId: string) => Promise<void>;
  createComment: (postId: string, content: string, parentId?: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;

  // 关注 Actions
  follow: (userId: string) => Promise<void>;
  unfollow: (userId: string) => Promise<void>;
  fetchFollowingIds: () => Promise<void>;
  fetchRecommended: () => Promise<void>;
}
```

关键逻辑：
- 社区模块**不需要离线存储**（实时性要求高），所有数据直接从 API 获取
- `likePost`/`collectPost`：先乐观更新 UI（立即改变按钮状态和计数），再调 API，失败则回滚
- `fetchPosts` 支持分页加载和下拉刷新

---

### Step 16：User Store

**`src/stores/userStore.ts`**：

```typescript
interface UserState {
  profile: User | null;
  devices: UserDevice[];
  linkedAccounts: LinkedAccount[];
  storageBreakdown: any;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  fetchDevices: () => Promise<void>;
  revokeDevice: (deviceId: string) => Promise<void>;
  revokeOtherDevices: () => Promise<void>;
  fetchLinkedAccounts: () => Promise<void>;
  fetchStorageBreakdown: () => Promise<void>;
}
```

---

## 🔍 审查点 D

> **执行完 Step 12 ~ 16 后暂停。** 将项目交给 Claude 审查：
> 1. Store 与 DAO 的配合是否正确（读本地 DB、写本地 + 异步同步）
> 2. 乐观更新逻辑是否合理
> 3. 登录/登出时数据清理流程
> 4. 各 Store 之间的依赖关系是否清晰

---

## 阶段五：导航系统

### Step 17：导航结构

**`src/navigation/RootNavigator.tsx`**：

根导航，根据登录状态切换：
```
RootNavigator
├── 未登录 → AuthStack
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── OAuthCallbackScreen
├── 已登录但未设置昵称 → SetupProfileScreen
└── 已登录 → MainNavigator
```

**`src/navigation/MainNavigator.tsx`**：

根据设备类型动态选择导航方式。使用 `useDeviceType` Hook：

```
手机模式（< 600dp）→ Bottom Tab Navigator
├── Tab: 笔记 → NoteStack
│   ├── WorkspaceScreen（文件夹 + 笔记列表）
│   └── NoteEditorScreen（编辑器，push 进入）
├── Tab: 社区 → CommunityStack
│   ├── FeedScreen
│   ├── PostDetailScreen
│   └── UserProfileScreen
└── Tab: 我的 → SettingsScreen

平板模式（>= 600dp）→ Drawer Navigator
├── Drawer: 侧边栏（文件夹列表 + 标签列表 + 导航项）
├── Screen: WorkspaceScreen（内部自带 Master-Detail 布局）
├── Screen: CommunityScreen（内部自带多栏布局）
└── Screen: SettingsScreen（内部自带左菜单右内容布局）
```

**`src/navigation/AuthStack.tsx`**：
```
Stack Navigator:
├── Login
├── Register
└── OAuthCallback
```

**`src/navigation/NoteStack.tsx`**（手机模式专用）：
```
Stack Navigator:
├── Workspace（文件夹 + 列表）
└── NoteEditor（编辑器）
```

**`src/navigation/CommunityStack.tsx`**：
```
Stack Navigator:
├── Feed
├── PostDetail
└── UserProfile
```

**导航时数据传递：**
- 笔记列表 → 编辑器：传递 `noteId` 参数
- Feed → 帖子详情：传递 `postId` 参数
- 帖子/评论 → 用户主页：传递 `userId` 参数

---

## 阶段六：认证页面

### Step 18：登录页面

**`src/screens/auth/LoginScreen.tsx`**：

UI 结构（使用 HeroUI Native 组件）：
```
SafeAreaView className="flex-1 bg-background"
├── Logo + 应用名 "Snipxn"
├── <TextField label="邮箱" type="email" />（HeroUI TextField）
├── <TextField label="密码" type="password" />（HeroUI TextField, secureTextEntry）
├── <LinkButton> "忘记密码？" </LinkButton>（HeroUI LinkButton）
├── <Button color="primary" size="lg"> 登录 </Button>（HeroUI Button）
├── <Separator> 其他登录方式 </Separator>（HeroUI Separator）
├── Row: <Button variant="bordered"> GitHub </Button> <Button variant="bordered"> Google </Button>
└── 底部：<LinkButton> "没有账号？注册" </LinkButton>
```

功能逻辑：
- 点击登录 → 调用 `authStore.login(email, password)` → 成功则自动导航到 MainNavigator
- 登录成功后自动触发全量/增量同步
- 表单校验：邮箱格式、密码非空（使用 HeroUI 的 `isInvalid` + `errorMessage` prop）
- 加载状态：Button 的 `isLoading` prop（HeroUI 自带 Spinner）
- 错误提示：使用 HeroUI `Alert` 组件显示错误

平板适配：
- 平板上登录表单居中显示，`className="max-w-[400px] mx-auto"`

---

### Step 19：注册页面

**`src/screens/auth/RegisterScreen.tsx`**：

UI 结构（两步流程）：

**第一步（使用 HeroUI 组件）：**
```
├── <TextField label="邮箱" type="email" />
├── <TextField label="密码" type="password" />
├── <TextField label="确认密码" type="password" />
└── <Button color="primary"> 下一步 </Button> → 调用 sendCode({email, scene: 'REGISTER'})
```

**第二步：**
```
├── <Alert color="primary"> "验证码已发送至 xxx@xx.com" </Alert>
├── <InputOTP length={6} />（HeroUI InputOTP 组件，自带 6 格输入 + 自动聚焦）
├── <LinkButton> "重新发送" </LinkButton> + 倒计时（60 秒）
└── <Button color="primary" isLoading={loading}> 注册 </Button> → 调用 authStore.register(email, code, password)
```

注册成功后 → 自动登录 → 跳转到 SetupProfileScreen

---

### Step 20：资料设置页面

**`src/screens/auth/SetupProfileScreen.tsx`**：

新用户首次登录后显示，设置基本资料（使用 HeroUI 组件）：
```
├── <Avatar> 头像选择（点击弹出 image-picker，选择后调用 api.file.uploadFile 上传）
├── <TextField label="昵称" isRequired />
├── <TextArea label="简介" placeholder="一句话介绍自己" />
├── <Button color="primary" size="lg"> 完成 </Button> → 调用 userStore.updateProfile() → 跳转到 MainNavigator
```

---

## 🔍 审查点 E

> **执行完 Step 17 ~ 20 后暂停。** 将项目交给 Claude 审查：
> 1. 导航结构是否正确处理了手机/平板两种模式
> 2. 登录/注册/资料设置流程是否完整
> 3. Token 存储与恢复逻辑
> 4. 项目此时是否可以在模拟器上运行并完成登录流程

---

## 阶段七：笔记核心页面（重点）

### Step 21：通用布局组件

**`src/components/common/MasterDetail.tsx`**：

这是平板适配的核心组件：

Props：
```typescript
interface MasterDetailProps {
  masterWidth?: number;          // Master 面板宽度（默认 320）
  renderMaster: () => ReactNode; // 左侧面板内容
  renderDetail: () => ReactNode; // 右侧面板内容
  showDetail: boolean;           // 是否显示 Detail（手机模式下控制页面跳转）
}
```

逻辑：
- `useDeviceType().showMasterDetail === true`（平板横屏）→ 左右分栏同屏显示，中间用 1px 分割线
- `showMasterDetail === false` 但 `showSidebar === true`（平板竖屏）→ 类似但 Master 更窄
- 手机模式 → 只渲染 `renderMaster()`，Detail 由外层用 `navigation.push` 跳转

**`src/components/common/AdaptiveLayout.tsx`**：

三栏布局容器（用于笔记工作区）：
```typescript
interface AdaptiveLayoutProps {
  renderSidebar: () => ReactNode;    // 左侧边栏（文件夹+标签）
  renderList: () => ReactNode;       // 中间笔记列表
  renderContent: () => ReactNode;    // 右侧编辑器
  sidebarWidth?: number;             // 默认 240
  listWidth?: number;                // 默认 300
}
```

逻辑：
- 平板横屏（>= 960dp）：三栏同屏显示
- 平板竖屏（600 ~ 959）：隐藏 Sidebar（通过 Drawer 显示），List + Content 双栏
- 手机（< 600）：只显示 List 或 Content（Stack 导航切换）

---

### Step 22：侧边栏组件

**`src/components/sidebar/FolderList.tsx`**：

显示文件夹列表：
- 从 folderStore 读取 folders
- 每行显示：icon + name + noteCount
- 高亮 activeFolderId
- 点击切换文件夹，触发 noteStore.fetchNotes()
- 底部 "+ 新建文件夹" 按钮 → 弹出输入框
- 长按文件夹 → 弹出操作菜单（重命名/修改图标/删除），默认文件夹不可删除
- 支持拖拽排序（更新 rankIndex）

**`src/components/sidebar/TagList.tsx`**：

显示标签列表：
- 从 noteStore 读取 tags
- 每行显示：color 色点 + name
- 点击标签 → 设置 noteStore.activeTagId → 筛选笔记
- 长按 → 编辑/删除
- 底部 "+ 新建标签" 按钮

**`src/components/sidebar/Sidebar.tsx`**：

组合侧边栏（整合文件夹列表、标签列表、导航项）：
```
ScrollView
├── 用户头像 + 昵称（点击跳转设置）
├── 快捷视图切换
│   ├── 📄 全部笔记
│   ├── ⭐ 收藏笔记
│   └── 🗑 回收站
├── 分割线
├── FolderList
├── 分割线
├── TagList
├── 底部留白
└── StorageBar（显示存储使用量进度条）
```

---

### Step 23：笔记列表组件

**`src/components/note/NoteListItem.tsx`**：

单条笔记列表项（HeroUI 组件）：
```
<Surface className="px-4 py-3" isPressable onPress={...}>
├── Row: 标题 + 星标图标（如果 isStarred）
├── Row: summary 摘要（最多 2 行，ellipsis 截断）
├── Row: <Chip size="sm"> 语言 </Chip> + <Chip> 标签 </Chip> + 更新时间
</Surface>
```

- 点击 → 选中笔记（noteStore.selectNote）
- 长按 → 弹出操作菜单（收藏/移动/删除）
- 当前选中笔记高亮背景色
- 回收站视图下：长按菜单改为（恢复/永久删除）

**`src/components/note/NoteList.tsx`**：

笔记列表容器：
```
View
├── 搜索框（TextInput，输入时设置 searchQuery）
├── FlatList
│   ├── renderItem → NoteListItem
│   ├── 下拉刷新 → 触发同步
│   ├── 空状态 → "暂无笔记" 插图
│   └── 加载更多（分页）
└── FAB 浮动按钮 "+" → 新建笔记
```

---

### Step 24：代码编辑器组件

**`src/components/note/CodeEditor.tsx`**：

笔记内容编辑器，这是核心组件。使用 WebView 内嵌 Monaco Editor（与 Web 端一致的编辑体验）。

方案说明：
- 在 `src/assets/editor/` 下放一个本地 HTML 文件，内嵌 Monaco Editor 的 CDN 或打包后的 JS
- 使用 `react-native-webview` 加载该 HTML
- 通过 `postMessage / onMessage` 与 RN 层通信

通信协议：
```
RN → WebView（通过 injectedJavaScript 或 postMessage）：
- { type: 'SET_CONTENT', payload: { content, language } }  // 设置编辑器内容
- { type: 'SET_THEME', payload: 'dark' | 'light' }         // 切换主题
- { type: 'SET_READONLY', payload: boolean }                // 只读模式
- { type: 'SET_LANGUAGE', payload: string }                 // 切换语法高亮语言

WebView → RN（通过 window.ReactNativeWebView.postMessage）：
- { type: 'CONTENT_CHANGED', payload: { content } }        // 内容变化（用于自动保存）
- { type: 'EDITOR_READY' }                                 // 编辑器初始化完成
```

在编辑器 HTML 中：
- 加载 Monaco Editor（支持 30+ 语言语法高亮）
- 监听内容变化，防抖 500ms 后发送 CONTENT_CHANGED 给 RN
- 支持 dark/light 主题切换
- 平板上字体稍大（16px），手机上稍小（14px）

替代方案（如果 WebView 方案性能不佳）：
- 使用 `react-native-code-editor` 库（基于 TextInput + 语法高亮）
- 适合轻量级编辑，但语法高亮能力不如 Monaco

**两种方案都实现一个统一的 Props 接口**：
```typescript
interface CodeEditorProps {
  content: string;
  language: string;
  readOnly?: boolean;
  onContentChange: (content: string) => void;
}
```

---

### Step 25：笔记工具栏

**`src/components/note/NoteToolbar.tsx`**：

编辑器上方的工具栏：
```
View (horizontal)
├── 标题输入框（TextInput，大字体，placeholder "无标题笔记"）
├── 语言选择器（下拉选择编程语言，设置 primaryLanguage）
├── 标签按钮（点击弹出标签选择/创建面板）
├── 星标按钮（切换收藏状态）
├── 分享按钮（生成/取消分享链接）
├── 更多按钮 "⋯"（弹出菜单：导出 / 删除 / 移动到文件夹）
```

平板适配：
- 平板上所有按钮水平排列，显示文字标签
- 手机上只显示图标，标题输入框占满宽度

---

### Step 26：工作区页面

**`src/screens/main/WorkspaceScreen.tsx`**：

这是 App 的核心页面，整合所有笔记功能。

```typescript
function WorkspaceScreen() {
  const { isTablet, showMasterDetail } = useDeviceType();

  if (showMasterDetail) {
    // 平板模式：三栏/双栏同屏
    return (
      <AdaptiveLayout
        renderSidebar={() => <Sidebar />}
        renderList={() => <NoteList />}
        renderContent={() => (
          currentNote ? (
            <>
              <NoteToolbar note={currentNote} />
              <CodeEditor
                content={currentNote.content}
                language={currentNote.primaryLanguage}
                onContentChange={handleContentChange}
              />
            </>
          ) : (
            <EmptyState message="选择一个笔记开始编辑" />
          )
        )}
      />
    );
  }

  // 手机模式：只显示侧边栏 + 列表
  return <NoteList />;
  // 点击笔记后 navigation.push('NoteEditor', { noteId })
}
```

**`src/screens/main/NoteEditorScreen.tsx`**（手机模式专用）：

手机模式下编辑器独占全屏：
```
SafeAreaView
├── Header: 返回按钮 + 标题 + 操作按钮
├── NoteToolbar
└── CodeEditor（flex: 1，占满剩余空间）
```

- 接收 route.params.noteId
- 使用 useAutoSave 实现自动保存
- 返回时 flush 保存
- 使用 BackHandler 处理安卓返回键

---

### Step 27：同步状态集成

在笔记相关页面集成同步机制：

1. **App.tsx 启动时**：
   - 初始化数据库
   - 恢复登录态（restoreSession）
   - 登录态有效则触发 `syncEngine.syncAll()`
   - 启动 `networkMonitor`，网络恢复时自动 syncAll

2. **WorkspaceScreen**：
   - `useEffect` 中调用 `folderStore.fetchFolders()` + `noteStore.fetchTags()`（从本地 DB 读取）
   - 下拉刷新时调用 `syncEngine.syncAll()` → 完成后重新从 DB 读取刷新 UI
   - 顶部显示同步状态指示器：
     - 同步中 → 旋转图标
     - 同步成功 → 打勾（2 秒后消失）
     - 离线 → 云朵 + 斜杠图标
     - 同步失败 → 红色叹号

3. **笔记编辑保存时**：
   - 先写本地 DB（sync_status='updated'）
   - 如果在线，延迟 3 秒后触发 push（避免频繁同步，batch 多次编辑）

---

## 🔍 审查点 F

> **执行完 Step 21 ~ 27 后暂停。** 这是最重要的审查点，将项目交给 Claude 审查：
> 1. 平板三栏布局是否正确实现
> 2. 手机/平板模式切换是否流畅
> 3. 代码编辑器方案是否可行
> 4. 自动保存 + 同步的时序是否正确
> 5. 本地 DB 读写与 UI 的数据流是否清晰
> 6. 整体笔记功能是否可以在模拟器上完整体验

---

## 阶段八：社区页面

### Step 28：社区 Feed 页面

**`src/screens/community/FeedScreen.tsx`**：

```
手机布局：
├── 顶部 Tab 切换：最新 / 热门
├── FlatList 单列卡片流
│   └── PostCard（每条帖子）
└── 下拉刷新 + 加载更多

平板布局：
├── 顶部 Tab 切换
├── 左侧主区域（双列网格 PostCard）
└── 右侧面板（宽 280dp）
    ├── 搜索框
    └── 推荐用户列表（UserCard）
```

**`src/components/community/PostCard.tsx`**：

帖子卡片（HeroUI 组件）：
```
<Card className="mb-3">
  <CardHeader>
    <Avatar src={authorAvatar} size="sm" />
    <Text> 昵称 </Text>
    <Text className="text-foreground-400"> 发布时间 </Text>
  </CardHeader>
  <CardBody>
    <Text className="font-semibold" numberOfLines={2}> 标题 </Text>
    <Text className="text-foreground-500" numberOfLines={3}> 摘要 </Text>
    <Row: <Chip size="sm" variant="flat"> 语言 </Chip> + <Chip> 标签 </Chip>>
  </CardBody>
  <CardFooter>
    <Row: 👁 浏览 · <Button variant="light" size="sm"> ❤️ 点赞 </Button> · ⭐ 收藏 · 💬 评论>
  </CardFooter>
</Card>
```

---

### Step 29：帖子详情页

**`src/screens/community/PostDetailScreen.tsx`**：

```
手机布局：
├── ScrollView
│   ├── 作者信息栏（头像 + 昵称 + 关注按钮）
│   ├── 帖子标题
│   ├── Markdown 渲染内容（react-native-markdown-display）
│   ├── 标签列表
│   ├── 互动栏（点赞/收藏/分享按钮 + 计数）
│   └── 评论区（CommentSection）
└── 底部固定：评论输入框

平板布局：
├── 左侧（flex: 3）：帖子内容（同上，不含评论区）
└── 右侧（flex: 2）：评论区
    ├── 评论列表
    └── 评论输入框
```

**`src/components/community/CommentItem.tsx`**：

单条评论：
```
View
├── Row: 头像 + 昵称 + 时间
├── 评论内容
├── Row: 点赞按钮 + 回复按钮 + 删除（仅自己的评论）
└── 子评论（缩进，最多显示 3 条，"查看更多回复"）
```

**`src/components/community/CommentSection.tsx`**：

评论区容器：
```
FlatList
├── 评论列表（CommentItem）
├── 加载更多
└── 空状态 "暂无评论"
```

---

### Step 30：用户主页

**`src/screens/community/UserProfileScreen.tsx`**：

```
手机布局：
├── 头部
│   ├── 头像 + 昵称 + 简介
│   ├── 关注数 / 粉丝数
│   └── 关注/取消关注按钮
└── 该用户的帖子列表（FlatList + PostCard）

平板布局：
├── 左侧面板（固定宽度 300dp）
│   ├── 头像 + 昵称 + 简介
│   ├── 关注/粉丝统计
│   └── 关注按钮
└── 右侧区域
    └── 帖子网格（2 列）
```

---

## 阶段九：设置页面

### Step 31：设置页面

**`src/screens/settings/SettingsScreen.tsx`**：

```
手机布局：
├── ScrollView 列表
│   ├── 个人资料（头像 + 昵称 → 跳转编辑页）
│   ├── 账号安全
│   │   ├── 修改密码
│   │   └── 第三方账号绑定
│   ├── 设备管理
│   ├── 偏好设置
│   │   ├── 主题（亮/暗/跟随系统）
│   │   ├── 语言
│   │   └── 代码字体大小
│   ├── 存储空间（进度条 + 明细）
│   ├── 关于（版本号 + 检查更新）
│   ├── 反馈
│   └── 退出登录（红色按钮）

平板布局：
├── 左侧菜单列表（固定宽度 280dp）
│   ├── 个人资料
│   ├── 账号安全
│   ├── 设备管理
│   ├── 偏好设置
│   ├── 存储空间
│   ├── 关于
│   └── 退出登录
└── 右侧内容面板（显示选中菜单项的详细设置）
```

---

## 🔍 审查点 G

> **执行完 Step 28 ~ 31 后暂停。** 将项目交给 Claude 审查：
> 1. 社区页面的手机/平板布局
> 2. 评论系统的交互逻辑
> 3. 设置页面的功能完整性
> 4. 整体 App 的导航流程是否通顺

---

## 阶段十：增强功能

### Step 32：代码沙盒

在笔记编辑器中增加"运行代码"功能：

**`src/components/note/CodeRunnerPanel.tsx`**：

```
View
├── "▶ 运行" 按钮
├── 输入区域（stdin，可折叠）
├── 输出区域
│   ├── stdout（绿色文字）
│   ├── stderr（红色文字）
│   └── 运行时间 + 内存占用
└── 状态：Running / Success / Error / Timeout
```

- 提取编辑器中当前的代码 + 语言
- 调用 `api.sandbox.runCode({ language, sourceCode, stdin })`
- 平板上作为右侧抽屉面板显示，手机上作为底部半屏 Modal

---

### Step 33：AI 辅助功能

在编辑器工具栏增加 AI 按钮：

**`src/components/note/AiPanel.tsx`**：

```
View
├── Tab: 代码审查 / 代码生成
├── 代码审查 Tab:
│   ├── "分析当前代码" 按钮 → api.ai.review(currentContent)
│   └── 审查结果（Markdown 渲染）
├── 代码生成 Tab:
│   ├── Prompt 输入框
│   ├── "生成" 按钮 → api.ai.generate(prompt)
│   └── 生成结果 + "插入到编辑器" 按钮
```

---

### Step 34：笔记分享与导入

**分享功能**：
- 在 NoteToolbar 的分享按钮中：
  - 调用 `api.note.shareNote(id)` 获取 shareToken
  - 生成分享链接：`${WEB_BASE_URL}/share/${shareToken}`
  - 使用 RN 的 `Share` API 调起系统分享面板

**笔记导入**：
- 在设置或工作区增加"导入笔记"入口
- 使用 `react-native-document-picker` 选择 `.md` 或 `.json` 文件
- 调用 `api.note.importNotes(file)` 上传

---

### Step 35：版本更新检查

在 App 启动时和设置页中检查更新：
- 调用后端 `app_versions` 相关接口（如果后端已实现）
- 或在设置页中硬编码当前版本号，显示在"关于"中
- 如果有新版本且 `force_update=true`，弹出不可关闭的更新弹窗

---

### Step 36：Android 原生配置最终调整

**`android/app/src/main/AndroidManifest.xml`**：
- `<application>` 中添加 `android:resizeableActivity="true"`
- 添加 `<supports-screens android:largeScreens="true" android:xlargeScreens="true" />`
- 如有 Deep Link 需求，添加 intent-filter

**`android/app/build.gradle`**：
- `applicationId` 改为 `com.snipxn.app`（去掉下划线）

**App 图标**：
- 准备 `mipmap-mdpi` 到 `mipmap-xxxhdpi` 各尺寸图标
- 准备自适应图标（foreground + background 图层）

**启动屏（Splash Screen）**：
- 使用 `react-native-bootsplash` 添加启动屏

---

## 🔍 审查点 H（最终审查）

> **全部 Step 执行完毕后。** 将完整项目交给 Claude 做最终审查：
> 1. 全流程走通：注册 → 登录 → 创建文件夹 → 创建笔记 → 编辑 → 同步 → 查看社区 → 设置
> 2. 离线场景：断网编辑 → 恢复网络 → 自动同步
> 3. 平板适配：手机/平板两种布局切换
> 4. 代码质量：TypeScript 类型安全、无 any 泛滥
> 5. 性能：列表滚动流畅、编辑器响应迅速
> 6. 安全：Token 安全存储、无明文密码

---

## 附录 A：后端 API 完整列表

| # | 方法 | 路径 | 模块 |
|---|------|------|------|
| 1 | POST | /auth/check-email | 认证 |
| 2 | POST | /auth/code | 认证 |
| 3 | POST | /auth/register | 认证 |
| 4 | POST | /auth/login | 认证 |
| 5 | POST | /auth/refresh | 认证 |
| 6 | POST | /auth/reset-password | 认证 |
| 7 | POST | /auth/logout | 认证 |
| 8 | POST | /auth/oauth/github | 认证 |
| 9 | POST | /auth/oauth/google | 认证 |
| 10 | GET | /user/me | 用户 |
| 11 | PUT | /user/me | 用户 |
| 12 | PUT | /user/me/password | 用户 |
| 13 | GET | /user/me/devices | 用户 |
| 14 | DELETE | /user/me/devices/{deviceId} | 用户 |
| 15 | DELETE | /user/me/devices | 用户 |
| 16 | GET | /user/me/linked-accounts | 用户 |
| 17 | POST | /user/me/linked-accounts/github | 用户 |
| 18 | POST | /user/me/linked-accounts/google | 用户 |
| 19 | DELETE | /user/me/linked-accounts/{type} | 用户 |
| 20 | GET | /folders | 文件夹 |
| 21 | POST | /folders | 文件夹 |
| 22 | PUT | /folders/{id} | 文件夹 |
| 23 | DELETE | /folders/{id} | 文件夹 |
| 24 | GET | /notes | 笔记 |
| 25 | GET | /notes/starred | 笔记 |
| 26 | GET | /notes/trash | 笔记 |
| 27 | GET | /notes/{id} | 笔记 |
| 28 | POST | /notes | 笔记 |
| 29 | PUT | /notes/{id} | 笔记 |
| 30 | DELETE | /notes/{id} | 笔记 |
| 31 | POST | /notes/{id}/restore | 笔记 |
| 32 | DELETE | /notes/{id}/permanent | 笔记 |
| 33 | GET | /notes/{id}/share | 笔记 |
| 34 | POST | /notes/{id}/share | 笔记 |
| 35 | DELETE | /notes/{id}/share | 笔记 |
| 36 | GET | /notes/storage-breakdown | 笔记 |
| 37 | POST | /notes/import | 笔记 |
| 38 | GET | /tags | 标签 |
| 39 | POST | /tags | 标签 |
| 40 | PUT | /tags/{id} | 标签 |
| 41 | DELETE | /tags/{id} | 标签 |
| 42 | GET | /sync/pull | 同步 |
| 43 | POST | /sync/push | 同步 |
| 44 | GET | /posts | 社区 |
| 45 | GET | /posts/user/{userId} | 社区 |
| 46 | GET | /posts/hot | 社区 |
| 47 | GET | /posts/{id} | 社区 |
| 48 | POST | /posts | 社区 |
| 49 | DELETE | /posts/{id} | 社区 |
| 50 | POST | /posts/{id}/like | 社区 |
| 51 | DELETE | /posts/{id}/like | 社区 |
| 52 | POST | /posts/{id}/collect | 社区 |
| 53 | DELETE | /posts/{id}/collect | 社区 |
| 54 | POST | /posts/{id}/share | 社区 |
| 55 | GET | /posts/{id}/share | 社区 |
| 56 | DELETE | /posts/{id}/share | 社区 |
| 57 | GET | /posts/{postId}/comments | 评论 |
| 58 | GET | /posts/{postId}/comments/{id}/replies | 评论 |
| 59 | POST | /posts/{postId}/comments | 评论 |
| 60 | DELETE | /posts/{postId}/comments/{id} | 评论 |
| 61 | POST | /posts/{postId}/comments/{id}/like | 评论 |
| 62 | DELETE | /posts/{postId}/comments/{id}/like | 评论 |
| 63 | POST | /follow/{userId} | 关注 |
| 64 | DELETE | /follow/{userId} | 关注 |
| 65 | GET | /follow/following | 关注 |
| 66 | GET | /follow/followers | 关注 |
| 67 | GET | /follow/recommended | 关注 |
| 68 | GET | /follow/stats | 关注 |
| 69 | GET | /follow/user/{userId}/profile | 关注 |
| 70 | POST | /files | 文件 |
| 71 | GET | /files/{id} | 文件 |
| 72 | POST | /ai/review | AI |
| 73 | POST | /ai/generate | AI |
| 74 | POST | /sandbox/run | 沙盒 |
| 75 | GET | /public/notes/{shareToken} | 公开 |
| 76 | GET | /public/posts/{shareToken} | 公开 |

---

## 附录 B：同步协议规格

### Push 请求体

```json
{
  "deviceId": "Android_xxxx",
  "lastPulledAt": "2025-03-15T10:30:00Z",
  "folders": [
    { "id": null, "name": "新文件夹", "icon": "folder", "rankIndex": null, "isDeleted": false, "version": null },
    { "id": "uuid-xxx", "name": "已改名", "icon": "📁", "rankIndex": "aaa", "isDeleted": false, "version": 3 }
  ],
  "notes": [
    { "id": null, "folderId": "uuid-folder", "title": "新笔记", "content": "# Hello", "primaryLanguage": "markdown", "isStarred": false, "isDeleted": false, "version": null, "tagIds": [] },
    { "id": "uuid-note", "folderId": "uuid-folder", "title": "更新笔记", "content": "...", "primaryLanguage": "java", "isStarred": true, "isDeleted": false, "version": 5, "tagIds": ["uuid-tag1", "uuid-tag2"] }
  ],
  "tags": []
}
```

> - `id: null` + `version: null` 表示新建
> - `isDeleted: true` 表示软删除
> - 服务端用 `WHERE version = ?` 做乐观锁校验，不匹配则静默拒绝

### Pull 响应体

```json
{
  "serverTime": "2025-03-15T10:35:00Z",
  "folders": [
    { "id": "uuid-xxx", "name": "文件夹A", "icon": "folder", "isDefault": true, "rankIndex": "aaa", "noteCount": 5, "version": 2, "createdAt": "...", "updatedAt": "..." }
  ],
  "notes": [
    { "id": "uuid-note", "folderId": "uuid-xxx", "title": "笔记标题", "content": "完整Markdown内容", "summary": "纯文本摘要...", "primaryLanguage": "java", "isStarred": false, "status": "NORMAL", "tagIds": ["uuid-tag1"], "version": 5, "lastDeviceId": "Chrome_xxx", "createdAt": "...", "updatedAt": "..." }
  ],
  "tags": [
    { "id": "uuid-tag1", "name": "Java", "color": "#FF6B35", "version": 1, "updatedAt": "..." }
  ],
  "deletedItems": [
    { "tableName": "notes", "recordId": "uuid-deleted-note", "deletedAt": "..." }
  ]
}
```

> - `lastPulledAt` 为 null 时返回用户全部数据（首次同步）
> - `lastPulledAt` 有值时只返回该时间之后修改的增量数据
> - `deletedItems` 仅包含增量期间被删除的记录，客户端收到后物理删除本地对应数据

---

## 附录 C：审查点汇总

| 审查点 | 完成的 Step | 审查重点 |
|--------|------------|---------|
| **A** | Step 1~6 | 依赖安装、类型定义、主题、Hooks、项目可编译 |
| **B** | Step 7~8 | Axios 拦截器、Token 刷新、API 层完整性 |
| **C** | Step 9~11 | 本地数据库 Schema、DAO 层、同步引擎 |
| **D** | Step 12~16 | Zustand Store、数据流、登录/登出 |
| **E** | Step 17~20 | 导航系统、认证页面、手机/平板导航切换 |
| **F** | Step 21~27 | **核心审查**：笔记功能、编辑器、平板布局、离线同步集成 |
| **G** | Step 28~31 | 社区页面、评论系统、设置页 |
| **H** | Step 32~36 | **最终审查**：全流程、离线场景、性能、安全 |

---

## 附录 D：HeroUI Native 组件使用指南

### 可用组件一览

| 分类 | 组件 | 项目中用途 |
|------|------|----------|
| **表单** | TextField, TextArea, SearchField, InputOTP | 登录/注册/搜索/验证码 |
| **表单** | Select, RadioGroup, Checkbox, Switch, Slider | 设置页、语言选择、筛选 |
| **表单** | Label, Description, FieldError | 表单辅助文字 |
| **按钮** | Button, LinkButton, CloseButton | 全局按钮 |
| **布局** | Card (CardHeader/CardBody/CardFooter), Surface, Separator | 帖子卡片、笔记列表项、分割线 |
| **布局** | ScrollShadow | 可滚动区域边缘阴影 |
| **导航** | Accordion, ListGroup, Tabs, TagGroup | 侧边栏折叠、设置菜单、社区Tab、标签组 |
| **数据展示** | Chip, Avatar | 标签/语言标记、用户头像 |
| **反馈** | Alert, Skeleton/SkeletonGroup, Spinner | 错误提示、加载骨架屏、加载中 |
| **覆盖层** | Dialog, BottomSheet, Popover, Menu, Toast | 确认弹窗、底部面板、操作菜单、通知 |

### 导入方式（推荐按需导入，减小包体积）

```tsx
// 推荐：按需导入
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { TextField } from 'heroui-native/text-field';
import { Avatar } from 'heroui-native/avatar';
import { Chip } from 'heroui-native/chip';
import { Dialog } from 'heroui-native/dialog';
import { Toast } from 'heroui-native/toast';
import { Menu } from 'heroui-native/menu';
import { Tabs } from 'heroui-native/tabs';
import { Alert } from 'heroui-native/alert';
import { Skeleton } from 'heroui-native/skeleton';
import { Spinner } from 'heroui-native/spinner';
import { InputOTP } from 'heroui-native/input-otp';
import { Select } from 'heroui-native/select';
import { Switch } from 'heroui-native/switch';
import { Separator } from 'heroui-native/separator';
import { Surface } from 'heroui-native/surface';
import { BottomSheet } from 'heroui-native/bottom-sheet';
import { HeroUINativeProvider } from 'heroui-native/provider';
```

### 样式规范

全项目统一使用 **Tailwind className**（通过 Uniwind），不再使用 `StyleSheet.create()`：

```tsx
// ✅ 正确：使用 className
<View className="flex-1 bg-background p-4">
  <Text className="text-lg font-semibold text-foreground">标题</Text>
</View>

// ❌ 避免：使用 StyleSheet
const styles = StyleSheet.create({ container: { flex: 1 } });
<View style={styles.container}>...</View>
```

### HeroUI 语义色（Tailwind 类名直接使用）

```
bg-background        — 页面背景
bg-content1          — 卡片/面板背景
bg-content2          — 次级背景
text-foreground      — 主文字
text-foreground-400  — 次级文字
text-foreground-500  — 三级文字
bg-primary           — 品牌色背景
text-primary         — 品牌色文字
bg-danger            — 错误/危险
bg-success           — 成功
bg-warning           — 警告
bg-default           — 默认/中性
```

### 页面与组件的 HeroUI 对应关系

| 页面/功能 | 使用的 HeroUI 组件 |
|----------|-------------------|
| 登录页 | TextField, Button, LinkButton, Separator, Alert |
| 注册页 | TextField, Button, InputOTP, Alert, LinkButton |
| 资料设置 | Avatar, TextField, TextArea, Button |
| 侧边栏 | ListGroup, Accordion, Avatar, Separator, Chip |
| 笔记列表 | Surface (isPressable), Chip, Skeleton |
| 笔记工具栏 | Button, Select, Menu, Chip, Switch |
| 社区 Feed | Card, Avatar, Chip, Button, Tabs, Skeleton |
| 帖子详情 | Card, Avatar, Button, Chip, Separator |
| 评论区 | Surface, Avatar, Button, LinkButton, TextArea |
| 用户主页 | Avatar, Button, Chip, Card |
| 设置页 | ListGroup, Switch, Select, RadioGroup, Slider, Dialog, Button |
| 操作菜单 | Menu (长按弹出) 或 BottomSheet (手机) |
| 确认弹窗 | Dialog (删除笔记、退出登录等确认) |
| 消息通知 | Toast (同步完成、操作成功/失败等) |
| 加载状态 | Spinner (按钮内)、Skeleton (列表骨架屏) |
