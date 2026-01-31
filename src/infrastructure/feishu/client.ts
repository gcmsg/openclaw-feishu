import { ofetch } from 'ofetch'
import type { FeishuConfig } from './config.js'
import { FeishuAuth } from './auth.js'
import { FeishuApiError, RateLimitError } from '@shared/errors/index.js'
import { retry } from '@shared/utils/index.js'

/**
 * 飞书 API 响应格式
 */
export interface FeishuResponse<T = unknown> {
  code: number
  msg: string
  data?: T
}

/**
 * 请求选项
 */
export interface RequestOptions {
  useAppToken?: boolean  // 使用 App Token 而非 Tenant Token
  retries?: number
}

/**
 * 飞书 HTTP 客户端
 */
export class FeishuClient {
  private config: FeishuConfig
  private auth: FeishuAuth

  constructor(config: FeishuConfig) {
    this.config = config
    this.auth = new FeishuAuth(config)
  }

  /**
   * 发起 GET 请求
   */
  async get<T>(path: string, query?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, { query }, options)
  }

  /**
   * 发起 POST 请求
   */
  async post<T>(path: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, { body }, options)
  }

  /**
   * 发起 PUT 请求
   */
  async put<T>(path: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, { body }, options)
  }

  /**
   * 发起 PATCH 请求
   */
  async patch<T>(path: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, { body }, options)
  }

  /**
   * 发起 DELETE 请求
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, {}, options)
  }

  /**
   * 通用请求方法
   */
  private async request<T>(
    method: string,
    path: string,
    fetchOptions: { query?: Record<string, unknown>; body?: Record<string, unknown>; headers?: Record<string, string> } = {},
    options: RequestOptions = {}
  ): Promise<T> {
    const { useAppToken = false, retries = 3 } = options

    const token = useAppToken
      ? await this.auth.getAppAccessToken()
      : await this.auth.getTenantAccessToken()

    const url = path.startsWith('http') ? path : `${this.config.baseUrl}${path}`

    const doRequest = async (): Promise<T> => {
      const response = await ofetch<FeishuResponse<T>>(url, {
        method,
        ...fetchOptions,
        timeout: this.config.timeout,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
          ...fetchOptions.headers as Record<string, string>,
        },
      })

      // 飞书 API 错误处理
      if (response.code !== 0) {
        // 限流错误
        if (response.code === 99991400) {
          throw new RateLimitError(60)
        }

        // Token 过期，清除缓存重试
        if (response.code === 99991663 || response.code === 99991664) {
          this.auth.clearCache()
          throw new Error('Token expired, retrying...')
        }

        throw new FeishuApiError(response.msg, response.code)
      }

      return response.data as T
    }

    return retry(doRequest, { maxAttempts: retries })
  }

  /**
   * 上传文件
   */
  async upload(path: string, formData: FormData): Promise<unknown> {
    const token = await this.auth.getTenantAccessToken()
    const url = `${this.config.baseUrl}${path}`

    const response = await ofetch<FeishuResponse>(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (response.code !== 0) {
      throw new FeishuApiError(response.msg, response.code)
    }

    return response.data
  }

  /**
   * 下载文件
   */
  async download(path: string): Promise<ArrayBuffer> {
    const token = await this.auth.getTenantAccessToken()
    const url = `${this.config.baseUrl}${path}`

    return ofetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      responseType: 'arrayBuffer',
    })
  }
}
