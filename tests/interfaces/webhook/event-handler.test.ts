import { describe, it, expect, vi } from 'vitest'
import { createCipheriv, createHash, randomBytes } from 'crypto'
import { 
  EventHandlerRegistry, 
  handleWebhook,
  type EventCallbackV2,
  type MessageEvent,
} from '../../../src/interfaces/webhook/event-handler.js'
import type { FeishuConfig } from '../../../src/infrastructure/feishu/config.js'

// 模拟加密函数
function encrypt(plaintext: string, encryptKey: string): string {
  const key = createHash('sha256').update(encryptKey).digest()
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(plaintext, 'utf8')
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return Buffer.concat([iv, encrypted]).toString('base64')
}

const mockConfig: FeishuConfig = {
  appId: 'cli_test',
  appSecret: 'secret_test',
  encryptKey: 'test_encrypt_key',
  verificationToken: 'test_token',
  baseUrl: 'https://open.feishu.cn/open-apis',
  timeout: 30000,
  debug: false,
}

describe('EventHandlerRegistry', () => {
  it('should register and emit events', async () => {
    const registry = new EventHandlerRegistry()
    const handler = vi.fn()

    registry.on('im.message.receive_v1', handler)
    await registry.emit('im.message.receive_v1', { test: true })

    expect(handler).toHaveBeenCalledWith({ test: true }, undefined)
  })

  it('should support multiple handlers', async () => {
    const registry = new EventHandlerRegistry()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    registry.on('im.message.receive_v1', handler1)
    registry.on('im.message.receive_v1', handler2)
    await registry.emit('im.message.receive_v1', { data: 1 })

    expect(handler1).toHaveBeenCalled()
    expect(handler2).toHaveBeenCalled()
  })

  it('should support chaining', () => {
    const registry = new EventHandlerRegistry()
    
    const result = registry
      .on('im.message.receive_v1', () => {})
      .on('im.chat.member.bot.added_v1', () => {})

    expect(result).toBe(registry)
  })

  it('should remove specific handler', async () => {
    const registry = new EventHandlerRegistry()
    const handler = vi.fn()

    registry.on('im.message.receive_v1', handler)
    registry.off('im.message.receive_v1', handler)
    await registry.emit('im.message.receive_v1', {})

    expect(handler).not.toHaveBeenCalled()
  })

  it('should remove all handlers for event type', async () => {
    const registry = new EventHandlerRegistry()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    registry.on('im.message.receive_v1', handler1)
    registry.on('im.message.receive_v1', handler2)
    registry.off('im.message.receive_v1')
    await registry.emit('im.message.receive_v1', {})

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).not.toHaveBeenCalled()
  })

  it('should support once handler', async () => {
    const registry = new EventHandlerRegistry()
    const handler = vi.fn()

    registry.once('im.message.receive_v1', handler)
    
    await registry.emit('im.message.receive_v1', { first: true })
    await registry.emit('im.message.receive_v1', { second: true })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ first: true }, undefined)
  })

  it('should check if handlers exist', () => {
    const registry = new EventHandlerRegistry()
    
    expect(registry.has('im.message.receive_v1')).toBe(false)
    
    registry.on('im.message.receive_v1', () => {})
    expect(registry.has('im.message.receive_v1')).toBe(true)
  })
})

describe('handleWebhook', () => {
  it('should handle URL verification', async () => {
    const registry = new EventHandlerRegistry()
    
    const result = await handleWebhook(
      { challenge: 'test_challenge_123', type: 'url_verification' },
      mockConfig,
      registry
    )

    expect(result.challenge).toBe('test_challenge_123')
    expect(result.success).toBe(true)
  })

  it('should handle encrypted URL verification', async () => {
    const registry = new EventHandlerRegistry()
    const plaintext = JSON.stringify({ challenge: 'encrypted_challenge' })
    const encrypted = encrypt(plaintext, mockConfig.encryptKey!)

    const result = await handleWebhook(
      { encrypt: encrypted },
      mockConfig,
      registry
    )

    expect(result.challenge).toBe('encrypted_challenge')
    expect(result.success).toBe(true)
  })

  it('should handle v2 schema events', async () => {
    const registry = new EventHandlerRegistry()
    const handler = vi.fn()
    registry.on('im.message.receive_v1', handler)

    const event: EventCallbackV2 = {
      schema: '2.0',
      header: {
        event_id: 'evt_123',
        token: 'test_token',
        create_time: '1234567890',
        event_type: 'im.message.receive_v1',
        tenant_key: 'tenant_123',
        app_id: 'cli_test',
      },
      event: {
        message: {
          message_id: 'msg_456',
          content: '{"text":"Hello"}',
        }
      }
    }

    const result = await handleWebhook(event, mockConfig, registry)

    expect(result.success).toBe(true)
    expect(result.eventId).toBe('evt_123')
    expect(result.eventType).toBe('im.message.receive_v1')
    expect(handler).toHaveBeenCalledWith(event.event, event.header)
  })

  it('should handle encrypted v2 events', async () => {
    const registry = new EventHandlerRegistry()
    const handler = vi.fn()
    registry.on('im.message.receive_v1', handler)

    const event: EventCallbackV2 = {
      schema: '2.0',
      header: {
        event_id: 'evt_encrypted',
        token: 'test_token',
        create_time: '1234567890',
        event_type: 'im.message.receive_v1',
        tenant_key: 'tenant_123',
        app_id: 'cli_test',
      },
      event: {
        message: { content: 'secret' }
      }
    }

    const encrypted = encrypt(JSON.stringify(event), mockConfig.encryptKey!)

    const result = await handleWebhook(
      { encrypt: encrypted },
      mockConfig,
      registry
    )

    expect(result.success).toBe(true)
    expect(result.eventType).toBe('im.message.receive_v1')
    expect(handler).toHaveBeenCalled()
  })

  it('should reject invalid verification token', async () => {
    const registry = new EventHandlerRegistry()

    const event: EventCallbackV2 = {
      schema: '2.0',
      header: {
        event_id: 'evt_123',
        token: 'wrong_token', // 错误的 token
        create_time: '1234567890',
        event_type: 'im.message.receive_v1',
        tenant_key: 'tenant_123',
        app_id: 'cli_test',
      },
      event: {}
    }

    await expect(handleWebhook(event, mockConfig, registry))
      .rejects.toThrow('Invalid verification token')
  })

  it('should verify signature when provided', async () => {
    const registry = new EventHandlerRegistry()
    const rawBody = '{"encrypt":"xxx"}'
    const timestamp = '1234567890'
    const nonce = 'abc123'
    
    // 计算正确签名
    const content = timestamp + nonce + mockConfig.encryptKey + rawBody
    const signature = createHash('sha256').update(content).digest('hex')

    // 应该不抛出错误
    await expect(handleWebhook(
      { challenge: 'test' },
      mockConfig,
      registry,
      { timestamp, nonce, signature, rawBody }
    )).resolves.toBeDefined()
  })

  it('should reject invalid signature', async () => {
    const registry = new EventHandlerRegistry()

    await expect(handleWebhook(
      { challenge: 'test' },
      mockConfig,
      registry,
      { 
        timestamp: '123', 
        nonce: 'abc', 
        signature: 'invalid', 
        rawBody: '{}' 
      }
    )).rejects.toThrow('Invalid signature')
  })
})
