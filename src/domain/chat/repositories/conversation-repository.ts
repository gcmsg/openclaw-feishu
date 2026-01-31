import type { Conversation, ChatMember } from '../entities/conversation.js'
import type { ChatId, UserId, PaginatedResult, Pagination } from '@shared/types/index.js'

/**
 * 会话仓储接口
 */
export interface IConversationRepository {
  /**
   * 获取会话信息
   */
  getById(chatId: ChatId): Promise<Conversation | null>

  /**
   * 获取机器人加入的会话列表
   */
  list(pagination?: Pagination): Promise<PaginatedResult<Conversation>>

  /**
   * 创建群聊
   */
  create(options: {
    name: string
    description?: string
    userIds?: UserId[]
  }): Promise<Conversation>

  /**
   * 更新群信息
   */
  update(chatId: ChatId, data: Partial<Pick<Conversation, 'name' | 'description' | 'avatar'>>): Promise<Conversation>

  /**
   * 解散群聊
   */
  delete(chatId: ChatId): Promise<void>

  /**
   * 获取群成员
   */
  getMembers(chatId: ChatId, pagination?: Pagination): Promise<PaginatedResult<ChatMember>>

  /**
   * 添加群成员
   */
  addMembers(chatId: ChatId, userIds: UserId[]): Promise<void>

  /**
   * 移除群成员
   */
  removeMembers(chatId: ChatId, userIds: UserId[]): Promise<void>
}
