import type { DocumentId, UserId, Timestamps } from '@shared/types/index.js'

/**
 * 文档类型
 */
export type DocumentType = 'doc' | 'docx' | 'sheet' | 'bitable' | 'mindnote' | 'wiki'

/**
 * 文档实体
 */
export interface Document extends Timestamps {
  id: DocumentId
  type: DocumentType
  title: string
  ownerId: UserId
  url: string
  
  // 权限相关
  editPermission?: 'only_owner' | 'anyone_can_edit' | 'anyone_can_view'
  isDeleted?: boolean
}

/**
 * 文档块类型
 */
export type BlockType =
  | 'page'
  | 'text'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bullet'
  | 'ordered'
  | 'todo'
  | 'code'
  | 'quote'
  | 'divider'
  | 'image'
  | 'table'
  | 'callout'

/**
 * 文档块
 */
export interface Block {
  blockId: string
  blockType: BlockType
  parentId?: string
  children?: string[]
  content?: BlockContent
}

/**
 * 块内容
 */
export interface BlockContent {
  text?: TextRun[]
  style?: BlockStyle
}

export interface TextRun {
  text: string
  style?: TextStyle
}

export interface TextStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  codeInline?: boolean
  link?: { url: string }
}

export interface BlockStyle {
  align?: 'left' | 'center' | 'right'
  folded?: boolean
  language?: string // for code blocks
  checked?: boolean // for todo
}

/**
 * 创建文本块
 */
export function createTextBlock(text: string, type: BlockType = 'text'): Omit<Block, 'blockId'> {
  return {
    blockType: type,
    content: {
      text: [{ text }],
    },
  }
}
