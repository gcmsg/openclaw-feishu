import type { Space, Folder, FileItem, FilePermission, FileCollaborator } from '../entities/space.js'
import type { FolderId, FileId, UserId, PaginatedResult, Pagination } from '@shared/types/index.js'

/**
 * 云空间仓储接口
 */
export interface ISpaceRepository {
  /**
   * 获取用户云空间信息
   */
  getSpace(userId?: UserId): Promise<Space>

  /**
   * 获取根文件夹
   */
  getRootFolder(): Promise<Folder>

  /**
   * 获取文件夹信息
   */
  getFolder(folderId: FolderId): Promise<Folder | null>

  /**
   * 创建文件夹
   */
  createFolder(name: string, parentId?: FolderId): Promise<Folder>

  /**
   * 获取文件夹内容
   */
  listFiles(folderId: FolderId, pagination?: Pagination): Promise<PaginatedResult<FileItem>>

  /**
   * 获取文件信息
   */
  getFile(fileId: FileId): Promise<FileItem | null>

  /**
   * 上传文件
   */
  uploadFile(
    folderId: FolderId,
    file: {
      name: string
      content: Buffer
      mimeType?: string
    }
  ): Promise<FileItem>

  /**
   * 下载文件
   */
  downloadFile(fileId: FileId): Promise<Buffer>

  /**
   * 移动文件/文件夹
   */
  move(fileId: FileId, targetFolderId: FolderId): Promise<void>

  /**
   * 复制文件/文件夹
   */
  copy(fileId: FileId, targetFolderId: FolderId, newName?: string): Promise<FileItem>

  /**
   * 删除文件/文件夹
   */
  delete(fileId: FileId): Promise<void>

  /**
   * 重命名
   */
  rename(fileId: FileId, newName: string): Promise<FileItem>

  /**
   * 获取协作者
   */
  getCollaborators(fileId: FileId): Promise<FileCollaborator[]>

  /**
   * 添加协作者
   */
  addCollaborator(fileId: FileId, userId: UserId, permission: FilePermission): Promise<void>

  /**
   * 移除协作者
   */
  removeCollaborator(fileId: FileId, userId: UserId): Promise<void>

  /**
   * 搜索文件
   */
  search(query: string, pagination?: Pagination): Promise<PaginatedResult<FileItem>>
}
