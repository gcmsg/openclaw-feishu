import type { ChatId, UserId, Timestamps } from '@shared/types/index.js'

/**
 * 会话类型
 */
export type ChatType = 'p2p' | 'group'

/**
 * 会话/群聊实体
 */
export interface Conversation extends Timestamps {
  id: ChatId
  type: ChatType
  name?: string
  description?: string
  ownerId?: UserId
  memberCount?: number
  avatar?: string
  
  // 群设置
  isExternal?: boolean      // 外部群
  isMeetingChat?: boolean   // 会议群
  addMemberPermission?: 'all_members' | 'only_owner'
  atAllPermission?: 'all_members' | 'only_owner'
}

/**
 * 群成员
 */
export interface ChatMember {
  userId: UserId
  name: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: number
}

/**
 * 判断是否为私聊
 */
export function isP2PChat(conversation: Conversation): boolean {
  return conversation.type === 'p2p'
}

/**
 * 判断是否为群聊
 */
export function isGroupChat(conversation: Conversation): boolean {
  return conversation.type === 'group'
}
