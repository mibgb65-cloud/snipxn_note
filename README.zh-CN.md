<div align="center">

[English](README.md) | 简体中文

# ✨ Snipxn ✨

### 🚀 现代化全栈代码笔记与开发者社区平台 🚀

<br/>

🌐 **Web 网页端** &nbsp;·&nbsp; 📱 **Mobile 移动端** &nbsp;·&nbsp; ☁️ **Cloud Sync 云同步** &nbsp;·&nbsp; 🤖 **AI Powered AI 助手**

<br/>

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.84-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📖 项目介绍

**Snipxn** 是一个面向开发者的笔记与社区平台，集成了 ✍️ Markdown 富文本编辑、💻 在线代码运行、🤖 AI 智能助手 和 👥 开发者社区互动。

无论你是在手机端 📱 快速记录代码片段，还是在桌面端 🖥️ 编写完整技术笔记，Snipxn 都可以通过云同步 ☁️ 保持多端数据一致。

---

## 🎯 核心功能

### 📝 智能笔记系统
- 🗂️ **文件夹与标签管理**：支持多级文件夹和多彩标签分类
- ✏️ **Monaco Editor 编辑器**：支持 50+ 编程语言语法高亮
- 🔄 **实时同步**：网页端与移动端离线优先同步
- 📤 **导入导出**：支持 Markdown 文件导入与导出
- 🔗 **公开分享**：一键生成笔记分享链接

### 💻 代码沙箱
- ▶️ **即时运行代码**：支持 40+ 编程语言在线执行
- ⚡ **Judge0 驱动**：安全隔离、响应快速
- 📊 **输出与错误信息**：展示运行结果、耗时与内存占用

### 🤖 AI 助手
- 💬 **智能对话**：围绕代码问题进行问答
- 🔍 **代码分析**：提供 AI 代码审查与优化建议
- 🧠 **DeepSeek 接入**：集成大模型能力

### 👥 开发者社区
- 📰 **动态与帖子**：分享技术内容，发现他人作品
- 💬 **评论讨论**：围绕技术内容互动交流
- 👤 **个人主页**：展示个人内容并关注其他开发者
- ❤️ **点赞互动**：建立社区连接

### 🔐 认证与安全
- 📧 **邮箱注册**：支持验证码校验
- 🔑 **JWT 认证**：Access/Refresh Token 安全轮换
- 🐙 **GitHub OAuth**：支持 GitHub 一键登录
- 🔵 **Google OAuth**：支持 Google 登录
- 📱 **多设备管理**：查看和管理登录设备

### 🌍 国际化与主题
- 🌐 **i18n 多语言支持**
- 🌙 **暗色模式**
- 🎨 **个性化工作区配置**

---

## 🏗️ 系统架构

```text
🏠 Snipxn System
│
├── 🖥️  snipxn-backend/          Spring Boot 4.0.3 (Java 25)
│   ├── 📦 snipxn-common          基础类、Result<T>、异常处理
│   ├── 🔐 snipxn-auth            JWT、OAuth、邮箱验证
│   ├── 📝 snipxn-note            笔记、文件夹、标签、同步
│   ├── 👥 snipxn-community       帖子、评论、关注系统
│   ├── 💻 snipxn-sandbox         Judge0 代码执行
│   ├── 🤖 snipxn-ai              DeepSeek AI 集成
│   └── 🚀 snipxn-app             主应用入口与配置
│
├── 🌐 snipxn_frontend/           Vue 3.5 + Vite 7 + PrimeVue
│
└── 📱 snipxn_app/                React Native 0.84 + TypeScript
```

---

## 🛠️ 技术栈

### 🖥️ 后端
| 技术 | 用途 |
|------|------|
| ☕ Java 25 + Spring Boot 4.0.3 | 核心后端框架 |
| 🐘 PostgreSQL 17 | 主数据库 |
| 🔴 Redis 7 | 缓存与会话 |
| 🐇 RabbitMQ 4 | 异步消息处理，邮件发送、浏览量统计 |
| 🗃️ MyBatis Plus | ORM 框架 |
| 🔐 JWT (jjwt) | 身份认证 |
| 📜 Flyway | 数据库迁移 |
| 📖 SpringDoc OpenAPI | API 文档 |

### 🌐 前端 Web
| 技术 | 用途 |
|------|------|
| 💚 Vue 3.5 + Composition API | UI 框架 |
| ⚡ Vite 7 | 构建工具 |
| 🍍 Pinia | 状态管理 |
| 🎨 PrimeVue + PrimeFlex | UI 组件与布局 |
| ✏️ Monaco Editor | 代码编辑器 |
| 🌐 vue-i18n | 国际化 |

