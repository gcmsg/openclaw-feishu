import type { FeishuConfig } from './infrastructure/feishu/config.js'
import { FeishuClient } from './infrastructure/feishu/client.js'
import { MessageApi } from './infrastructure/feishu/api/message-api.js'
import { ChatApi } from './infrastructure/feishu/api/chat-api.js'
import { DocumentApi } from './infrastructure/feishu/api/document-api.js'
import { SpaceApi } from './infrastructure/feishu/api/space-api.js'
import { 
  EventHandlerRegistry, 
  handleWebhook,
  createWebhookHandler,
} from './interfaces/webhook/event-handler.js'
import type { 
  EventCallback, 
  MessageEvent, 
  BotAddedEvent,
  BotRemovedEvent,
  MessageRecalledEvent,
  EventType, 
  EventHandler,
  WebhookOptions,
  WebhookResult,
} from './interfaces/webhook/event-handler.js'
import type { MessageContent } from './domain/chat/entities/message.js'
import type { Block } from './domain/document/entities/document.js'
import type { ChatId, DocumentId, FolderId } from './shared/types/index.js'

/**
 * OpenClaw Feishu Plugin
 * 
 * 统一入口，提供聊天、文档、空间管理功能
 */
export class OpenClawFeishuPlugin {
  private client: FeishuClient
  private eventRegistry: EventHandlerRegistry

  // API 模块
  public readonly message: MessageApi
  public readonly chat: ChatApi
  public readonly document: DocumentApi
  public readonly space: SpaceApi

  constructor(private config: FeishuConfig) {
    this.client = new FeishuClient(config)
    this.eventRegistry = new EventHandlerRegistry()

    // 初始化 API 模块
    this.message = new MessageApi(this.client)
    this.chat = new ChatApi(this.client)
    this.document = new DocumentApi(this.client)
    this.space = new SpaceApi(this.client)
  }

  // ============ 消息 ============

  /**
   * 发送文本消息
   */
  async sendText(chatId: ChatId, text: string): Promise<string> {
    return this.message.send(chatId, { type: 'text', text })
  }

  /**
   * 发送富文本消息
   */
  async sendPost(chatId: ChatId, content: MessageContent): Promise<string> {
    if (content.type !== 'post') {
      throw new Error('Content must be post type')
    }
    return this.message.send(chatId, content)
  }

  /**
   * 发送卡片消息
   */
  async sendCard(chatId: ChatId, card: Record<string, unknown>): Promise<string> {
    return this.message.send(chatId, { type: 'interactive', card })
  }

  /**
   * 回复消息
   */
  async reply(messageId: string, content: MessageContent): Promise<string> {
    return this.message.reply(messageId, content)
  }

  // ============ 文档 ============

  /**
   * 创建文档
   */
  async createDocument(title: string, folderId?: string): Promise<{ id: string; url: string }> {
    const doc = await this.document.create({ title, folderId })
    return { id: doc.id, url: doc.url }
  }

  /**
   * 向文档追加内容
   */
  async appendToDocument(documentId: DocumentId, blocks: Omit<Block, 'blockId'>[]): Promise<void> {
    // 获取根块
    const { items } = await this.document.getBlocks(documentId)
    const pageBlock = items.find(b => b.blockType === 'page')
    
    if (!pageBlock) {
      throw new Error('Document page block not found')
    }

    await this.document.createBlocks(documentId, pageBlock.blockId, blocks)
  }

  /**
   * 读取文档内容
   */
  async readDocument(documentId: DocumentId): Promise<string> {
    return this.document.getRawContent(documentId)
  }

  // ============ 空间 ============

  /**
   * 创建文件夹
   */
  async createFolder(name: string, parentId?: FolderId): Promise<{ id: string; url: string }> {
    const folder = await this.space.createFolder(name, parentId)
    return { id: folder.id, url: folder.url }
  }

  /**
   * 列出文件
   */
  async listFiles(folderId: FolderId) {
    return this.space.listFiles(folderId)
  }

  /**
   * 搜索文件
   */
  async searchFiles(query: string) {
    return this.space.search(query)
  }

  // ============ 事件 ============

  /**
   * 监听消息事件
   */
  onMessage(handler: EventHandler<MessageEvent>): void {
    this.eventRegistry.on('im.message.receive_v1', handler)
  }

  /**
   * 监听任意事件
   */
  on<T>(eventType: EventType, handler: EventHandler<T>): void {
    this.eventRegistry.on(eventType, handler)
  }

  /**
   * 监听机器人进群事件
   */
  onBotAdded(handler: EventHandler<BotAddedEvent>): void {
    this.eventRegistry.on('im.chat.member.bot.added_v1', handler)
  }

  /**
   * 监听机器人出群事件
   */
  onBotRemoved(handler: EventHandler<BotRemovedEvent>): void {
    this.eventRegistry.on('im.chat.member.bot.deleted_v1', handler)
  }

  /**
   * 监听消息撤回事件
   */
  onMessageRecalled(handler: EventHandler<MessageRecalledEvent>): void {
    this.eventRegistry.on('im.message.recalled_v1', handler)
  }

  /**
   * 处理 Webhook 回调
   * 
   * @param body 请求体 (JSON 解析后)
   * @param options 额外选项 (签名验证等)
   */
  async handleWebhook(body: EventCallback, options?: WebhookOptions): Promise<WebhookResult> {
    return handleWebhook(body, this.config, this.eventRegistry, options)
  }

  /**
   * 创建 Webhook 处理器 (用于 HTTP 框架集成)
   * 
   * @example
   * ```typescript
   * // Express
   * const handler = feishu.createWebhookHandler()
   * app.post('/webhook', express.json(), async (req, res) => {
   *   const result = await handler(req.body, req.headers)
   *   res.json(result.challenge ? { challenge: result.challenge } : {})
   * })
   * 
   * // Hono
   * app.post('/webhook', async (c) => {
   *   const body = await c.req.json()
   *   const handler = feishu.createWebhookHandler()
   *   const result = await handler(body, c.req.header())
   *   return c.json(result.challenge ? { challenge: result.challenge } : {})
   * })
   * ```
   */
  createWebhookHandler() {
    return createWebhookHandler(this.config, this.eventRegistry)
  }
}

/**
 * 创建插件实例
 */
export function createPlugin(config: FeishuConfig): OpenClawFeishuPlugin {
  return new OpenClawFeishuPlugin(config)
}
