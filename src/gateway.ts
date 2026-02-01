/**
 * 飞书长连接网关
 */

import * as lark from "@larksuiteoapi/node-sdk";
import type { ResolvedFeishuAccount, FeishuMessage, FeishuMention } from "./types.js";

// WebSocket 客户端缓存
const wsClientCache = new Map<string, lark.WSClient>();

// 消息去重缓存
const processedMessages = new Map<string, number>();
const MESSAGE_DEDUPE_TTL_MS = 60 * 1000;
const MESSAGE_EXPIRE_TTL_MS = 30 * 60 * 1000;

function cleanupDedupeCache(): void {
  const now = Date.now();
  for (const [messageId, timestamp] of processedMessages) {
    if (now - timestamp > MESSAGE_DEDUPE_TTL_MS) {
      processedMessages.delete(messageId);
    }
  }
}

function isDuplicateMessage(messageId: string): boolean {
  if (processedMessages.has(messageId)) {
    return true;
  }
  processedMessages.set(messageId, Date.now());
  if (processedMessages.size > 100) {
    cleanupDedupeCache();
  }
  return false;
}

function isMessageExpired(createTimeMs: string | undefined): boolean {
  if (!createTimeMs) return false;
  const createTime = parseInt(createTimeMs, 10);
  if (isNaN(createTime)) return false;
  return Date.now() - createTime > MESSAGE_EXPIRE_TTL_MS;
}

export interface GatewayOptions {
  account: ResolvedFeishuAccount;
  onMessage: (message: FeishuMessage) => Promise<void>;
  abortSignal?: AbortSignal;
  logger?: {
    info: (msg: string) => void;
    error: (msg: string) => void;
  };
}

/**
 * 启动飞书长连接网关
 */
export function startGateway(options: GatewayOptions): lark.WSClient {
  const { account, onMessage, abortSignal, logger } = options;
  const cacheKey = account.accountId;

  // 如果已存在，先停止
  const existing = wsClientCache.get(cacheKey);
  if (existing) {
    stopGateway(cacheKey);
  }

  const wsClient = new lark.WSClient({
    appId: account.appId,
    appSecret: account.appSecret,
    loggerLevel: lark.LoggerLevel.error,
  });

  if (abortSignal) {
    abortSignal.addEventListener("abort", () => {
      logger?.info("received abort signal, stopping gateway");
      stopGateway(cacheKey);
    }, { once: true });
  }

  wsClient.start({
    eventDispatcher: new lark.EventDispatcher({}).register({
      "im.message.receive_v1": async (data) => {
        const message = data.message;
        if (!message) return {};

        const messageId = message.message_id || "";
        const createTime = message.create_time;

        if (isDuplicateMessage(messageId)) {
          return {};
        }

        if (isMessageExpired(createTime)) {
          logger?.info(`Skipping expired message, create_time: ${createTime}`);
          return {};
        }

        // 解析 mentions
        let mentions: FeishuMention[] = [];
        if (message.mentions) {
          mentions = message.mentions.map((m: any) => ({
            key: m.key,
            id: m.id,
            name: m.name,
          }));
        }

        const feishuMessage: FeishuMessage = {
          messageId,
          chatId: message.chat_id || "",
          chatType: message.chat_type === "p2p" ? "p2p" : "group",
          senderId: data.sender?.sender_id?.open_id || "",
          messageType: message.message_type || "",
          content: message.content || "",
          mentions,
          createTime: createTime ? parseInt(createTime, 10) : undefined,
        };

        // 解析消息内容
        try {
          const parsed = JSON.parse(feishuMessage.content);

          if (feishuMessage.messageType === "text") {
            // 文本消息
            feishuMessage.text = parsed.text;
          } else if (feishuMessage.messageType === "image") {
            // 图片消息
            feishuMessage.imageKey = parsed.image_key;
          } else if (feishuMessage.messageType === "file") {
            // 文件消息
            feishuMessage.fileKey = parsed.file_key;
            feishuMessage.fileName = parsed.file_name;
          } else if (feishuMessage.messageType === "audio") {
            // 语音消息
            feishuMessage.fileKey = parsed.file_key;
          } else if (feishuMessage.messageType === "media") {
            // 视频消息
            feishuMessage.imageKey = parsed.image_key; // 封面
            feishuMessage.fileKey = parsed.file_key;   // 视频
            feishuMessage.fileName = parsed.file_name;
          } else if (feishuMessage.messageType === "sticker") {
            // 表情包
            feishuMessage.fileKey = parsed.file_key;
          }
        } catch {
          // ignore parse errors
        }

        // 异步处理
        setImmediate(async () => {
          try {
            await onMessage(feishuMessage);
          } catch (error) {
            logger?.error(`Error handling message: ${error}`);
          }
        });

        return {};
      },
    }),
  });

  logger?.info(`logged in to feishu as ${account.appId}`);

  wsClientCache.set(cacheKey, wsClient);
  return wsClient;
}

/**
 * 停止网关
 */
export function stopGateway(accountId: string): void {
  const wsClient = wsClientCache.get(accountId);
  if (wsClient) {
    try {
      const client = wsClient as unknown as Record<string, unknown>;
      if (typeof client.close === "function") {
        (client.close as () => void)();
      } else if (typeof client.stop === "function") {
        (client.stop as () => void)();
      }
    } catch {
      // ignore
    }
    wsClientCache.delete(accountId);
  }
}
