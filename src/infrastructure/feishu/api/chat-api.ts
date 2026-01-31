import type { FeishuClient } from '../client.js'
import type { Conversation, ChatMember } from '@domain/chat/entities/conversation.js'
import type { ChatId, UserId } from '@shared/types/index.js'

/**
 * 会话/群聊 API 封装
 */
export class ChatApi {
  constructor(private client: FeishuClient) {}

  /**
   * 获取群信息
   */
  async get(chatId: ChatId): Promise<Conversation | null> {
    try {
      const response = await this.client.get<{
        chat_id: string
        name: string
        description: string
        owner_id: string
        chat_mode: string
        chat_type: string
        external: boolean
        tenant_key: string
      }>(`/im/v1/chats/${chatId}`)

      return {
        id: response.chat_id,
        type: response.chat_type === 'p2p' ? 'p2p' : 'group',
        name: response.name,
        description: response.description,
        ownerId: response.owner_id,
        isExternal: response.external,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    } catch {
      return null
    }
  }

  /**
   * 获取机器人加入的群列表
   */
  async list(options: {
    pageSize?: number
    pageToken?: string
  } = {}): Promise<{ items: Conversation[]; pageToken?: string; hasMore: boolean }> {
    const { pageSize = 100, pageToken } = options

    const query: Record<string, unknown> = { page_size: pageSize }
    if (pageToken) query.page_token = pageToken

    const response = await this.client.get<{
      items: Array<{
        chat_id: string
        name: string
        description: string
        owner_id: string
        chat_type: string
      }>
      page_token?: string
      has_more?: boolean
    }>('/im/v1/chats', query)

    return {
      items: (response.items || []).map(item => ({
        id: item.chat_id,
        type: item.chat_type === 'p2p' ? 'p2p' as const : 'group' as const,
        name: item.name,
        description: item.description,
        ownerId: item.owner_id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })),
      pageToken: response.page_token,
      hasMore: response.has_more ?? false,
    }
  }

  /**
   * 创建群聊
   */
  async create(options: {
    name: string
    description?: string
    userIdList?: UserId[]
    chatMode?: 'group' | 'topic' | 'p2p'
  }): Promise<Conversation> {
    const response = await this.client.post<{
      chat_id: string
      name: string
    }>('/im/v1/chats', {
      name: options.name,
      description: options.description,
      user_id_list: options.userIdList,
      chat_mode: options.chatMode || 'group',
    })

    return {
      id: response.chat_id,
      type: 'group',
      name: response.name,
      description: options.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  /**
   * 更新群信息
   */
  async update(chatId: ChatId, data: {
    name?: string
    description?: string
    avatar?: string
  }): Promise<void> {
    await this.client.put(`/im/v1/chats/${chatId}`, data)
  }

  /**
   * 解散群聊
   */
  async delete(chatId: ChatId): Promise<void> {
    await this.client.delete(`/im/v1/chats/${chatId}`)
  }

  /**
   * 获取群成员
   */
  async getMembers(chatId: ChatId, options: {
    pageSize?: number
    pageToken?: string
  } = {}): Promise<{ items: ChatMember[]; pageToken?: string; hasMore: boolean }> {
    const { pageSize = 100, pageToken } = options

    const query: Record<string, unknown> = { page_size: pageSize }
    if (pageToken) query.page_token = pageToken

    const response = await this.client.get<{
      items: Array<{
        member_id: string
        name: string
        member_id_type: string
      }>
      page_token?: string
      has_more?: boolean
    }>(`/im/v1/chats/${chatId}/members`, query)

    return {
      items: (response.items || []).map(item => ({
        userId: item.member_id,
        name: item.name,
        role: 'member' as const,
        joinedAt: Date.now(),
      })),
      pageToken: response.page_token,
      hasMore: response.has_more ?? false,
    }
  }

  /**
   * 添加群成员
   */
  async addMembers(chatId: ChatId, userIds: UserId[]): Promise<void> {
    await this.client.post(`/im/v1/chats/${chatId}/members`, {
      id_list: userIds,
    })
  }

  /**
   * 移除群成员
   */
  async removeMembers(chatId: ChatId, userIds: UserId[]): Promise<void> {
    // 飞书 API 需要逐个移除成员
    for (const userId of userIds) {
      await this.client.delete(`/im/v1/chats/${chatId}/members/${userId}`)
    }
  }
}
