import type { UserId } from '@shared/types/index.js'

/**
 * 用户状态
 */
export type UserStatus = 'active' | 'frozen' | 'resigned' | 'not_activated'

/**
 * 用户实体
 */
export interface User {
  id: UserId
  openId: string       // 应用内唯一标识
  unionId?: string     // 跨应用唯一标识
  name: string
  enName?: string
  nickname?: string
  email?: string
  mobile?: string
  avatar?: {
    avatar72: string
    avatar240: string
    avatar640: string
    avatarOrigin: string
  }
  status?: UserStatus
  departmentIds?: string[]
}

/**
 * 简化用户信息（用于显示）
 */
export interface UserInfo {
  id: UserId
  name: string
  avatar?: string
}

/**
 * 从完整用户提取简化信息
 */
export function toUserInfo(user: User): UserInfo {
  return {
    id: user.id,
    name: user.nickname || user.name,
    avatar: user.avatar?.avatar240,
  }
}
