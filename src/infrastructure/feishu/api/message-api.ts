import type { FeishuClient } from '../client.js'
import type { MessageContent, TextContent, PostContent, InteractiveContent } from '@domain/chat/entities/message.js'
import type { ChatId, MessageId } from '@shared/types/index.js'

/**
 * 飞书消息 API 响应类型
 */
interface SendMessageResponse {
  message_id: string
}

interface GetMessageResponse {
  items: Array<{
    message_id: string
    chat_id: string
    msg_type: string
    content: string
    sender: {
      id: string
      id_type: string
    }
    create_time: string
  }>
}

/**
 * 消息 API 封装
 */
export class MessageApi {
  constructor(private client: FeishuClient) {}

  /**
   * 发送消息
   */
  async send(
    receiveId: ChatId,
    content: MessageContent,
    receiveIdType: 'chat_id' | 'open_id' | 'user_id' | 'email' = 'chat_id'
  ): Promise<string> {
    const { msgType, body } = this.serializeContent(content)

    const response = await this.client.post<SendMessageResponse>(
      `/im/v1/messages?receive_id_type=${receiveIdType}`,
      {
        receive_id: receiveId,
        msg_type: msgType,
        content: JSON.stringify(body),
      }
    )

    return response.message_id
  }

  /**
   * 回复消息
   */
  async reply(messageId: MessageId, content: MessageContent): Promise<string> {
    const { msgType, body } = this.serializeContent(content)

    const response = await this.client.post<SendMessageResponse>(
      `/im/v1/messages/${messageId}/reply`,
      {
        msg_type: msgType,
        content: JSON.stringify(body),
      }
    )

    return response.message_id
  }

  /**
   * 撤回消息
   */
  async recall(messageId: MessageId): Promise<void> {
    await this.client.delete(`/im/v1/messages/${messageId}`)
  }

  /**
   * 更新卡片消息
   */
  async updateCard(messageId: MessageId, card: Record<string, unknown>): Promise<void> {
    await this.client.patch(`/im/v1/messages/${messageId}`, {
      content: JSON.stringify(card),
    })
  }

  /**
   * 获取消息历史
   */
  async listByChat(
    chatId: ChatId,
    options: {
      startTime?: string
      endTime?: string
      pageSize?: number
      pageToken?: string
    } = {}
  ): Promise<{ items: unknown[]; pageToken?: string; hasMore: boolean }> {
    const { pageSize = 50, pageToken, startTime, endTime } = options

    const query: Record<string, unknown> = {
      container_id_type: 'chat',
      container_id: chatId,
      page_size: pageSize,
    }

    if (pageToken) query.page_token = pageToken
    if (startTime) query.start_time = startTime
    if (endTime) query.end_time = endTime

    const response = await this.client.get<GetMessageResponse & { page_token?: string; has_more?: boolean }>(
      '/im/v1/messages',
      query
    )

    return {
      items: response.items || [],
      pageToken: response.page_token,
      hasMore: response.has_more ?? false,
    }
  }

  /**
   * 序列化消息内容
   */
  private serializeContent(content: MessageContent): { msgType: string; body: unknown } {
    switch (content.type) {
      case 'text':
        return {
          msgType: 'text',
          body: { text: (content as TextContent).text },
        }

      case 'post':
        return {
          msgType: 'post',
          body: {
            zh_cn: {
              title: (content as PostContent).title,
              content: (content as PostContent).content,
            },
          },
        }

      case 'image':
        return {
          msgType: 'image',
          body: { image_key: content.imageKey },
        }

      case 'file':
        return {
          msgType: 'file',
          body: { file_key: content.fileKey },
        }

      case 'interactive':
        return {
          msgType: 'interactive',
          body: (content as InteractiveContent).card,
        }

      default:
        throw new Error(`Unsupported message type: ${(content as { type: string }).type}`)
    }
  }
}
