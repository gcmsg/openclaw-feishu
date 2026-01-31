import { describe, it, expect } from 'vitest'
import { FeishuConfigSchema } from '../../../src/infrastructure/feishu/config.js'

describe('FeishuConfig', () => {
  it('should validate required fields', () => {
    expect(() => FeishuConfigSchema.parse({})).toThrow()
    
    expect(() => FeishuConfigSchema.parse({
      appId: 'cli_xxx',
    })).toThrow()
  })

  it('should accept valid config', () => {
    const config = FeishuConfigSchema.parse({
      appId: 'cli_xxx',
      appSecret: 'secret_xxx',
    })

    expect(config.appId).toBe('cli_xxx')
    expect(config.appSecret).toBe('secret_xxx')
    expect(config.baseUrl).toBe('https://open.feishu.cn/open-apis')
    expect(config.timeout).toBe(30000)
    expect(config.debug).toBe(false)
  })

  it('should accept optional fields', () => {
    const config = FeishuConfigSchema.parse({
      appId: 'cli_xxx',
      appSecret: 'secret_xxx',
      encryptKey: 'encrypt_key',
      debug: true,
    })

    expect(config.encryptKey).toBe('encrypt_key')
    expect(config.debug).toBe(true)
  })
})
