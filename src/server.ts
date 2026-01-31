import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
import { createPlugin, loadConfigFromEnv } from './index.js'
import type { MessageEvent, EventCallbackV2 } from './interfaces/webhook/event-handler.js'

/**
 * 服务器配置
 */
export interface ServerOptions {
  port?: number
  webhookPath?: string
  onMessage?: (event: MessageEvent, header: EventCallbackV2['header']) => void | Promise<void>
  onBotAdded?: (chatId: string) => void | Promise<void>
  onBotRemoved?: (chatId: string) => void | Promise<void>
  debug?: boolean
}

/**
 * 创建并启动服务器
 */
export function createServer(options: ServerOptions = {}) {
  const {
    port = 3000,
    webhookPath = '/webhook',
    onMessage,
    onBotAdded,
    onBotRemoved,
    debug = false,
  } = options

  // 加载配置
  const config = loadConfigFromEnv()
  const feishu = createPlugin(config)

  // 创建 Hono 应用
  const app = new Hono()

  // 日志中间件
  if (debug) {
    app.use('*', logger())
  }

  // 健康检查
  app.get('/health', (c) => c.json({ ok: true, timestamp: Date.now() }))

  // Webhook 端点
  app.post(webhookPath, async (c) => {
    try {
      const rawBody = await c.req.text()
      const body = JSON.parse(rawBody)

      const result = await feishu.handleWebhook(body, {
        timestamp: c.req.header('x-lark-request-timestamp'),
        nonce: c.req.header('x-lark-request-nonce'),
        signature: c.req.header('x-lark-signature'),
        rawBody,
      })

      // URL 验证
      if (result.challenge) {
        return c.json({ challenge: result.challenge })
      }

      return c.json({ success: true })
    } catch (error) {
      console.error('[Webhook Error]', error)
      return c.json({ error: String(error) }, 500)
    }
  })

  // 注册事件处理器
  if (onMessage) {
    feishu.onMessage(async (event, header) => {
      if (header) {
        await onMessage(event as MessageEvent, header)
      }
    })
  }

  if (onBotAdded) {
    feishu.onBotAdded(async (event) => {
      await onBotAdded(event.chat_id)
    })
  }

  if (onBotRemoved) {
    feishu.onBotRemoved(async (event) => {
      await onBotRemoved(event.chat_id)
    })
  }

  return {
    app,
    feishu,
    start: () => {
      console.log(`🚀 Server starting on port ${port}`)
      console.log(`📡 Webhook endpoint: http://localhost:${port}${webhookPath}`)
      console.log(`💚 Health check: http://localhost:${port}/health`)
      
      serve({
        fetch: app.fetch,
        port,
      })
    },
  }
}

/**
 * 直接运行时的入口
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer({
    port: parseInt(process.env.PORT || '3000'),
    webhookPath: process.env.WEBHOOK_PATH || '/webhook',
    debug: process.env.DEBUG === 'true',
    
    onMessage: async (event, header) => {
      const content = JSON.parse(event.message.content)
      console.log(`\n📨 收到消息:`)
      console.log(`   来自: ${event.sender.sender_id.open_id}`)
      console.log(`   群聊: ${event.message.chat_id}`)
      console.log(`   类型: ${event.message.message_type}`)
      console.log(`   内容: ${content.text || JSON.stringify(content)}`)
      console.log(`   事件ID: ${header.event_id}`)
    },

    onBotAdded: async (chatId) => {
      console.log(`\n🤖 机器人被添加到群: ${chatId}`)
    },

    onBotRemoved: async (chatId) => {
      console.log(`\n👋 机器人被移出群: ${chatId}`)
    },
  })

  server.start()
}
