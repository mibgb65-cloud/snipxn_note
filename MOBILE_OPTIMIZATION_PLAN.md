# Snipxn 移动端 & 平板适配优化计划

> 本计划基于对前端代码的全面审查，按优先级排序。每个任务独立可执行。

---

## 阶段一：基础设施修复（必须最先完成）

### 1.1 修复 viewport meta 标签

**文件**: `snipxn_frontend/index.html`

**当前**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

**改为**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#0a0a0f">
```

同时**删除**遗留在 index.html 中的 Figma 开发脚本：
```html
<!-- 删除这行 -->
<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
```

---

### 1.2 全局添加 safe-area-inset 支持

**文件**: `snipxn_frontend/src/assets/main.css`

在全局样式中添加 CSS 变量和基础 safe-area 补偿：

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}

#app {
  padding-top: var(--safe-top);
  padding-bottom: var(--safe-bottom);
  padding-left: var(--safe-left);
  padding-right: var(--safe-right);
}
```

---

### 1.3 统一断点系统

**新建文件**: `snipxn_frontend/src/assets/breakpoints.css`

当前项目有 16+ 个散落的魔法数字断点，需要统一为 CSS 变量（供 JS 同步使用）：

```css
:root {
  /* 断点定义 */
  --bp-phone-sm: 375px;   /* iPhone SE / 小屏手机 */
  --bp-phone: 480px;      /* 标准手机 */
  --bp-tablet-sm: 640px;  /* 小平板 / 大手机横屏 */
  --bp-tablet: 768px;     /* 标准平板竖屏 */
  --bp-tablet-lg: 1024px; /* 平板横屏 / iPad Pro */
  --bp-desktop-sm: 1180px;/* 小桌面 */
  --bp-desktop: 1280px;   /* 标准桌面 */
  --bp-desktop-lg: 1440px;/* 大桌面 */
}
```

在 `main.css` 中 `@import './breakpoints.css'`。后续所有新的 media query 使用这些值。

同时在 `src/composables/` 下创建 `useBreakpoints.ts`：

```ts
export const BREAKPOINTS = {
  PHONE_SM: 375,
  PHONE: 480,
  TABLET_SM: 640,
  TABLET: 768,
  TABLET_LG: 1024,
  DESKTOP_SM: 1180,
  DESKTOP: 1280,
  DESKTOP_LG: 1440,
} as const

export function useBreakpoints() {
  const width = ref(window.innerWidth)
  const onResize = () => { width.value = window.innerWidth }
  onMounted(() => window.addEventListener('resize', onResize))
  onUnmounted(() => window.removeEventListener('resize', onResize))

  return {
    width,
    isPhone: computed(() => width.value < BREAKPOINTS.TABLET),
    isTablet: computed(() => width.value >= BREAKPOINTS.TABLET && width.value < BREAKPOINTS.DESKTOP_SM),
    isDesktop: computed(() => width.value >= BREAKPOINTS.DESKTOP_SM),
  }
}
```

---

### 1.4 触控设备隐藏滚动条

**文件**: `snipxn_frontend/src/assets/main.css`

当前 `::-webkit-scrollbar` 设置了 `width: 10px`，在触控设备上不合适。添加：

```css
@media (pointer: coarse) {
  ::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
  * {
    scrollbar-width: none;
  }
}
```

---

## 阶段二：MainView 工作区手机适配（核心重点）

### 2.1 实现手机端面板导航模式

**文件**: `snipxn_frontend/src/views/MainView.vue`

**当前问题**: 在 ≤768px 时，侧边栏、笔记列表、编辑器三面板垂直堆叠在一个固定高度容器中，用户体验极差。

**目标**: 在手机端（< 768px）实现单面板切换导航模式：
- 同一时刻只显示一个面板（侧边栏 / 笔记列表 / 编辑器）
- 顶部显示面包屑导航 + 返回按钮
- 面板之间使用左右滑动切换动画

**实现方案**:

1. 添加响应式状态：
```ts
const activePanel = ref<'sidebar' | 'list' | 'editor'>('list')
```

2. 在 `< 768px` 时：
   - 隐藏 `<Splitter>`，改用 `v-show` 切换三个面板
   - 侧边栏：点击文件夹后自动切到 list
   - 笔记列表：点击笔记后自动切到 editor
   - 编辑器顶部：添加「← 返回列表」按钮

