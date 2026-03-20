# Feature Review Simulator

AI 功能评审模拟器 - 帮助产品经理在正式评审前发现并解决潜在问题

## 项目简介

这是一个面向 AI 产品经理的需求评审辅助工具，通过大模型驱动的多角色模拟，在 PRD 正式评审前帮助用户提前发现盲点、打磨方案，最终提升评审通过率。

## 技术栈

- **前端框架**: React 18 + TypeScript + Vite
- **样式**: Tailwind CSS + 自定义主题色
- **图标**: Lucide React
- **文档解析**:
  - Word 文件: mammoth.js
  - PDF 文件: pdfjs-dist
- **AI 集成**: Anthropic Claude API

## 项目结构

```
src/
├── components/     # UI 组件
├── hooks/         # 自定义 React Hooks
├── lib/           # 工具函数
├── types/         # TypeScript 类型定义
└── App.tsx        # 主应用组件
```

## 核心类型

在 `src/types/index.ts` 中定义了以下核心类型：

- `Role`: 评审角色类型 ('user' | 'dev' | 'boss' | 'legal')
- `RoleThread`: 角色对话线程
- `ReviewSession`: 评审会话
- `Document`: 文档信息

## 本地开发

### 环境要求

- Node.js >= 18.0.0
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 部署到 Vercel

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/feature-review-simulator)

### 手动部署步骤

1. **Fork 或 Clone 项目**
   ```bash
   git clone https://github.com/your-username/feature-review-simulator.git
   cd feature-review-simulator
   ```

2. **安装 Vercel CLI**（可选）
   ```bash
   npm i -g vercel
   ```

3. **部署到 Vercel**

   方式一：使用 Vercel CLI
   ```bash
   vercel
   ```

   方式二：使用 Git 集成
   - 登录 [Vercel Dashboard](https://vercel.com)
   - 点击 "New Project"
   - 导入你的 GitHub 仓库
   - Vercel 会自动检测并配置项目
   - 点击 "Deploy" 完成部署

4. **配置环境变量**（如需）
   - 在 Vercel 项目设置中，可以配置环境变量
   - 本项目不需要额外的环境变量

### 部署配置

项目已包含 `vercel.json` 配置文件，支持 SPA 路由和静态资源优化：

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 自定义域名

1. 在 Vercel 项目设置中，进入 "Domains" 标签
2. 输入你的自定义域名
3. 按照提示配置 DNS 解析
4. 等待 DNS 生效即可访问

### 自动部署

每次推送到主分支，Vercel 会自动触发新的部署构建。

## 功能特性

### Phase 1 (Demo 阶段) ✓
- ✓ 文档上传与解析 (Word/PDF)
- ✓ 四角色并发评审（用户、工程师、老板、法务）
- ✓ 实时结果展示
- ✓ 风险汇总与迭代
- ✓ API Key 缓存（sessionStorage）
- ✓ 错误提示与自动消失
- ✓ 响应式布局（移动端适配）
- ✓ Vercel 部署配置

### Phase 2 (完整产品)
- [ ] 用户注册/登录
- [ ] 文档管理
- [ ] 多轮辩驳系统
- [ ] 评审报告生成

## 主题色配置

- 主色调: `#1a2e4a` (深蓝色)
- 次色调: `#1a5fa8` (中蓝色)

## 许可证

MIT