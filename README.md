# AI Feature Review Simulator (AI 需求评审模拟器)

这是一个基于 AI 的产品需求文档（PRD）评审模拟器。它通过模拟不同角色（产品经理、软件工程师、测试工程师、设计师）的视角，对上传的 PRD 进行深度剖析、提问和辩驳，最终生成详尽的评审报告，帮助产品团队在正式评审前发现并解决潜在风险。

## 1. 项目背景

在软件开发流程中，需求评审是至关重要的一环。然而，传统的线下评审往往存在准备不足、视角单一、沟通成本高等问题。本项目利用大语言模型（LLM）的强大推理能力，模拟多方专家的批判性思维，为产品经理提供一个“ 7x24 小时在线”的预评审环境，提高正式评审的效率和质量。

## 2. 核心功能

- **多角色评审**：内置产品、技术、测试、设计四大专业角色，提供全方位反馈。
- **文档深度解析**：支持 `.docx`、`.doc`、`.pdf` 格式文件上传，自动提取核心文本。
- **多轮辩驳对话**：用户可以针对 AI 提出的质疑进行解释，AI 会根据解释实时调整认可度。
- **实时评审流**：基于 SSE（Server-Sent Events）技术，实时展示各角色的生成进度。
- **评审报告导出**：在所有评审官通过后，自动生成并下载包含完整对话记录的 PDF 报告。
- **安全认证体系**：完整的用户注册、邮箱验证、JWT 鉴权及 Token 刷新机制。

## 3. 技术架构

### 前端 (Frontend)
- **框架**: React 18 + Vite
- **路由**: React Router 6
- **状态管理**: Context API (AuthContext)
- **样式**: Tailwind CSS
- **网络请求**: Axios (包含自动刷新 Token 的拦截器)
- **实时通信**: 原生 EventSource (SSE)

### 后端 (Backend)
- **框架**: Fastify (Node.js)
- **语言**: TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **AI 引擎**: Kimi (用于生成评审问题和回答)
- **文件存储**: Cloudflare R2 (兼容 S3 API)
- **安全**: Bcrypt (密码哈希), jsonwebtoken (鉴权), Fastify Rate Limit (限流)
- **文档处理**: Mammoth (Word), pdf-parse (PDF), pdfkit (报告生成)

## 4. 快速启动

### 4.1 环境准备
- Node.js (v20+)
- PostgreSQL 数据库
- Cloudflare R2 存储桶
- Kimi API Key (用于调用 Kimi 模型)

### 4.2 后端配置
1. 进入 `backend/` 目录。
2. 将 `.env.example` 重命名为 `.env` 并填写相关配置：
   ```env
   DATABASE_URL="postgresql://postgres:密码@localhost:5432/数据库名?schema=public"
   JWT_SECRET="自定义随机字符串"
   R2_ACCESS_KEY_ID="你的R2密钥ID"
   R2_SECRET_ACCESS_KEY="你的R2密钥"
   R2_ENDPOINT="https://你的账号ID.r2.cloudflarestorage.com"
   R2_BUCKET_NAME="你的存储桶名"
   ANTHROPIC_API_KEY="你的Claude-API-Key"
   ```
3. 安装依赖：`npm install`
4. 运行数据库迁移：`npx prisma migrate dev --name init`
5. 启动开发服务器：`npm run dev` (默认监听 3001 端口)

### 4.3 前端配置
1. 进入 `feature-review-simulator/` 目录。
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run dev` (默认监听 5173 端口)

### 4.4 登录与使用
- **注册**: 访问 `http://localhost:5173/register` 进行注册。
- **验证码**: 注册后，验证码会输出在**后端控制台**（当前为模拟发送）。
- **登录密码**: 注册时自行设置。如果您直接在数据库中手动创建用户，请注意密码已经过 Bcrypt 哈希处理。
- **评审**: 登录后上传文档，选择角色，即可开始评审。

## 5. 开发路线图
- [x] 基础认证与文档管理
- [x] 多角色 SSE 评审引擎
- [x] 多轮辩驳对话系统
- [x] PDF 评审报告生成
- [ ] 接入更多 AI 模型 (如 Kimi, GPT-4)
- [ ] 支持在线协同评审