3. 添加移动端顶部导航栏（仅手机可见）：
```vue
<div v-if="isPhone" class="mobile-nav-bar">
  <button v-if="activePanel !== 'list'" @click="goBack">
    <i class="pi pi-arrow-left" />
  </button>
  <span class="mobile-nav-title">{{ currentTitle }}</span>
  <button @click="activePanel = 'sidebar'">
    <i class="pi pi-bars" />
  </button>
</div>
```

4. CSS 过渡动画：
```css
.panel-slide-left-enter-active,
.panel-slide-left-leave-active,
.panel-slide-right-enter-active,
.panel-slide-right-leave-active {
  transition: transform 0.25s ease;
}
.panel-slide-left-enter-from { transform: translateX(100%); }
.panel-slide-left-leave-to { transform: translateX(-100%); }
.panel-slide-right-enter-from { transform: translateX(-100%); }
.panel-slide-right-leave-to { transform: translateX(100%); }
```

---

### 2.2 手机端侧边栏改为抽屉模式

**文件**: `snipxn_frontend/src/views/MainView.vue`, `src/components/layout/Sidebar.vue`

在 `< 768px` 时，侧边栏不再占据页面布局空间，改为从左侧滑出的全屏抽屉：

```css
@media (max-width: 768px) {
  .sidebar-shell {
    position: fixed;
    inset: 0;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    background: var(--surface-ground);
    padding-top: var(--safe-top);
    padding-bottom: var(--safe-bottom);
  }
  .sidebar-shell.open {
    transform: translateX(0);
  }
  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
  }
}
```

---

### 2.3 手机端 Topbar 精简

**文件**: `snipxn_frontend/src/views/MainView.vue`

在 `< 768px` 时：
- 隐藏原有复杂的 3 列 topbar
- 使用 2.1 中的 `mobile-nav-bar` 替代
- 搜索功能改为点击图标弹出全屏搜索覆盖层
- 操作按钮收入右上角的「⋮」更多菜单

---

### 2.4 修复 workspace-locked 在手机端的问题

**文件**: `snipxn_frontend/src/views/MainView.vue`

在手机端面板导航模式下，不再给 `html/body` 添加 `workspace-locked` class：

```ts
// 修改 onMounted 逻辑
if (!isPhone.value) {
  document.documentElement.classList.add('workspace-locked')
  document.body.classList.add('workspace-locked')
}
```

---

## 阶段三：平板端优化

### 3.1 平板端双面板布局

**文件**: `snipxn_frontend/src/views/MainView.vue`

在平板端（768px - 1180px）：
- 侧边栏始终折叠为 icon-only 模式（64px 宽）
- 笔记列表和编辑器使用水平 Splitter 分割（已有功能，保持）
- 点击侧边栏图标弹出 overlay 面板（而不是展开侧边栏占据空间）

```css
@media (min-width: 768px) and (max-width: 1180px) {
  .sidebar-shell {
    width: 64px;
    min-width: 64px;
  }
  .sidebar-overlay {
    position: fixed;
    left: 64px;
    top: 0;
    width: 280px;
    height: 100dvh;
    z-index: 100;
    box-shadow: 4px 0 12px rgba(0,0,0,0.2);
  }
}
```

---

### 3.2 平板端 Splitter 拖拽优化

**文件**: `snipxn_frontend/src/views/MainView.vue`

PrimeVue 的 `<Splitter>` 拖拽手柄在触屏上太小。添加触控增强：

```css
@media (pointer: coarse) {
  .p-splitter-gutter {
    width: 12px !important;   /* 从默认 4px 增大 */
    touch-action: none;
  }
  .p-splitter-gutter::after {
    content: '';
    position: absolute;
    inset: -8px;  /* 扩大触摸热区 */
  }
  .p-splitter-gutter-handle {
    width: 4px;
    height: 32px;
    border-radius: 2px;
    background: var(--surface-400);
  }
}
```

---

## 阶段四：社区页面手机适配

### 4.1 社区页改为可滚动布局

**文件**: `snipxn_frontend/src/views/CommunityView.vue`

**当前问题**: community-shell 在 `100dvh` + `overflow: hidden` 下，堆叠模式中每个子面板各自滚动，用户体验混乱。

**修复**: 在 `< 768px` 时，解除固定高度锁定，改为正常文档流滚动：

```css
@media (max-width: 768px) {
  .community-shell {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
    padding-top: var(--safe-top);
    padding-bottom: var(--safe-bottom);
  }
  .community-sidebar,
  .community-feed-panel,
  .community-insights {
    overflow: visible;
    max-height: none;
  }
}
```

---

### 4.2 社区侧边栏改为可折叠区域

**文件**: `snipxn_frontend/src/views/CommunityView.vue`

