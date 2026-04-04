<div align="center">

# ✨ Snipxn ✨

### 🚀 A Modern Full-Stack Code Note & Developer Community Platform 🚀

<br/>

🌐 **Web** &nbsp;·&nbsp; 📱 **Mobile** &nbsp;·&nbsp; ☁️ **Cloud Sync** &nbsp;·&nbsp; 🤖 **AI Powered**

<br/>

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.84-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📖 About

**Snipxn** is a developer-first note-taking and community platform that brings together ✍️ rich Markdown editing, 💻 online code execution, 🤖 AI-powered assistance, and 👥 a vibrant developer community — all in one place.

Whether you're jotting down quick code snippets on your phone 📱 or writing detailed technical notes on your desktop 🖥️, Snipxn keeps everything in sync across all your devices ☁️.

---

## 🎯 Features

### 📝 Smart Note System
- 🗂️ **Folder & Tag Management** — Organize notes with nested folders and colorful tags
- ✏️ **Monaco Editor** — Full-featured code editor with syntax highlighting for 50+ languages
- 🔄 **Real-time Sync** — Seamless offline-first sync across web and mobile
- 📤 **Import & Export** — Support for Markdown file import/export
- 🔗 **Public Sharing** — Share notes with a single link

### 💻 Code Sandbox
- ▶️ **Run Code Instantly** — Execute code snippets in 40+ programming languages
- ⚡ **Powered by Judge0** — Fast, secure, and isolated code execution
- 📊 **Output & Errors** — See results, execution time, and memory usage

### 🤖 AI Assistant
- 💬 **Smart Chat** — Ask questions about your code and get instant help
- 🔍 **Code Analysis** — AI-powered code review and suggestions
- 🧠 **Powered by DeepSeek** — Advanced language model integration

### 👥 Developer Community
- 📰 **Feed & Posts** — Share knowledge and discover what others are building
- 💬 **Comments & Discussions** — Engage in meaningful technical conversations
- 👤 **User Profiles** — Showcase your work and follow other developers
- ❤️ **Likes & Interactions** — React to posts and build connections

### 🔐 Authentication & Security
- 📧 **Email Registration** — With verification code
- 🔑 **JWT Auth** — Secure access & refresh token rotation
- 🐙 **GitHub OAuth** — One-click login with GitHub
- 🔵 **Google OAuth** — Sign in with Google
- 📱 **Multi-device Management** — Track and manage all logged-in devices

### 🌍 Internationalization & Theming
- 🌐 **i18n Support** — Multi-language interface
- 🌙 **Dark Mode** — Beautiful dark theme for late-night coding
- 🎨 **Customizable** — Personalize your workspace

---

## 🏗️ Architecture

```
🏠 Snipxn System
│
├── 🖥️  snipxn-backend/          Spring Boot 4.0.3 (Java 25)
│   ├── 📦 snipxn-common          Base classes, Result<T>, exceptions
│   ├── 🔐 snipxn-auth            JWT, OAuth, email verification
│   ├── 📝 snipxn-note            Notes, folders, tags, sync
│   ├── 👥 snipxn-community       Posts, comments, follow system
│   ├── 💻 snipxn-sandbox         Judge0 code execution
│   ├── 🤖 snipxn-ai              DeepSeek AI integration
│   └── 🚀 snipxn-app             Main application & config
│
├── 🌐 snipxn_frontend/           Vue 3.5 + Vite 7 + PrimeVue
│
└── 📱 snipxn_app/                React Native 0.84 + TypeScript
```

---

## 🛠️ Tech Stack

### 🖥️ Backend
| Tech | Purpose |
|------|---------|
| ☕ Java 25 + Spring Boot 4.0.3 | Core framework |
| 🐘 PostgreSQL 17 | Primary database |
| 🔴 Redis 7 | Caching & session |
| 🐇 RabbitMQ 4 | Async messaging (email, view counts) |
| 🗃️ MyBatis Plus | ORM framework |
| 🔐 JWT (jjwt) | Authentication |
| 📜 Flyway | Database migrations |
| 📖 SpringDoc OpenAPI | API documentation |

### 🌐 Frontend (Web)
| Tech | Purpose |
|------|---------|
| 💚 Vue 3.5 + Composition API | UI framework |
| ⚡ Vite 7 | Build tool |
| 🍍 Pinia | State management |
| 🎨 PrimeVue + PrimeFlex | UI components |
| ✏️ Monaco Editor | Code editor |
| 🌐 vue-i18n | Internationalization |

