import type { Document, Block } from '../entities/document.js'
import type { DocumentId, PaginatedResult, Pagination } from '@shared/types/index.js'

/**
 * 文档仓储接口
 */
export interface IDocumentRepository {
  /**
   * 创建文档
   */
  create(options: {
    title: string
    folderId?: string
    type?: 'doc' | 'docx'
  }): Promise<Document>

  /**
   * 获取文档信息
   */
  getById(documentId: DocumentId): Promise<Document | null>

  /**
   * 获取文档原始内容
   */
  getContent(documentId: DocumentId): Promise<string>

  /**
   * 获取文档块列表
   */
  getBlocks(documentId: DocumentId, pagination?: Pagination): Promise<PaginatedResult<Block>>

  /**
   * 获取单个块
   */
  getBlock(documentId: DocumentId, blockId: string): Promise<Block | null>

  /**
   * 创建块
   */
  createBlock(
    documentId: DocumentId,
    parentBlockId: string,
    block: Omit<Block, 'blockId'>,
    index?: number
  ): Promise<Block>

  /**
   * 批量创建块
   */
  createBlocks(
    documentId: DocumentId,
    parentBlockId: string,
    blocks: Omit<Block, 'blockId'>[],
    index?: number
  ): Promise<Block[]>

  /**
   * 更新块
   */
  updateBlock(documentId: DocumentId, blockId: string, content: Block['content']): Promise<Block>

  /**
   * 删除块
   */
  deleteBlock(documentId: DocumentId, blockId: string): Promise<void>

  /**
   * 删除文档
   */
  delete(documentId: DocumentId): Promise<void>
}