在手机端，社区侧边栏（关注/推荐用户列表）改为可折叠的 accordion 区域，默认收起，避免占据大量视口空间：

```vue
<div v-if="isPhone" class="community-sidebar-mobile">
  <button @click="showSidebar = !showSidebar" class="sidebar-toggle">
    {{ showSidebar ? '收起' : '发现用户' }}
    <i :class="showSidebar ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" />
  </button>
  <Transition name="collapse">
    <div v-show="showSidebar">
      <!-- 原有侧边栏内容 -->
    </div>
  </Transition>
</div>
```

---

### 4.3 帖子详情移动端适配

**文件**: 社区相关组件

- 帖子详情弹窗在手机端改为全屏展示（而非弹窗/dialog）
- 评论区域固定在底部，类似微信朋友圈交互
- 图片使用 `object-fit: cover` + 固定宽高比（aspect-ratio）

---

## 阶段五：编辑器手机适配

### 5.1 手机端禁用 Monaco，使用 textarea

**文件**: `snipxn_frontend/src/components/layout/NoteEditor.vue`

Monaco Editor 在手机浏览器上性能差且不好用。在 `< 768px` 时降级为增强的 textarea：

```vue
<template>
  <MonacoEditor v-if="!isPhone && useMonaco" ... />
  <textarea
    v-else
    class="mobile-editor-textarea"
    v-model="content"
    @input="onContentChange"
  />
</template>
```

```css
.mobile-editor-textarea {
  width: 100%;
  height: 100%;
  min-height: 60vh;
  padding: 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--text-color);
  -webkit-overflow-scrolling: touch;
}
```

---

### 5.2 编辑器/预览切换为 Tab 模式

**文件**: `snipxn_frontend/src/components/layout/NoteEditor.vue`

在手机端，编辑器和预览不再上下堆叠，而是使用 Tab 切换：

```vue
<div v-if="isPhone" class="editor-mobile-tabs">
  <button :class="{ active: mobileTab === 'edit' }" @click="mobileTab = 'edit'">
    编辑
  </button>
  <button :class="{ active: mobileTab === 'preview' }" @click="mobileTab = 'preview'">
    预览
  </button>
</div>
<div class="editor-grid">
  <div v-show="!isPhone || mobileTab === 'edit'" class="editor-pane">...</div>
  <div v-show="!isPhone || mobileTab === 'preview'" class="preview-pane">...</div>
</div>
```

---

### 5.3 NoteToolbar 手机端精简

**文件**: 工具栏组件

- 仅保留最常用的 4-5 个按钮（加粗、斜体、链接、图片、代码）
- 其余放入「更多」菜单
- 工具栏使用水平滚动（`overflow-x: auto`），允许左右滑动查看更多工具

---

## 阶段六：设置页面优化

### 6.1 设置页面手机适配（已较好，微调即可）

**文件**: `snipxn_frontend/src/views/SettingsView.vue`

设置页在 960px 以下已经解锁为可滚动布局，只需微调：

- 在 `< 480px` 时减少内边距（`padding: 0.75rem` → `0.5rem`）
- 导航 pills 在手机端改为水平滚动条：
```css
@media (max-width: 720px) {
  .settings-nav-pills {
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
    scrollbar-width: none;
  }
}
```

---

## 阶段七：交互体验增强

### 7.1 添加底部导航栏（仅手机端）

**新建文件**: `snipxn_frontend/src/components/mobile/BottomNavBar.vue`

在手机端（< 768px）的主要页面底部添加固定导航栏：

```vue
<template>
  <nav class="bottom-nav" v-if="isPhone">
    <router-link to="/workspace" class="nav-item">
      <i class="pi pi-file-edit" />
      <span>笔记</span>
    </router-link>
    <router-link to="/community" class="nav-item">
      <i class="pi pi-users" />
      <span>社区</span>
    </router-link>
    <router-link to="/settings" class="nav-item">
      <i class="pi pi-cog" />
      <span>设置</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(56px + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--surface-card);
  border-top: 1px solid var(--surface-border);
  z-index: 1000;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 0.7rem;
  color: var(--text-color-secondary);
  text-decoration: none;
}
.nav-item.router-link-active {
  color: var(--primary-color);
}
</style>
```

在 `App.vue` 中引入该组件，并为页面内容添加底部 padding 以避免被导航栏遮挡。

---

### 7.2 下拉刷新（Pull to Refresh）

**文件**: `snipxn_frontend/src/views/CommunityView.vue`, `MainView.vue`

在手机端的笔记列表和社区 feed 添加下拉刷新功能。可以使用轻量库如 `pulltorefreshjs` 或自行实现：

