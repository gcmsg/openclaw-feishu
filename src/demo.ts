#!/usr/bin/env node
/**
 * OpenClaw Feishu Demo Server
 * 
 * 演示飞书机器人的基本功能：
 * - 接收消息并自动回复
 * - 处理 @ 提及
 * - 机器人进群/出群通知
 * 
 * 使用方法：
 * 1. 设置环境变量 FEISHU_APP_ID 和 FEISHU_APP_SECRET
 * 2. 运行: npx tsx src/demo.ts
 * 3. 使用 ngrok 暴露本地端口: ngrok http 3000
 * 4. 在飞书开放平台配置 Webhook URL
 */

import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
import { createPlugin, loadConfigFromEnv } from './index.js'
import type { MessageEvent } from './interfaces/webhook/event-handler.js'

// 配置
const PORT = parseInt(process.env.PORT || '3000')
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/webhook'

// 初始化
console.log('🔧 加载配置...')

let config
try {
  config = loadConfigFromEnv()
  console.log(`✅ App ID: ${config.appId}`)
} catch (error) {
  console.error('❌ 配置加载失败!')
  console.error('   请设置环境变量:')
  console.error('   export FEISHU_APP_ID=cli_xxx')
  console.error('   export FEISHU_APP_SECRET=xxx')
  process.exit(1)
}

const feishu = createPlugin(config)
const app = new Hono()

// 中间件
app.use('*', logger())

// 健康检查
app.get('/', (c) => c.text('OpenClaw Feishu Bot 🤖'))
app.get('/health', (c) => c.json({ ok: true, timestamp: Date.now() }))

// Webhook 端点
app.post(WEBHOOK_PATH, async (c) => {
  try {
    const rawBody = await c.req.text()
    const body = JSON.parse(rawBody)

    const result = await feishu.handleWebhook(body, {
      timestamp: c.req.header('x-lark-request-timestamp'),
      nonce: c.req.header('x-lark-request-nonce'),
      signature: c.req.header('x-lark-signature'),
      rawBody,
    })

    if (result.challenge) {
      console.log('🔐 URL 验证成功')
      return c.json({ challenge: result.challenge })
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('[Webhook Error]', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 已处理的消息 ID（去重）
const processedMessages = new Set<string>()

// 消息处理
feishu.onMessage(async (event, _header) => {
  const msg = event as MessageEvent
  const messageId = msg.message.message_id

  // 去重（飞书可能重复推送）
  if (processedMessages.has(messageId)) {
    return
  }
  processedMessages.add(messageId)
  
  // 清理旧消息 ID（保留最近 1000 条）
  if (processedMessages.size > 1000) {
    const arr = Array.from(processedMessages)
    arr.slice(0, 500).forEach(id => processedMessages.delete(id))
  }

  // 解析消息内容
  let text = ''
  try {
    const content = JSON.parse(msg.message.content)
    text = content.text || ''
  } catch {
    text = msg.message.content
  }

  console.log(`\n📨 收到消息:`)
  console.log(`   消息ID: ${messageId}`)
  console.log(`   发送者: ${msg.sender.sender_id.open_id}`)
  console.log(`   群聊ID: ${msg.message.chat_id}`)
  console.log(`   类型: ${msg.message.chat_type}`)
  console.log(`   内容: ${text}`)

  // 群聊需要 @ 才回复（简单判断：消息中包含 @）
  if (msg.message.chat_type === 'group' && !text.includes('@')) {
    console.log('   (群消息未 @，忽略)')
    return
  }

  // 自动回复逻辑
  try {
    let replyText = ''

    if (text.includes('你好') || text.includes('hello') || text.includes('hi')) {
      replyText = '你好！我是 OpenClaw Feishu Bot 🤖'
    } else if (text.includes('帮助') || text.includes('help')) {
      replyText = `📖 可用命令：
• 你好 - 打个招呼
• 帮助 - 显示此帮助
• 时间 - 显示当前时间
• echo xxx - 复读机模式`
    } else if (text.includes('时间') || text.includes('time')) {
      replyText = `🕐 当前时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
    } else if (text.startsWith('echo ') || text.includes('echo ')) {
      const echoText = text.replace(/@\S+\s*/g, '').replace(/echo\s*/i, '').trim()
      replyText = echoText || '(空消息)'
    } else {
      replyText = `收到: "${text.replace(/@\S+\s*/g, '').trim()}"\n\n输入 "帮助" 查看可用命令`
    }

    // 发送回复
    await feishu.reply(messageId, { type: 'text', text: replyText })
    console.log(`   ✅ 已回复: ${replyText.slice(0, 50)}...`)

  } catch (error) {
    console.error('   ❌ 回复失败:', error)
  }
})

// 机器人进群
feishu.onBotAdded(async (event) => {
  console.log(`\n🤖 机器人被添加到群: ${event.chat_id}`)
  
  try {
    await feishu.sendText(event.chat_id, '大家好！我是 OpenClaw Feishu Bot 🤖\n\n输入 "帮助" 查看可用命令')
    console.log('   ✅ 已发送入群欢迎消息')
  } catch (error) {
    console.error('   ❌ 发送欢迎消息失败:', error)
  }
})

// 机器人出群
feishu.onBotRemoved(async (event) => {
  console.log(`\n👋 机器人被移出群: ${event.chat_id}`)
})

// 启动服务器
console.log('')
console.log('═══════════════════════════════════════════')
console.log('   OpenClaw Feishu Bot Demo')
console.log('═══════════════════════════════════════════')
console.log(`🚀 启动服务器: http://localhost:${PORT}`)
console.log(`📡 Webhook: http://localhost:${PORT}${WEBHOOK_PATH}`)
console.log(`💚 健康检查: http://localhost:${PORT}/health`)
console.log('')
console.log('📝 下一步:')
console.log('   1. 使用 ngrok 暴露端口: ngrok http 3000')
console.log('   2. 在飞书开放平台配置 Webhook URL')
console.log('   3. 订阅 "接收消息" 事件')
console.log('═══════════════════════════════════════════')
console.log('')

serve({
  fetch: app.fetch,
  port: PORT,
})
