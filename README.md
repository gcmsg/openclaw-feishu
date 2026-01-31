# OpenClaw Feishu Plugin

飞书机器人控制插件，用于 [OpenClaw](https://github.com/clawdbot/openclaw)。

## ✨ 功能

- **💬 聊天** - 发送/接收消息、管理群组
- **📄 云文档** - 创建/编辑/读取飞书文档
- **📁 云空间** - 文件/文件夹管理

## 📦 安装

```bash
npm install openclaw-feishu
# or
pnpm add openclaw-feishu
```

## 🚀 快速开始

```typescript
import { createPlugin, loadConfigFromEnv } from 'openclaw-feishu'

// 从环境变量加载配置
const config = loadConfigFromEnv()
const feishu = createPlugin(config)

// 发送消息
await feishu.sendText('oc_xxx', 'Hello from OpenClaw!')

// 创建文档
const doc = await feishu.createDocument('会议纪要')
console.log('文档链接:', doc.url)

// 监听消息
feishu.onMessage(async (event) => {
  const { message, sender } = event
  console.log(`收到消息: ${message.content}`)
  
  // 回复
  await feishu.reply(message.message_id, {
    type: 'text',
    text: '收到！'
  })
})
```

## ⚙️ 配置

设置环境变量：

```bash
# 必需
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx

# 可选
FEISHU_ENCRYPT_KEY=xxxxx       # 事件加密密钥
FEISHU_VERIFICATION_TOKEN=xxx  # 事件验证 Token
FEISHU_DEBUG=true              # 调试模式
```

或代码配置：

```typescript
import { createPlugin } from 'openclaw-feishu'

const feishu = createPlugin({
  appId: 'cli_xxxxx',
  appSecret: 'xxxxx',
  debug: true,
})
```

## 📖 API

### 消息

```typescript
// 发送文本
await feishu.sendText(chatId, '消息内容')

// 发送卡片
await feishu.sendCard(chatId, {
  header: { title: { content: '标题' } },
  elements: [{ tag: 'div', text: { content: '内容' } }]
})

// 回复消息
await feishu.reply(messageId, { type: 'text', text: '回复内容' })

// 底层 API
await feishu.message.send(chatId, content)
await feishu.message.recall(messageId)
```

### 群组

```typescript
// 获取群信息
const chat = await feishu.chat.get(chatId)

// 创建群
const newChat = await feishu.chat.create({ name: '新群' })

// 添加成员
await feishu.chat.addMembers(chatId, ['user1', 'user2'])
```

### 文档

```typescript
// 创建文档
const { id, url } = await feishu.createDocument('标题')

// 追加内容
await feishu.appendToDocument(docId, [
  { blockType: 'heading1', content: { text: [{ text: '章节' }] } },
  { blockType: 'text', content: { text: [{ text: '段落内容' }] } },
])

// 读取内容
const content = await feishu.readDocument(docId)
```

### 云空间

```typescript
// 创建文件夹
const folder = await feishu.createFolder('新文件夹')

// 列出文件
const { items } = await feishu.listFiles(folderId)

// 搜索
const results = await feishu.searchFiles('关键词')
```

### 事件监听

```typescript
// 监听消息
feishu.onMessage(async (event, header) => {
  console.log('收到消息:', event.message.content)
  console.log('事件ID:', header?.event_id)
})

// 监听机器人进群
feishu.onBotAdded(async (event) => {
  console.log('机器人被添加到群:', event.chat_id)
})

// 监听机器人出群
feishu.onBotRemoved(async (event) => {
  console.log('机器人被移出群:', event.chat_id)
})

// 监听消息撤回
feishu.onMessageRecalled(async (event) => {
  console.log('消息被撤回:', event.message_id)
})

// 监听任意事件
feishu.on('im.chat.updated_v1', (event) => {
  console.log('群信息更新')
})
```

### Webhook 处理

支持飞书 v1/v2 schema，自动处理加密事件：

```typescript
// Express
import express from 'express'

const app = express()
app.use(express.json())

// 方式1: 简单处理
app.post('/webhook', async (req, res) => {
  const result = await feishu.handleWebhook(req.body)
  res.json(result.challenge ? { challenge: result.challenge } : {})
})

// 方式2: 带签名验证 (推荐)
app.post('/webhook', express.text({ type: '*/*' }), async (req, res) => {
  const result = await feishu.handleWebhook(
    JSON.parse(req.body),
    {
      timestamp: req.headers['x-lark-request-timestamp'] as string,
      nonce: req.headers['x-lark-request-nonce'] as string,
      signature: req.headers['x-lark-signature'] as string,
      rawBody: req.body,
    }
  )
  res.json(result.challenge ? { challenge: result.challenge } : {})
})
```

```typescript
// Hono
import { Hono } from 'hono'

const app = new Hono()

app.post('/webhook', async (c) => {
  const rawBody = await c.req.text()
  const result = await feishu.handleWebhook(
    JSON.parse(rawBody),
    {
      timestamp: c.req.header('x-lark-request-timestamp'),
      nonce: c.req.header('x-lark-request-nonce'),
      signature: c.req.header('x-lark-signature'),
      rawBody,
    }
  )
  return c.json(result.challenge ? { challenge: result.challenge } : {})
})
```

```typescript
// 使用 createWebhookHandler 工厂函数
const handler = feishu.createWebhookHandler()

app.post('/webhook', async (req, res) => {
  const result = await handler(
    req.body,
    req.headers as Record<string, string>,
    JSON.stringify(req.body)
  )
  res.json(result.challenge ? { challenge: result.challenge } : {})
})
```

## 🏗️ 架构

本项目采用 DDD（领域驱动设计）架构：

```
src/
├── domain/          # 领域层 - 核心业务模型
│   ├── chat/        # 聊天领域
│   ├── document/    # 文档领域
│   └── space/       # 空间领域
├── application/     # 应用层 - 用例编排
├── infrastructure/  # 基础设施 - API 实现
│   └── feishu/      # 飞书 API 封装
├── interfaces/      # 接口层 - 对外暴露
│   └── webhook/     # 事件回调处理
└── shared/          # 共享内核
```

## 📋 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 类型检查
pnpm typecheck
```

## 📄 License

MIT
