import { z } from 'zod'

/**
 * 飞书配置 Schema
 */
export const FeishuConfigSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  appSecret: z.string().min(1, 'App Secret is required'),
  
  // 可选配置
  encryptKey: z.string().optional(),       // 事件加密密钥
  verificationToken: z.string().optional(), // 事件验证 Token
  
  // API 配置
  baseUrl: z.string().default('https://open.feishu.cn/open-apis'),
  timeout: z.number().default(30000),
  
  // 调试
  debug: z.boolean().default(false),
})

export type FeishuConfig = z.infer<typeof FeishuConfigSchema>

/**
 * 从环境变量加载配置
 */
export function loadConfigFromEnv(): FeishuConfig {
  return FeishuConfigSchema.parse({
    appId: process.env.FEISHU_APP_ID,
    appSecret: process.env.FEISHU_APP_SECRET,
    encryptKey: process.env.FEISHU_ENCRYPT_KEY,
    verificationToken: process.env.FEISHU_VERIFICATION_TOKEN,
    baseUrl: process.env.FEISHU_BASE_URL,
    timeout: process.env.FEISHU_TIMEOUT ? parseInt(process.env.FEISHU_TIMEOUT) : undefined,
    debug: process.env.FEISHU_DEBUG === 'true',
  })
}
