import type { FeishuClient } from '../client.js'
import type { Document, Block, BlockType } from '@domain/document/entities/document.js'
import type { DocumentId } from '@shared/types/index.js'

/**
 * 云文档 API 封装
 */
export class DocumentApi {
  constructor(private client: FeishuClient) {}

  /**
   * 创建文档
   */
  async create(options: {
    title: string
    folderId?: string
  }): Promise<Document> {
    const response = await this.client.post<{
      document: {
        document_id: string
        title: string
      }
    }>('/docx/v1/documents', {
      title: options.title,
      folder_token: options.folderId,
    })

    return {
      id: response.document.document_id,
      type: 'docx',
      title: response.document.title,
      ownerId: '',
      url: `https://feishu.cn/docx/${response.document.document_id}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  /**
   * 获取文档信息
   */
  async get(documentId: DocumentId): Promise<Document | null> {
    try {
      const response = await this.client.get<{
        document: {
          document_id: string
          title: string
        }
      }>(`/docx/v1/documents/${documentId}`)

      return {
        id: response.document.document_id,
        type: 'docx',
        title: response.document.title,
        ownerId: '',
        url: `https://feishu.cn/docx/${documentId}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    } catch {
      return null
    }
  }

  /**
   * 获取文档原始内容
   */
  async getRawContent(documentId: DocumentId): Promise<string> {
    const response = await this.client.get<{
      content: string
    }>(`/docx/v1/documents/${documentId}/raw_content`)

    return response.content
  }

  /**
   * 获取文档块列表
   */
  async getBlocks(documentId: DocumentId, options: {
    pageSize?: number
    pageToken?: string
  } = {}): Promise<{ items: Block[]; pageToken?: string; hasMore: boolean }> {
    const { pageSize = 500, pageToken } = options

    const query: Record<string, unknown> = { page_size: pageSize }
    if (pageToken) query.page_token = pageToken

    const response = await this.client.get<{
      items: Array<{
        block_id: string
        block_type: number
        parent_id: string
        children: string[]
        text?: { elements: Array<{ text_run?: { content: string } }> }
      }>
      page_token?: string
      has_more?: boolean
    }>(`/docx/v1/documents/${documentId}/blocks`, query)

    return {
      items: (response.items || []).map(item => this.parseBlock(item)),
      pageToken: response.page_token,
      hasMore: response.has_more ?? false,
    }
  }

  /**
   * 获取单个块
   */
  async getBlock(documentId: DocumentId, blockId: string): Promise<Block | null> {
    try {
      const response = await this.client.get<{
        block: {
          block_id: string
          block_type: number
          parent_id: string
          children: string[]
        }
      }>(`/docx/v1/documents/${documentId}/blocks/${blockId}`)

      return this.parseBlock(response.block)
    } catch {
      return null
    }
  }

  /**
   * 创建块
   */
  async createBlock(
    documentId: DocumentId,
    parentBlockId: string,
    block: Omit<Block, 'blockId'>,
    index?: number
  ): Promise<Block> {
    const response = await this.client.post<{
      children: Array<{
        block_id: string
        block_type: number
      }>
    }>(`/docx/v1/documents/${documentId}/blocks/${parentBlockId}/children`, {
      children: [this.serializeBlock(block)],
      index,
    })

    const created = response.children[0]
    return {
      blockId: created.block_id,
      blockType: this.blockTypeFromNumber(created.block_type),
      parentId: parentBlockId,
      content: block.content,
    }
  }

  /**
   * 批量创建块
   */
  async createBlocks(
    documentId: DocumentId,
    parentBlockId: string,
    blocks: Omit<Block, 'blockId'>[],
    index?: number
  ): Promise<Block[]> {
    const response = await this.client.post<{
      children: Array<{
        block_id: string
        block_type: number
      }>
    }>(`/docx/v1/documents/${documentId}/blocks/${parentBlockId}/children`, {
      children: blocks.map(b => this.serializeBlock(b)),
      index,
    })

    return response.children.map((c, i) => ({
      blockId: c.block_id,
      blockType: this.blockTypeFromNumber(c.block_type),
      parentId: parentBlockId,
      content: blocks[i].content,
    }))
  }

  /**
   * 更新块
   */
  async updateBlock(documentId: DocumentId, blockId: string, content: Block['content']): Promise<Block> {
    const response = await this.client.patch<{
      block: {
        block_id: string
        block_type: number
      }
    }>(`/docx/v1/documents/${documentId}/blocks/${blockId}`, {
      update_text_elements: {
        elements: content?.text?.map(t => ({
          text_run: { content: t.text },
        })),
      },
    })

    return {
      blockId: response.block.block_id,
      blockType: this.blockTypeFromNumber(response.block.block_type),
      content,
    }
  }

  /**
   * 删除块
   */
  async deleteBlock(documentId: DocumentId, blockId: string): Promise<void> {
    await this.client.delete(`/docx/v1/documents/${documentId}/blocks/${blockId}`)
  }

  /**
   * 解析块
   */
  private parseBlock(raw: { block_id: string; block_type: number; parent_id?: string; children?: string[]; text?: { elements: Array<{ text_run?: { content: string } }> } }): Block {
    return {
      blockId: raw.block_id,
      blockType: this.blockTypeFromNumber(raw.block_type),
      parentId: raw.parent_id,
      children: raw.children,
      content: raw.text ? {
        text: raw.text.elements
          .filter(e => e.text_run)
          .map(e => ({ text: e.text_run!.content })),
      } : undefined,
    }
  }

  /**
   * 序列化块
   */
  private serializeBlock(block: Omit<Block, 'blockId'>): Record<string, unknown> {
    const blockTypeNum = this.blockTypeToNumber(block.blockType)
    const result: Record<string, unknown> = { block_type: blockTypeNum }

    if (block.content?.text) {
      result.text = {
        elements: block.content.text.map(t => ({
          text_run: { content: t.text },
        })),
      }
    }

    return result
  }

  private blockTypeToNumber(type: BlockType): number {
    const map: Record<BlockType, number> = {
      page: 1, text: 2, heading1: 3, heading2: 4, heading3: 5,
      bullet: 6, ordered: 7, todo: 8, code: 9, quote: 10,
      divider: 11, image: 12, table: 13, callout: 14,
    }
    return map[type] || 2
  }

  private blockTypeFromNumber(num: number): BlockType {
    const map: Record<number, BlockType> = {
      1: 'page', 2: 'text', 3: 'heading1', 4: 'heading2', 5: 'heading3',
      6: 'bullet', 7: 'ordered', 8: 'todo', 9: 'code', 10: 'quote',
      11: 'divider', 12: 'image', 13: 'table', 14: 'callout',
    }
    return map[num] || 'text'
  }
}