```ts
// composable: usePullToRefresh.ts
export function usePullToRefresh(el: Ref<HTMLElement>, onRefresh: () => Promise<void>) {
  let startY = 0
  let pulling = false

  const onTouchStart = (e: TouchEvent) => {
    if (el.value.scrollTop === 0) {
      startY = e.touches[0].clientY
      pulling = true
    }
  }
  const onTouchMove = (e: TouchEvent) => {
    if (!pulling) return
    const delta = e.touches[0].clientY - startY
    if (delta > 80) {
      pulling = false
      onRefresh()
    }
  }
  // ... attach/cleanup listeners
}
```

---

### 7.3 手势导航支持

**文件**: MainView.vue (手机模式)

在手机端面板导航模式下，支持左右滑动切换面板：

```ts
// composable: useSwipeNavigation.ts
export function useSwipeNavigation(onSwipeLeft: () => void, onSwipeRight: () => void) {
  let startX = 0
  const threshold = 50

  const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX }
  const onTouchEnd = (e: TouchEvent) => {
    const delta = e.changedTouches[0].clientX - startX
    if (Math.abs(delta) > threshold) {
      delta > 0 ? onSwipeRight() : onSwipeLeft()
    }
  }
  // ... attach/cleanup
}
```

---

## 阶段八：虚拟键盘适配

### 8.1 虚拟键盘弹出时的布局调整

**文件**: `snipxn_frontend/src/composables/useVirtualKeyboard.ts`（新建）

iOS 和 Android 的虚拟键盘弹出行为不同。使用 `visualViewport` API 适配：

```ts
export function useVirtualKeyboard() {
  const keyboardHeight = ref(0)
  const isKeyboardOpen = ref(false)

  onMounted(() => {
    if (window.visualViewport) {
      const onResize = () => {
        const viewport = window.visualViewport!
        const diff = window.innerHeight - viewport.height
        keyboardHeight.value = Math.max(0, diff)
        isKeyboardOpen.value = diff > 100
      }
      window.visualViewport.addEventListener('resize', onResize)
    }
  })

  return { keyboardHeight, isKeyboardOpen }
}
```

在编辑器页面，当键盘弹出时：
- 隐藏底部导航栏
- 调整编辑区域高度为 `100dvh - keyboardHeight`
- 确保光标位置始终可见

---

## 阶段九：性能优化

### 9.1 手机端条件加载 Monaco

**文件**: `snipxn_frontend/src/components/layout/NoteEditor.vue`

Monaco 编辑器体积约 2MB。在手机端不应加载它：

```ts
const MonacoEditor = isPhone.value
  ? null
  : defineAsyncComponent(() => import('./MonacoEditor.vue'))
```

### 9.2 图片懒加载

在社区 feed 和笔记列表中的图片添加 `loading="lazy"` 和 `decoding="async"`：

```html
<img :src="post.image" loading="lazy" decoding="async" />
```

---

## 执行顺序建议

| 优先级 | 阶段 | 原因 |
|--------|------|------|
| P0 | 阶段一 (1.1-1.4) | 基础设施，所有后续工作依赖它 |
| P0 | 阶段二 (2.1-2.4) | 工作区是核心功能，手机端完全不可用 |
| P1 | 阶段七 (7.1) | 底部导航栏是手机 APP 的基础 UI |
| P1 | 阶段五 (5.1-5.3) | 编辑器是核心功能 |
| P1 | 阶段四 (4.1-4.3) | 社区页手机端体验差 |
| P2 | 阶段三 (3.1-3.2) | 平板优化 |
| P2 | 阶段八 (8.1) | 虚拟键盘问题影响编辑体验 |
| P2 | 阶段六 (6.1) | 设置页已较好，微调即可 |
| P3 | 阶段七 (7.2-7.3) | 体验增强，非必需 |
| P3 | 阶段九 (9.1-9.2) | 性能优化 |

---

## 测试清单

- [ ] iPhone SE (375px) - 最小屏幕测试
- [ ] iPhone 14/15 (390px) - 主流手机 + notch
- [ ] iPhone 14 Pro Max (430px) - 大屏手机
- [ ] iPad Mini (768px) - 最小平板
- [ ] iPad Air (820px) - 标准平板竖屏
- [ ] iPad Pro 11" (1024px) - 平板横屏
- [ ] Android 手机 (360-412px) - 各厂商适配
- [ ] 横屏模式测试
- [ ] 虚拟键盘弹出测试
- [ ] 暗色模式下所有适配正常
