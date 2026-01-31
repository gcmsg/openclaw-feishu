import { describe, it, expect } from 'vitest'
import { sleep, retry, generateId, safeJsonParse } from '../../src/shared/utils/index.js'

describe('utils', () => {
  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now()
      await sleep(50)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(45)
    })
  })

  describe('retry', () => {
    it('should retry on failure', async () => {
      let attempts = 0
      const fn = async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('fail')
        }
        return 'success'
      }

      const result = await retry(fn, { maxAttempts: 3, delayMs: 10 })
      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('should throw after max attempts', async () => {
      const fn = async () => {
        throw new Error('always fail')
      }

      await expect(retry(fn, { maxAttempts: 2, delayMs: 10 }))
        .rejects.toThrow('always fail')
    })
  })

  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
    })
  })

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 })
    })

    it('should return fallback for invalid JSON', () => {
      expect(safeJsonParse('invalid', { default: true })).toEqual({ default: true })
    })
  })
})
