import type { FeishuClient } from '../client.js'
import type { Folder, FileItem, FileType } from '@domain/space/entities/space.js'
import type { FolderId, FileId } from '@shared/types/index.js'

/**
 * 云空间 API 封装
 */
export class SpaceApi {
  constructor(private client: FeishuClient) {}

  /**
   * 获取根文件夹 Token
   */
  async getRootFolder(): Promise<Folder> {
    const response = await this.client.get<{
      token: string
      id: string
      user_id: string
    }>('/drive/explorer/v2/root_folder/meta')

    return {
      id: response.token,
      name: 'My Space',
      ownerId: response.user_id,
      url: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  /**
   * 获取文件夹信息
   */
  async getFolder(folderId: FolderId): Promise<Folder | null> {
    try {
      const response = await this.client.get<{
        name: string
        token: string
        owner_id: string
        create_time: string
        edit_time: string
        parent_token: string
      }>(`/drive/v1/files/${folderId}`)

      return {
        id: response.token,
        name: response.name,
        parentId: response.parent_token || undefined,
        ownerId: response.owner_id,
        url: '',
        createdAt: parseInt(response.create_time) * 1000,
        updatedAt: parseInt(response.edit_time) * 1000,
      }
    } catch {
      return null
    }
  }

  /**
   * 创建文件夹
   */
  async createFolder(name: string, parentFolderToken?: string): Promise<Folder> {
    const response = await this.client.post<{
      token: string
      url: string
    }>('/drive/v1/files/create_folder', {
      name,
      folder_token: parentFolderToken,
    })

    return {
      id: response.token,
      name,
      parentId: parentFolderToken,
      ownerId: '',
      url: response.url,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  /**
   * 获取文件列表
   */
  async listFiles(folderToken: FolderId, options: {
    pageSize?: number
    pageToken?: string
  } = {}): Promise<{ items: FileItem[]; pageToken?: string; hasMore: boolean }> {
    const { pageSize = 200, pageToken } = options

    const query: Record<string, unknown> = {
      folder_token: folderToken,
      page_size: pageSize,
    }
    if (pageToken) query.page_token = pageToken

    const response = await this.client.get<{
      files: Array<{
        token: string
        name: string
        type: string
        parent_token: string
        owner_id: string
        create_time: string
        edit_time: string
        url: string
      }>
      page_token?: string
      has_more?: boolean
    }>('/drive/v1/files', query)

    return {
      items: (response.files || []).map(f => ({
        id: f.token,
        name: f.name,
        type: this.parseFileType(f.type),
        parentId: f.parent_token,
        ownerId: f.owner_id,
        url: f.url,
        createdAt: parseInt(f.create_time) * 1000,
        updatedAt: parseInt(f.edit_time) * 1000,
      })),
      pageToken: response.page_token,
      hasMore: response.has_more ?? false,
    }
  }

  /**
   * 移动文件
   */
  async move(fileToken: FileId, targetFolderToken: FolderId): Promise<void> {
    await this.client.post(`/drive/v1/files/${fileToken}/move`, {
      folder_token: targetFolderToken,
    })
  }

  /**
   * 复制文件
   */
  async copy(fileToken: FileId, targetFolderToken: FolderId, newName?: string): Promise<FileItem> {
    const response = await this.client.post<{
      file: {
        token: string
        name: string
        type: string
        parent_token: string
      }
    }>(`/drive/v1/files/${fileToken}/copy`, {
      folder_token: targetFolderToken,
      name: newName,
    })

    return {
      id: response.file.token,
      name: response.file.name,
      type: this.parseFileType(response.file.type),
      parentId: response.file.parent_token,
      ownerId: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  /**
   * 删除文件
   */
  async delete(fileToken: FileId): Promise<void> {
    await this.client.delete(`/drive/v1/files/${fileToken}`)
  }

  /**
   * 搜索文件
   */
  async search(query: string, options: {
    pageSize?: number
    pageToken?: string
  } = {}): Promise<{ items: FileItem[]; pageToken?: string; hasMore: boolean }> {
    const { pageSize = 50, pageToken } = options

    const body: Record<string, unknown> = {
      search_key: query,
      count: pageSize,
    }
    if (pageToken) body.page_token = pageToken

    const response = await this.client.post<{
      docs_entities: Array<{
        docs_token: string
        docs_type: string
        title: string
        owner_id: string
      }>
      page_token?: string
      has_more?: boolean
    }>('/suite/docs-api/search/object', body)

    return {
      items: (response.docs_entities || []).map(d => ({
        id: d.docs_token,
        name: d.title,
        type: this.parseFileType(d.docs_type),
        ownerId: d.owner_id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })),
      pageToken: response.page_token,
      hasMore: response.has_more ?? false,
    }
  }

  /**
   * 解析文件类型
   */
  private parseFileType(type: string): FileType {
    const map: Record<string, FileType> = {
      doc: 'doc',
      docx: 'docx',
      sheet: 'sheet',
      bitable: 'bitable',
      mindnote: 'mindnote',
      file: 'file',
      folder: 'folder',
      shortcut: 'shortcut',
    }
    return map[type.toLowerCase()] || 'file'
  }
}
