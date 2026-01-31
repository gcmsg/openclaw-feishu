/**
 * OpenClaw Feishu Plugin
 * 
 * 飞书机器人控制插件，支持：
 * - 聊天：发送/接收消息、管理群组
 * - 云文档：创建/编辑/读取文档
 * - 云空间：文件/文件夹管理
 */

// 主插件
export { OpenClawFeishuPlugin, createPlugin } from './plugin.js'

// 配置
export { FeishuConfigSchema, loadConfigFromEnv } from './infrastructure/feishu/config.js'
export type { FeishuConfig } from './infrastructure/feishu/config.js'

// 领域模型
export * from './domain/index.js'

// 基础设施（高级用法）
export { FeishuClient } from './infrastructure/feishu/client.js'
export { FeishuAuth } from './infrastructure/feishu/auth.js'
export { MessageApi } from './infrastructure/feishu/api/message-api.js'
export { ChatApi } from './infrastructure/feishu/api/chat-api.js'
export { DocumentApi } from './infrastructure/feishu/api/document-api.js'
export { SpaceApi } from './infrastructure/feishu/api/space-api.js'

// 事件处理
export * from './interfaces/webhook/event-handler.js'

// 共享类型
export * from './shared/index.js'
