/**
 * 自定义错误类型
 */

export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public readonly field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`)
    this.name = 'NotFoundError'
  }
}

export class FeishuApiError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly requestId?: string
  ) {
    super(message)
    this.name = 'FeishuApiError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class RateLimitError extends Error {
  public readonly retryAfter: number

  constructor(retryAfter: number = 60) {
    super(`Rate limited. Retry after ${retryAfter} seconds`)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}
