import type { Message } from '../entities/message.js'
import type { ChatId, MessageId, PaginatedResult, Pagination } from '@shared/types/index.js'

/**
 * 消息仓储接口
 */
export interface IMessageRepository {
  /**
   * 发送消息
   */
  send(chatId: ChatId, message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message>

  /**
   * 回复消息
   */
  reply(messageId: MessageId, message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message>

  /**
   * 获取消息
   */
  getById(messageId: MessageId): Promise<Message | null>

  /**
   * 获取会话历史消息
   */
  listByChat(chatId: ChatId, pagination?: Pagination): Promise<PaginatedResult<Message>>

  /**
   * 撤回消息
   */
  recall(messageId: MessageId): Promise<void>

  /**
   * 更新消息（仅卡片消息可更新）
   */
  update(messageId: MessageId, content: Message['content']): Promise<Message>
}
