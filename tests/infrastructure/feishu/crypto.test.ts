import { describe, it, expect } from 'vitest'
import { createCipheriv, createHash, randomBytes } from 'crypto'
import { decrypt, verifySignature, verifyToken } from '../../../src/infrastructure/feishu/crypto.js'

/**
 * 模拟飞书加密 (用于测试)
 */
function encrypt(plaintext: string, encryptKey: string): string {
  const key = createHash('sha256').update(encryptKey).digest()
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8')
  encrypted = Buffer.concat([encrypted, cipher.final()])
  
  // iv + encrypted_data
  return Buffer.concat([iv, encrypted]).toString('base64')
}

describe('Feishu Crypto', () => {
  describe('decrypt', () => {
    it('should decrypt encrypted content', () => {
      const encryptKey = 'test_encrypt_key_12345'
      const plaintext = JSON.stringify({
        schema: '2.0',
        header: { event_type: 'test' },
        event: { foo: 'bar' }
      })

      // 加密
      const encrypted = encrypt(plaintext, encryptKey)

      // 解密
      const decrypted = decrypt(encrypted, encryptKey)
      expect(decrypted).toBe(plaintext)
    })

    it('should handle JSON content', () => {
      const encryptKey = 'my_secret_key'
      const event = {
        schema: '2.0',
        header: {
          event_id: 'evt_123',
          event_type: 'im.message.receive_v1',
        },
        event: {
          message: {
            message_id: 'msg_456',
            content: '{"text":"Hello"}',
          }
        }
      }

      const encrypted = encrypt(JSON.stringify(event), encryptKey)
      const decrypted = decrypt(encrypted, encryptKey)
      
      expect(JSON.parse(decrypted)).toEqual(event)
    })

    it('should throw on wrong key', () => {
      const encryptKey = 'correct_key'
      const wrongKey = 'wrong_key'
      const plaintext = 'secret message'

      const encrypted = encrypt(plaintext, encryptKey)

      expect(() => decrypt(encrypted, wrongKey)).toThrow()
    })
  })

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const timestamp = '1234567890'
      const nonce = 'abc123'
      const encryptKey = 'my_encrypt_key'
      const body = '{"encrypt":"xxx"}'

      // 计算正确的签名
      const content = timestamp + nonce + encryptKey + body
      const signature = createHash('sha256').update(content).digest('hex')

      expect(verifySignature(timestamp, nonce, encryptKey, body, signature)).toBe(true)
    })

    it('should reject invalid signature', () => {
      const timestamp = '1234567890'
      const nonce = 'abc123'
      const encryptKey = 'my_encrypt_key'
      const body = '{"encrypt":"xxx"}'
      const wrongSignature = 'invalid_signature_hash'

      expect(verifySignature(timestamp, nonce, encryptKey, body, wrongSignature)).toBe(false)
    })

    it('should reject tampered body', () => {
      const timestamp = '1234567890'
      const nonce = 'abc123'
      const encryptKey = 'my_encrypt_key'
      const body = '{"encrypt":"xxx"}'
      const tamperedBody = '{"encrypt":"yyy"}'

      const content = timestamp + nonce + encryptKey + body
      const signature = createHash('sha256').update(content).digest('hex')

      expect(verifySignature(timestamp, nonce, encryptKey, tamperedBody, signature)).toBe(false)
    })
  })

  describe('verifyToken', () => {
    it('should verify matching token', () => {
      expect(verifyToken('abc123', 'abc123')).toBe(true)
    })

    it('should reject mismatched token', () => {
      expect(verifyToken('abc123', 'xyz789')).toBe(false)
    })
  })
})
