import type { FeishuConfig } from '@infrastructure/feishu/config.js'
import { createHmac } from 'crypto'

/**
 * 飞书事件类型
 */
export type EventType =
  | 'im.message.receive_v1'        // 接收消息
  | 'im.message.message_read_v1'   // 消息已读
  | 'im.chat.member.bot.added_v1'  // 机器人进群
  | 'im.chat.member.bot.deleted_v1' // 机器人出群
  | 'url_verification'             // URL 验证

/**
 * 事件回调请求
 */
export interface EventCallback {
  schema?: string
  header?: {
    event_id: string
    token: string
    create_time: string
    event_type: EventType
    tenant_key: string
    app_id: string
  }
  event?: Record<string, unknown>
  
  // URL 验证
  challenge?: string
  token?: string
  type?: 'url_verification'
}

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
    sender_type: string
    tenant_key: string
  }
  message: {
    message_id: string
    root_id?: string
    parent_id?: string
    create_time: string
    chat_id: string
    chat_type: 'p2p' | 'group'
    message_type: string
    content: string
    mentions?: Array<{
      key: string
      id: {
        open_id: string
        user_id?: string
      }
      name: string
    }>
  }
}

/**
 * 事件处理器类型
 */
export type EventHandler<T = unknown> = (event: T) => void | Promise<void>

/**
 * 事件处理器管理
 */
export class EventHandlerRegistry {
  private handlers: Map<EventType, EventHandler[]> = new Map()

  /**
   * 注册事件处理器
   */
  on<T>(eventType: EventType, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType) || []
    handlers.push(handler as EventHandler)
    this.handlers.set(eventType, handlers)
  }

  /**
   * 移除事件处理器
   */
  off(eventType: EventType, handler?: EventHandler): void {
    if (!handler) {
      this.handlers.delete(eventType)
      return
    }
    
    const handlers = this.handlers.get(eventType) || []
    const index = handlers.indexOf(handler)
    if (index > -1) {
      handlers.splice(index, 1)
    }
  }

  /**
   * 触发事件
   */
  async emit(eventType: EventType, event: unknown): Promise<void> {
    const handlers = this.handlers.get(eventType) || []
    await Promise.all(handlers.map(h => h(event)))
  }
}

/**
 * 解密事件内容
 * TODO: 完整实现 AES-256-CBC 解密
 */
export function decryptEvent(_encrypted: string, _encryptKey: string): string {
  // 飞书使用 AES-256-CBC 加密
  // 实际实现需要更复杂的解密逻辑
  throw new Error('Decryption not implemented')
}

/**
 * 验证事件签名
 */
export function verifySignature(
  timestamp: string,
  nonce: string,
  body: string,
  encryptKey: string,
  signature: string
): boolean {
  const content = timestamp + nonce + encryptKey + body
  const hash = createHmac('sha256', '').update(content).digest('hex')
  return hash === signature
}

/**
 * 处理 Webhook 请求
 */
export async function handleWebhook(
  body: EventCallback,
  config: FeishuConfig,
  registry: EventHandlerRegistry
): Promise<{ challenge?: string } | void> {
  // URL 验证
  if (body.type === 'url_verification' || body.challenge) {
    return { challenge: body.challenge }
  }

  // 验证 token
  if (config.verificationToken && body.header?.token !== config.verificationToken) {
    throw new Error('Invalid verification token')
  }

  const eventType = body.header?.event_type
  if (!eventType) {
    throw new Error('Missing event type')
  }

  // 触发事件处理
  await registry.emit(eventType, body.event)
}
