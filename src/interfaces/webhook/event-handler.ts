import type { FeishuConfig } from '@infrastructure/feishu/config.js'
import { decrypt, verifySignature, verifyToken } from '@infrastructure/feishu/crypto.js'

/**
 * 飞书事件类型
 */
export type EventType =
  | 'im.message.receive_v1'           // 接收消息
  | 'im.message.message_read_v1'      // 消息已读
  | 'im.message.recalled_v1'          // 消息撤回
  | 'im.chat.member.bot.added_v1'     // 机器人进群
  | 'im.chat.member.bot.deleted_v1'   // 机器人出群
  | 'im.chat.member.user.added_v1'    // 用户进群
  | 'im.chat.member.user.deleted_v1'  // 用户出群
  | 'im.chat.disbanded_v1'            // 群解散
  | 'im.chat.updated_v1'              // 群信息更新
  | 'drive.file.read_v1'              // 文档阅读
  | 'drive.file.title_updated_v1'     // 文档标题更新
  | 'url_verification'                // URL 验证

/**
 * 加密事件回调请求 (v2 schema, 加密模式)
 */
export interface EncryptedEventCallback {
  encrypt: string
}

/**
 * 事件回调请求 (v2 schema)
 */
export interface EventCallbackV2 {
  schema: '2.0'
  header: {
    event_id: string
    token: string
    create_time: string
    event_type: EventType
    tenant_key: string
    app_id: string
  }
  event: Record<string, unknown>
}

/**
 * 事件回调请求 (v1 schema / URL 验证)
 */
export interface EventCallbackV1 {
  uuid?: string
  token?: string
  ts?: string
  type?: 'url_verification' | 'event_callback'
  challenge?: string
  event?: Record<string, unknown>
}

/**
 * 统一事件回调类型
 */
export type EventCallback = EncryptedEventCallback | EventCallbackV2 | EventCallbackV1

/**
 * 消息事件
 */
export interface MessageEvent {
  sender: {
    sender_id: {
      open_id: string
      user_id?: string
      union_id?: string
    }
    sender_type: 'user' | 'app'
    tenant_key: string
  }
  message: {
    message_id: string
    root_id?: string
    parent_id?: string
    create_time: string
    update_time?: string
    chat_id: string
    chat_type: 'p2p' | 'group'
    message_type: 'text' | 'post' | 'image' | 'file' | 'audio' | 'media' | 'sticker' | 'interactive'
    content: string
    mentions?: Array<{
      key: string
      id: {
        open_id: string
        user_id?: string
        union_id?: string
      }
      name: string
      tenant_key?: string
    }>
  }
}

/**
 * 机器人进群事件
 */
export interface BotAddedEvent {
  chat_id: string
  operator_id: {
    open_id: string
    user_id?: string
    union_id?: string
  }
  external: boolean
  operator_tenant_key: string
}

/**
 * 机器人出群事件
 */
export interface BotRemovedEvent {
  chat_id: string
  operator_id: {
    open_id: string
    user_id?: string
    union_id?: string
  }
  external: boolean
  operator_tenant_key: string
}

/**
 * 消息撤回事件
 */
export interface MessageRecalledEvent {
  message_id: string
  chat_id: string
  recall_time: string
  recall_type: 'user' | 'owner_or_admin' | 'bot'
}

/**
 * 事件处理器类型
 */
export type EventHandler<T = unknown> = (event: T, header?: EventCallbackV2['header']) => void | Promise<void>

/**
 * 事件处理器管理
 */
export class EventHandlerRegistry {
  private handlers: Map<EventType, EventHandler[]> = new Map()

  /**
   * 注册事件处理器
   */
  on<T>(eventType: EventType, handler: EventHandler<T>): this {
    const handlers = this.handlers.get(eventType) || []
    handlers.push(handler as EventHandler)
    this.handlers.set(eventType, handlers)
    return this
  }

  /**
   * 注册一次性事件处理器
   */
  once<T>(eventType: EventType, handler: EventHandler<T>): this {
    const wrapper: EventHandler<T> = async (event, header) => {
      this.off(eventType, wrapper as EventHandler)
      await handler(event, header)
    }
    return this.on(eventType, wrapper)
  }

  /**
   * 移除事件处理器
   */
  off(eventType: EventType, handler?: EventHandler): this {
    if (!handler) {
      this.handlers.delete(eventType)
      return this
    }
    
    const handlers = this.handlers.get(eventType) || []
    const index = handlers.indexOf(handler)
    if (index > -1) {
      handlers.splice(index, 1)
    }
    return this
  }

  /**
   * 触发事件
   */
  async emit(eventType: EventType, event: unknown, header?: EventCallbackV2['header']): Promise<void> {
    const handlers = this.handlers.get(eventType) || []
    await Promise.all(handlers.map(h => h(event, header)))
  }

