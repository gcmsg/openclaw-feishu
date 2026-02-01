/**
 * 飞书插件类型定义
 */

/**
 * 飞书通道配置
 */
export interface FeishuChannelConfig {
  /** 是否启用 */
  enabled?: boolean;
  /** 飞书应用 App ID */
  appId: string;
  /** 飞书应用 App Secret */
  appSecret: string;
  /** DM 策略 */
  dmPolicy?: "open" | "pairing" | "allowlist";
  /** 允许的用户列表 */
  allowFrom?: string[];
  /** 群组配置 */
  groups?: Record<string, { requireMention?: boolean }>;
}

/**
 * 解析后的飞书账号
 */
export interface ResolvedFeishuAccount {
  accountId: string;
  appId: string;
  appSecret: string;
  config: FeishuChannelConfig;
}

/**
 * 飞书消息
 */
export interface FeishuMessage {
  messageId: string;
  chatId: string;
  chatType: "p2p" | "group";
  senderId: string;
  senderName?: string;
  messageType: string;
  content: string;
  text?: string;
  /** 图片消息的 image_key */
  imageKey?: string;
  /** 文件消息的 file_key */
  fileKey?: string;
  /** 文件名（文件消息） */
  fileName?: string;
  /** 语音识别结果（语音消息） */
  audioRecognition?: string;
  /** 语音时长（毫秒） */
  audioDuration?: number;
  mentions?: FeishuMention[];
  createTime?: number;
  /** 被引用消息的 ID */
  parentId?: string;
  /** 被引用消息的文本内容 */
  quotedText?: string;
}

/**
 * 飞书 @ 提及
 */
export interface FeishuMention {
  key: string;
  id: {
    open_id: string;
    user_id?: string;
    union_id?: string;
  };
  name: string;
}

/**
 * 消息上下文
 */
export interface MsgContext {
  From: string;
  Body: string;
  AccountId: string;
  Provider: string;
  Surface: string;
  SessionKey: string;
  To: string;
  ChatType: "direct" | "group";
  MessageId?: string;
  ReplyToId?: string;
  SenderName?: string;
  Mentions?: string[];
  MediaUrls?: string[];
}

/**
 * 文档信息
 */
export interface DocumentInfo {
  documentId: string;
  title: string;
  url: string;
  ownerId?: string;
}

/**
 * 文档块类型
 */
export type BlockType =
  | "page"
  | "text"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "heading5"
  | "heading6"
  | "heading7"
  | "heading8"
  | "heading9"
  | "bullet"
  | "ordered"
  | "todo"
  | "code"
  | "quote"
  | "divider"
  | "image"
  | "table"
  | "tableCell"
  | "grid"
  | "gridColumn";

/**
 * 文档块
 */
export interface DocumentBlock {
  /** 块 ID（读取时返回） */
  blockId?: string;
  /** 块类型 */
  blockType: BlockType;
  /** 文本内容 */
  text?: string;
  /** 待办事项是否完成 */
  checked?: boolean;
  /** 代码块语言 */
  language?: string;
  /** 图片 token */
  imageToken?: string;
  /** 图片宽度 */
  imageWidth?: number;
  /** 图片高度 */
  imageHeight?: number;
  /** 子块（用于表格、Grid 等） */
  children?: DocumentBlock[];
  /** 父块 ID */
  parentId?: string;
}

/**
 * 解析后的文档结构
 */
export interface ParsedDocument {
  /** 文档 ID */
  documentId: string;
  /** 文档标题 */
  title: string;
  /** 文档 URL */
  url: string;
  /** 文档块列表 */
  blocks: DocumentBlock[];
  /** 纯文本内容 */
  plainText?: string;
}

/**
 * 文件信息
 */
export interface FileInfo {
  token: string;
  name: string;
  type: string;
  url?: string;
  parentToken?: string;
  size?: number;
  createdTime?: number;
  modifiedTime?: number;
}

/**
 * 文件夹信息
 */
export interface FolderInfo {
  token: string;
  name: string;
  url?: string;
  parentToken?: string;
}

/**
 * API 结果
 */
export interface ApiResult<T = void> {
  ok: boolean;
  data?: T;
  error?: string;
}
