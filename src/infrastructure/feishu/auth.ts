import type { FeishuConfig } from './config.js'
import { ofetch } from 'ofetch'
import { AuthenticationError } from '@shared/errors/index.js'

/**
 * Token 信息
 */
interface TokenInfo {
  accessToken: string
  expiresAt: number // Unix timestamp (ms)
}

/**
 * 飞书认证管理
 */
export class FeishuAuth {
  private tenantToken: TokenInfo | null = null
  private appToken: TokenInfo | null = null
  private config: FeishuConfig

  constructor(config: FeishuConfig) {
    this.config = config
  }

  /**
   * 获取 Tenant Access Token (应用商店应用)
   */
  async getTenantAccessToken(): Promise<string> {
    // 检查缓存是否有效 (提前5分钟刷新)
    if (this.tenantToken && this.tenantToken.expiresAt > Date.now() + 5 * 60 * 1000) {
      return this.tenantToken.accessToken
    }

    const response = await ofetch<{
      code: number
      msg: string
      tenant_access_token: string
      expire: number
    }>(`${this.config.baseUrl}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      body: {
        app_id: this.config.appId,
        app_secret: this.config.appSecret,
      },
    })

    if (response.code !== 0) {
      throw new AuthenticationError(`Failed to get tenant access token: ${response.msg}`)
    }

    this.tenantToken = {
      accessToken: response.tenant_access_token,
      expiresAt: Date.now() + response.expire * 1000,
    }

    return this.tenantToken.accessToken
  }

  /**
   * 获取 App Access Token (自建应用)
   */
  async getAppAccessToken(): Promise<string> {
    if (this.appToken && this.appToken.expiresAt > Date.now() + 5 * 60 * 1000) {
      return this.appToken.accessToken
    }

    const response = await ofetch<{
      code: number
      msg: string
      app_access_token: string
      expire: number
    }>(`${this.config.baseUrl}/auth/v3/app_access_token/internal`, {
      method: 'POST',
      body: {
        app_id: this.config.appId,
        app_secret: this.config.appSecret,
      },
    })

    if (response.code !== 0) {
      throw new AuthenticationError(`Failed to get app access token: ${response.msg}`)
    }

    this.appToken = {
      accessToken: response.app_access_token,
      expiresAt: Date.now() + response.expire * 1000,
    }

    return this.appToken.accessToken
  }

  /**
   * 清除缓存的 Token
   */
  clearCache(): void {
    this.tenantToken = null
    this.appToken = null
  }
}