  /**
   * 检查是否有处理器
   */
  has(eventType: EventType): boolean {
    return (this.handlers.get(eventType)?.length ?? 0) > 0
  }
}

/**
 * Webhook 处理选项
 */
export interface WebhookOptions {
  /** 请求头中的时间戳 (X-Lark-Request-Timestamp) */
  timestamp?: string
  /** 请求头中的随机数 (X-Lark-Request-Nonce) */
  nonce?: string
  /** 请求头中的签名 (X-Lark-Signature) */
  signature?: string
  /** 原始请求体字符串 (用于签名验证) */
  rawBody?: string
}

/**
 * Webhook 处理结果
 */
export interface WebhookResult {
  /** URL 验证时返回的 challenge */
  challenge?: string
  /** 是否处理成功 */
  success: boolean
  /** 事件 ID */
  eventId?: string
  /** 事件类型 */
  eventType?: EventType
}

/**
 * 判断是否为加密事件
 */
function isEncrypted(body: EventCallback): body is EncryptedEventCallback {
  return 'encrypt' in body && typeof body.encrypt === 'string'
}

/**
 * 判断是否为 v2 schema
 */
function isV2Schema(body: EventCallback): body is EventCallbackV2 {
  return 'schema' in body && body.schema === '2.0'
}

/**
 * 判断是否为 URL 验证
 */
function isUrlVerification(body: EventCallback): boolean {
  if ('type' in body && body.type === 'url_verification') {
    return true
  }
  if ('challenge' in body && typeof body.challenge === 'string') {
    return true
  }
  return false
}

/**
 * 解析事件回调
 */
function parseEventCallback(body: EventCallback, config: FeishuConfig): EventCallbackV2 | EventCallbackV1 {
  // 解密加密事件
  if (isEncrypted(body)) {
    if (!config.encryptKey) {
      throw new Error('Encrypt key is required for encrypted events')
    }
    const decrypted = decrypt(body.encrypt, config.encryptKey)
    return JSON.parse(decrypted)
  }
  
  return body as EventCallbackV2 | EventCallbackV1
}

/**
 * 处理 Webhook 请求
 * 
 * @param body 请求体
 * @param config 飞书配置
 * @param registry 事件处理器注册表
 * @param options 额外选项
 */
export async function handleWebhook(
  body: EventCallback,
  config: FeishuConfig,
  registry: EventHandlerRegistry,
  options: WebhookOptions = {}
): Promise<WebhookResult> {
  // 1. 签名验证 (v2 加密模式)
  if (options.signature && options.timestamp && options.nonce && options.rawBody) {
    if (!config.encryptKey) {
      throw new Error('Encrypt key is required for signature verification')
    }
    const valid = verifySignature(
      options.timestamp,
      options.nonce,
      config.encryptKey,
      options.rawBody,
      options.signature
    )
    if (!valid) {
      throw new Error('Invalid signature')
    }
  }

  // 2. 解析事件
  const parsed = parseEventCallback(body, config)

  // 3. URL 验证
  if (isUrlVerification(parsed)) {
    const challenge = 'challenge' in parsed ? parsed.challenge : undefined
    return { challenge, success: true }
  }

  // 4. Token 验证
  if (config.verificationToken) {
    const token = isV2Schema(parsed) ? parsed.header.token : (parsed as EventCallbackV1).token
    if (token && !verifyToken(token, config.verificationToken)) {
      throw new Error('Invalid verification token')
    }
  }

  // 5. 分发事件
  if (isV2Schema(parsed)) {
    const { header, event } = parsed
    await registry.emit(header.event_type, event, header)
    return {
      success: true,
      eventId: header.event_id,
      eventType: header.event_type,
    }
  }

  // v1 schema
  const v1 = parsed as EventCallbackV1
  if (v1.event && v1.type === 'event_callback') {
    const eventType = (v1.event as { type?: string }).type as EventType | undefined
    if (eventType) {
      await registry.emit(eventType, v1.event)
      return {
        success: true,
        eventId: v1.uuid,
        eventType,
      }
    }
  }

  return { success: true }
}

/**
 * 创建 Express/Koa 中间件风格的处理函数
 */
export function createWebhookHandler(
  config: FeishuConfig,
  registry: EventHandlerRegistry
) {
  return async (
    body: EventCallback,
    headers?: {
      'x-lark-request-timestamp'?: string
      'x-lark-request-nonce'?: string
      'x-lark-signature'?: string
    },
    rawBody?: string
  ): Promise<WebhookResult> => {
    return handleWebhook(body, config, registry, {
      timestamp: headers?.['x-lark-request-timestamp'],
      nonce: headers?.['x-lark-request-nonce'],
      signature: headers?.['x-lark-signature'],
      rawBody,
    })
  }
}
