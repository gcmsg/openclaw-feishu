/**
 * 飞书长连接网关
 */

import * as lark from "@larksuiteoapi/node-sdk";
import type { ResolvedFeishuAccount, FeishuMessage, FeishuMention } from "./types.js";
import { getMessage } from "./client.js";

/** 卡片交互回调数据 */
export interface CardActionData {
  openId: string;        // 点击者 open_id
  openMessageId: string; // 卡片消息 ID
  chatId?: string;       // 所在会话 ID（通过 action.context 传递）
  cmd: string;           // 按钮绑定的命令，如 "/status"
  rawValue: Record<string, any>;
}

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
  onCardAction?: (action: CardActionData) => Promise<Record<string, any> | void>;
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
    abortSignal.addEventListener(
      "abort",
      () => {
        logger?.info("received abort signal, stopping gateway");
        stopGateway(cacheKey);
      },
      { once: true }
    );
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

        // 提取引用消息 ID
        const parentId = message.parent_id || message.root_id || undefined;

        const feishuMessage: FeishuMessage = {
          messageId,
          chatId: message.chat_id || "",
          chatType: message.chat_type === "p2p" ? "p2p" : "group",
          senderId: data.sender?.sender_id?.open_id || "",
          messageType: message.message_type || "",
          content: message.content || "",
          mentions,
          createTime: createTime ? parseInt(createTime, 10) : undefined,
          parentId,
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
            feishuMessage.audioDuration = parsed.duration;
            // 飞书可能提供语音识别结果（需要应用有 speech_to_text 权限）
            if (parsed.recognition) {
              feishuMessage.audioRecognition = parsed.recognition;
            }
          } else if (feishuMessage.messageType === "video") {
            // 视频消息 - 优先使用 file_key（视频文件），image_key 是缩略图
            feishuMessage.fileKey = parsed.file_key; // 视频文件（优先）
            feishuMessage.imageKey = parsed.image_key; // 缩略图
            feishuMessage.fileName = parsed.file_name;
          } else if (feishuMessage.messageType === "sticker") {
            // 表情包
            feishuMessage.fileKey = parsed.file_key;
          }
        } catch {
          // ignore parse errors
        }

        // 获取引用消息内容
        if (parentId) {
          try {
            const quotedResult = await getMessage(account, parentId);
            if (quotedResult.ok && quotedResult.data) {
              feishuMessage.quotedText = quotedResult.data.text || "[无法解析引用内容]";
              logger?.info(`引用消息内容: ${feishuMessage.quotedText.slice(0, 50)}...`);
            }
          } catch (err) {
            logger?.error(`获取引用消息失败: ${err}`);
          }
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

  // Monkey-patch handleEventData 以支持 card 类型消息回调
  // Lark SDK 默认只处理 event 类型，card 类型（卡片按钮点击）被丢弃
  if (options.onCardAction) {
    patchCardActionHandler(wsClient, options.onCardAction, logger);
  }

  logger?.info(`logged in to feishu as ${account.appId}`);

  wsClientCache.set(cacheKey, wsClient);
  return wsClient;
}

/**
 * 为 WSClient 注入 card 类型消息处理器
 * Lark SDK 的 handleEventData 只处理 event 类型，card 类型被过滤掉。
 * 这里通过 monkey-patch 拦截 card 类型并调用 onCardAction 回调。
 */
function patchCardActionHandler(
  wsClient: lark.WSClient,
  onCardAction: (action: CardActionData) => Promise<Record<string, any> | void>,
  logger?: { info: (msg: string) => void; error: (msg: string) => void }
): void {
  const client = wsClient as unknown as Record<string, any>;
  const originalHandleEventData = client.handleEventData?.bind(client);

  if (typeof originalHandleEventData !== "function") {
    logger?.error("[feishu-menu] 无法 patch handleEventData，方法不存在");
    return;
  }

  client.handleEventData = async function (data: any) {
    // 提取消息 header
    const headers: Record<string, string> = {};
    if (Array.isArray(data.headers)) {
      for (const h of data.headers) {
        if (h.key) headers[h.key] = h.value;
      }
    }

    const msgType = headers["type"] || headers["message-type"] || "";

    if (msgType === "card") {
      // 处理卡片回调
      try {
        const payloadStr = new TextDecoder("utf-8").decode(data.payload);
        const cardData = JSON.parse(payloadStr);
        logger?.info(`[feishu-menu] 收到卡片回调: ${JSON.stringify(cardData).slice(0, 200)}`);

        const openId: string = cardData.open_id || cardData.operator?.open_id || "";
        const openMessageId: string = cardData.open_message_id || "";
        const actionValue: Record<string, any> = cardData.action?.value || {};
        const cmd: string = actionValue.cmd || "";
        const chatId: string = actionValue.chat_id || cardData.context?.open_chat_id || "";

        if (!cmd) {
          logger?.info("[feishu-menu] 卡片回调无 cmd 字段，忽略");
          return;
        }

        const result = await onCardAction({
          openId,
          openMessageId,
          chatId,
          cmd,
          rawValue: actionValue,
        });

        // 回传响应（toast 或 card 更新）
        if (result) {
          const respPayload = {
            code: 0,
            data: Buffer.from(JSON.stringify(result)).toString("base64"),
          };
          client.sendMessage?.({
            ...data,
            payload: new TextEncoder().encode(JSON.stringify(respPayload)),
          });
        }
      } catch (err) {
        logger?.error(`[feishu-menu] 处理卡片回调失败: ${err}`);
      }
      return;
    }

    // 其他类型交给原始处理器
    return originalHandleEventData(data);
  };

  logger?.info("[feishu-menu] 已注入卡片回调处理器");
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