### 📱 Mobile App
| Tech | Purpose |
|------|---------|
| ⚛️ React Native 0.84 | Cross-platform mobile |
| 📘 TypeScript 5.8 | Type safety |
| 🐻 Zustand | State management |
| 🎨 TailwindCSS + NativeWind | Styling |
| 💾 OP-SQLite | Offline database |
| 🔄 Custom sync engine | Offline-first sync |

### ☁️ Infrastructure
| Tech | Purpose |
|------|---------|
| 🐳 Docker Compose | Container orchestration |
| 🌐 Nginx | Reverse proxy & static serving |
| ☁️ Cloudflare | CDN, SSL & DDoS protection |

---

## 🚀 Quick Start

### 📋 Prerequisites

- 🐳 Docker & Docker Compose
- ☕ Java 25+ (for local dev)
- 📗 Node.js 22+ (for frontend & mobile dev)

### 🐳 Docker Deployment (Production)

```bash
# 1️⃣ Clone the repo
git clone https://github.com/mibgb65-cloud/snipxn_note.git
cd snipxn_note

# 2️⃣ Configure environment
cp .env.production .env
# ✏️ Edit .env and fill in your secrets

# 3️⃣ Launch everything 🚀
docker compose up -d --build

# ✅ Done! Visit http://localhost
```

### 💻 Local Development

**Backend:**
```bash
cd snipxn-backend
mvn spring-boot:run -pl snipxn-app
# 🟢 API running at http://localhost:8080
```

**Frontend:**
```bash
cd snipxn_frontend
npm install
npm run dev
# 🟢 Web app at http://localhost:5173
```

**Mobile App:**
```bash
cd snipxn_app
npm install
npx react-native run-android
# 🟢 App running on emulator/device
```

---

## 📱 App Screens

| 🔐 Login | 📝 Workspace | 👥 Community | ⚙️ Settings |
|:---------:|:------------:|:------------:|:-----------:|
| Email & OAuth login | Note editor with folders | Feed, posts & profiles | Profile & preferences |

---

## 🌐 Environment Variables

| Variable | Description | Required |
|----------|-------------|:--------:|
| `DB_PASSWORD` | PostgreSQL password | ✅ |
| `REDIS_PASSWORD` | Redis password | ✅ |
| `RABBITMQ_PASSWORD` | RabbitMQ password | ✅ |
| `JWT_SECRET` | JWT signing key (32+ chars) | ✅ |
| `MAIL_API_KEY` | Resend API key for emails | 📧 |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | 🐙 |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | 🐙 |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | 🔵 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | 🔵 |
| `DEEPSEEK_API_KEY` | DeepSeek AI API key | 🤖 |
| `JUDGE0_URL` | Judge0 sandbox endpoint | 💻 |

---

## 📂 Project Structure

```
📁 Snipxn_System/
├── 📁 snipxn-backend/           🖥️ Spring Boot multi-module backend
│   ├── 📁 snipxn-common/        📦 Shared base classes & utilities
│   ├── 📁 snipxn-auth/          🔐 Authentication & user management
│   ├── 📁 snipxn-note/          📝 Note, folder, tag & sync logic
│   ├── 📁 snipxn-community/     👥 Posts, comments & social features
│   ├── 📁 snipxn-sandbox/       💻 Code execution sandbox
│   ├── 📁 snipxn-ai/            🤖 AI assistant integration
│   └── 📁 snipxn-app/           🚀 Main app entry & config
├── 📁 snipxn_frontend/          🌐 Vue.js web application
├── 📁 snipxn_app/               📱 React Native mobile app
├── 🐳 docker-compose.yml        ☁️ Production deployment
├── 🔒 .env.production           🔑 Environment template
└── 📖 README.md                 📄 You are here!
```

---

## 🔧 API Documentation

Once the backend is running, visit:

📖 **Swagger UI** → `http://localhost:8080/swagger-ui/index.html`

---

## 🤝 Contributing

Contributions are welcome! 🎉

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feat/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. 📤 Push to the branch (`git push origin feat/amazing-feature`)
5. 🎯 Open a Pull Request

---

## 📄 License

This project is for educational purposes 🎓

---

<div align="center">

**⭐ Star this repo if you find it helpful! ⭐**

Made with ❤️ and lots of ☕

🌟 **Happy Coding!** 🌟

</div>
