import { createDecipheriv, createHash } from 'crypto'

/**
 * 飞书事件解密
 * 
 * 飞书使用 AES-256-CBC 加密，密钥由 encryptKey SHA256 后取前 32 字节
 * 加密内容格式: base64(iv + encrypted_data)
 * iv: 前 16 字节
 * encrypted_data: 剩余字节
 */
export function decrypt(encrypted: string, encryptKey: string): string {
  // 计算 AES 密钥: SHA256(encryptKey) 取前 32 字节
  const key = createHash('sha256').update(encryptKey).digest()

  // Base64 解码
  const encryptedBuffer = Buffer.from(encrypted, 'base64')

  // 提取 IV (前 16 字节) 和密文
  const iv = encryptedBuffer.subarray(0, 16)
  const ciphertext = encryptedBuffer.subarray(16)

  // AES-256-CBC 解密
  const decipher = createDecipheriv('aes-256-cbc', key, iv)
  
  let decrypted = decipher.update(ciphertext)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}

/**
 * 验证事件签名 (v2 schema)
 * 
 * signature = sha256(timestamp + nonce + encryptKey + body)
 */
export function verifySignature(
  timestamp: string,
  nonce: string,
  encryptKey: string,
  body: string,
  signature: string
): boolean {
  const content = timestamp + nonce + encryptKey + body
  const hash = createHash('sha256').update(content).digest('hex')
  return hash === signature
}

/**
 * 验证 v1 schema token
 */
export function verifyToken(token: string, verificationToken: string): boolean {
  return token === verificationToken
}
