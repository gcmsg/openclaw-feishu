import type { MessageId, ChatId, UserId, Timestamps } from '@shared/types/index.js'

/**
 * 消息类型
 */
export type MessageType = 
  | 'text'
  | 'post'       // 富文本
  | 'image'
  | 'file'
  | 'audio'
  | 'media'
  | 'sticker'
  | 'interactive' // 卡片消息

/**
 * 消息实体
 */
export interface Message extends Timestamps {
  id: MessageId
  chatId: ChatId
  senderId: UserId
  type: MessageType
  content: MessageContent
  mentionedUserIds?: UserId[]
  replyToMessageId?: MessageId
  isRecalled?: boolean
}

/**
 * 消息内容（联合类型）
 */
export type MessageContent =
  | TextContent
  | PostContent
  | ImageContent
  | FileContent
  | InteractiveContent

export interface TextContent {
  type: 'text'
  text: string
}

export interface PostContent {
  type: 'post'
  title?: string
  content: PostBlock[][]
}

export type PostBlock = 
  | { tag: 'text'; text: string; style?: string[] }
  | { tag: 'a'; text: string; href: string }
  | { tag: 'at'; userId: string; userName?: string }
  | { tag: 'img'; imageKey: string }

export interface ImageContent {
  type: 'image'
  imageKey: string
}

export interface FileContent {
  type: 'file'
  fileKey: string
  fileName: string
}

export interface InteractiveContent {
  type: 'interactive'
  card: Record<string, unknown> // 卡片 JSON
}

/**
 * 创建文本消息
 */
export function createTextMessage(
  chatId: ChatId,
  senderId: UserId,
  text: string
): Omit<Message, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    chatId,
    senderId,
    type: 'text',
    content: { type: 'text', text },
  }
}
