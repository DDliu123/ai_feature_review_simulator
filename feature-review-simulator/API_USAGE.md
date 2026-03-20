# API 使用说明

## Kimi API 集成

本项目已集成 Kimi API（kimi-k2.ai）进行 AI 评审功能。

### 获取 API Key

1. 访问 [kimi-k2.ai](https://kimi-k2.ai)
2. 注册账号并登录
3. 在控制台获取 API Key

### API 调用限制

- 模型：kimi-k2
- 最大 tokens：8000
- 并发请求：支持多角色并发

### 错误处理

| HTTP 状态 | 错误信息 | 处理方式 |
|-----------|----------|----------|
| 401 | API Key 无效 | 提示用户检查 API Key |
| 429 | 请求过于频繁 | 提示用户稍后重试 |
| 其他 | 具体错误信息 | 显示英文错误详情 |

### 使用流程

1. 输入有效的 Kimi API Key
2. 上传 PRD 文档（Word/PDF）
3. 选择评审角色
4. 点击"开始评审"
5. 查看各角色质疑和风险总结

### 技术实现

- **并发处理**：使用 Promise.all 并发请求所有角色
- **流式更新**：每个角色完成后立即更新 UI
- **错误隔离**：单个角色失败不影响其他角色
- **状态管理**：使用 React Hook 管理评审状态

### 函数说明

#### `callKimi(apiKey, systemPrompt, userContent)`
基础 API 调用函数，返回 AI 回复内容。

#### `runReview(apiKey, selectedRoles, docText, onRoleResult)`
运行完整评审流程，支持实时回调更新。

#### `summarizeRisks(apiKey, allResults)`
汇总所有角色质疑，提炼核心共性风险。

#### `useReview()`
React Hook，管理评审状态和流程。

### 注意事项

- API Key 仅保存在前端，不会发送到服务器
- 文档内容会被截取到 4000 字符以内
- 每个角色的质疑限制在 5 个问题
- 核心风险总结限制在 3-4 条，每条 20 字以内