### 📱 移动端 App
| 技术 | 用途 |
|------|------|
| ⚛️ React Native 0.84 | 跨平台移动应用 |
| 📘 TypeScript 5.8 | 类型安全 |
| 🐻 Zustand | 状态管理 |
| 🎨 TailwindCSS + NativeWind | 样式系统 |
| 💾 OP-SQLite | 离线数据库 |
| 🔄 自研同步引擎 | Offline-first 数据同步 |

### ☁️ 基础设施
| 技术 | 用途 |
|------|------|
| 🐳 Docker Compose | 容器编排部署 |
| 🌐 Nginx | 反向代理与静态资源服务 |
| ☁️ Cloudflare | CDN、SSL 与 DDoS 防护 |

---

## 🚀 快速开始

### 📋 前置要求

- 🐳 Docker & Docker Compose
- ☕ Java 25+（本地后端开发）
- 📗 Node.js 22+（前端与移动端开发）

### 🐳 Docker 生产部署

```bash
# 1️⃣ 克隆仓库
git clone https://github.com/mibgb65-cloud/snipxn_note.git
cd snipxn_note

# 2️⃣ 配置环境变量
cp .env.production .env
# ✏️ 编辑 .env 并填写你的密钥配置

# 3️⃣ 启动服务 🚀
docker compose up -d --build

# ✅ 完成后访问 http://localhost
```

### 💻 本地开发

**后端：**
```bash
cd snipxn-backend
mvn spring-boot:run -pl snipxn-app
# 🟢 API 地址：http://localhost:8080
```

**前端 Web：**
```bash
cd snipxn_frontend
npm install
npm run dev
# 🟢 Web 地址：http://localhost:5173
```

**移动端 App：**
```bash
cd snipxn_app
npm install
npx react-native run-android
# 🟢 在模拟器或真机运行
```

---

## 📱 应用界面

| 🔐 登录 | 📝 工作区 | 👥 社区 | ⚙️ 设置 |
|:------:|:--------:|:------:|:------:|
| 邮箱与 OAuth 登录 | 笔记编辑与文件夹管理 | 动态、帖子与个人主页 | 个人资料与偏好设置 |

---

## 🌐 环境变量

| 变量名 | 说明 | 是否必需 |
|--------|------|:--------:|
| `DB_PASSWORD` | PostgreSQL 密码 | ✅ |
| `REDIS_PASSWORD` | Redis 密码 | ✅ |
| `RABBITMQ_PASSWORD` | RabbitMQ 密码 | ✅ |
| `JWT_SECRET` | JWT 签名密钥，建议 32+ 字符 | ✅ |
| `MAIL_API_KEY` | Resend 邮件 API Key | 📧 |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID | 🐙 |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | 🐙 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | 🔵 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | 🔵 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | 🤖 |
| `JUDGE0_URL` | Judge0 沙箱服务地址 | 💻 |

---

## 📂 项目结构

```text
📁 Snipxn_System/
├── 📁 snipxn-backend/           🖥️ Spring Boot 多模块后端
│   ├── 📁 snipxn-common/        📦 公共基础类与工具
│   ├── 📁 snipxn-auth/          🔐 认证与用户管理
│   ├── 📁 snipxn-note/          📝 笔记、文件夹、标签与同步逻辑
│   ├── 📁 snipxn-community/     👥 帖子、评论与社交功能
│   ├── 📁 snipxn-sandbox/       💻 代码执行沙箱
│   ├── 📁 snipxn-ai/            🤖 AI 助手集成
│   └── 📁 snipxn-app/           🚀 主应用入口与配置
├── 📁 snipxn_frontend/          🌐 Vue.js 网页端
├── 📁 snipxn_app/               📱 React Native 移动端
├── 🐳 docker-compose.yml        ☁️ 生产部署配置
├── 🔒 .env.production           🔑 环境变量模板
├── 📖 README.md                 📄 English README
└── 📖 README.zh-CN.md           📄 中文 README
```

---

## 🔧 API 文档

后端启动后访问：

📖 **Swagger UI** → `http://localhost:8080/swagger-ui/index.html`

---

## 🤝 参与贡献

欢迎提交贡献！🎉

1. 🍴 Fork 本仓库
2. 🌿 创建功能分支：`git checkout -b feat/amazing-feature`
3. 💾 提交更改：`git commit -m 'feat: add amazing feature'`
4. 📤 推送分支：`git push origin feat/amazing-feature`
5. 🎯 发起 Pull Request

---

## 📄 许可证

本项目用于学习与教学用途 🎓

---

<div align="center">

**⭐ 如果这个项目对你有帮助，欢迎点个 Star！⭐**

Made with ❤️ and lots of ☕

🌟 **Happy Coding!** 🌟

</div>
