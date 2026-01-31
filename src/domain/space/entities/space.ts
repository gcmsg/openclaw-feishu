import type { SpaceId, FolderId, FileId, UserId, Timestamps } from '@shared/types/index.js'

/**
 * 云空间实体
 */
export interface Space {
  id: SpaceId
  name: string
  ownerId: UserId
  totalSize: number  // 总容量 (bytes)
  usedSize: number   // 已用容量 (bytes)
}

/**
 * 文件夹实体
 */
export interface Folder extends Timestamps {
  id: FolderId
  name: string
  parentId?: FolderId  // 根目录无 parentId
  ownerId: UserId
  url: string
}

/**
 * 文件类型
 */
export type FileType = 
  | 'doc'
  | 'docx'
  | 'sheet'
  | 'bitable'
  | 'mindnote'
  | 'file'      // 普通文件
  | 'folder'
  | 'shortcut'  // 快捷方式

/**
 * 文件/文件夹项
 */
export interface FileItem extends Timestamps {
  id: FileId
  name: string
  type: FileType
  parentId?: FolderId
  ownerId: UserId
  url?: string
  size?: number       // 文件大小 (bytes)
  mimeType?: string   // 普通文件的 MIME 类型
}

/**
 * 文件权限
 */
export type FilePermission = 
  | 'view'      // 可阅读
  | 'edit'      // 可编辑
  | 'full_access' // 完全访问

export interface FileCollaborator {
  userId: UserId
  permission: FilePermission
}

/**
 * 判断是否为文件夹
 */
export function isFolder(item: FileItem): boolean {
  return item.type === 'folder'
}

/**
 * 判断是否为云文档
 */
export function isCloudDocument(item: FileItem): boolean {
  return ['doc', 'docx', 'sheet', 'bitable', 'mindnote'].includes(item.type)
}
