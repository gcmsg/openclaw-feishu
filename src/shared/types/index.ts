/**
 * 共享类型定义
 */

// 基础 ID 类型
export type UserId = string
export type ChatId = string
export type MessageId = string
export type DocumentId = string
export type SpaceId = string
export type FolderId = string
export type FileId = string

// 通用结果类型
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

// 分页
export interface Pagination {
  pageToken?: string
  pageSize?: number
}

export interface PaginatedResult<T> {
  items: T[]
  pageToken?: string
  hasMore: boolean
}

// 时间戳
export interface Timestamps {
  createdAt: number
  updatedAt: number
}
