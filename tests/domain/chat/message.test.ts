import { describe, it, expect } from 'vitest'
import { createTextMessage } from '../../../src/domain/chat/entities/message.js'

describe('Message', () => {
  describe('createTextMessage', () => {
    it('should create a text message', () => {
      const msg = createTextMessage('chat_123', 'user_456', 'Hello World')

      expect(msg).toEqual({
        chatId: 'chat_123',
        senderId: 'user_456',
        type: 'text',
        content: {
          type: 'text',
          text: 'Hello World',
        },
      })
    })
  })
})
