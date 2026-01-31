/**
 * 飞书 API 客户端
 */

import * as lark from "@larksuiteoapi/node-sdk";
import * as fs from "fs";
import * as path from "path";
import type { ResolvedFeishuAccount, ApiResult } from "./types.js";

// 客户端缓存
const clientCache = new Map<string, lark.Client>();

/**
 * 获取或创建飞书客户端
 */
export function getFeishuClient(account: ResolvedFeishuAccount): lark.Client {
  const cacheKey = account.appId;

  let client = clientCache.get(cacheKey);
  if (!client) {
    client = new lark.Client({
      appId: account.appId,
      appSecret: account.appSecret,
    });
    clientCache.set(cacheKey, client);
  }

  return client;
}

// ==================== 消息 API ====================

/**
 * 发送文本消息
 */
export async function sendTextMessage(
  account: ResolvedFeishuAccount,
  chatId: string,
  text: string
): Promise<ApiResult<{ messageId: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.message.create({
      params: { receive_id_type: "chat_id" },
      data: {
        receive_id: chatId,
        msg_type: "text",
        content: JSON.stringify({ text }),
      },
    });

    if (result.code === 0) {
      return { ok: true, data: { messageId: result.data?.message_id || "" } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 发送富文本消息
 */
export async function sendPostMessage(
  account: ResolvedFeishuAccount,
  chatId: string,
  title: string,
  content: any[][]
): Promise<ApiResult<{ messageId: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.message.create({
      params: { receive_id_type: "chat_id" },
      data: {
        receive_id: chatId,
        msg_type: "post",
        content: JSON.stringify({ zh_cn: { title, content } }),
      },
    });

    if (result.code === 0) {
      return { ok: true, data: { messageId: result.data?.message_id || "" } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 发送卡片消息
 */
export async function sendCardMessage(
  account: ResolvedFeishuAccount,
  chatId: string,
  card: Record<string, any>
): Promise<ApiResult<{ messageId: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.message.create({
      params: { receive_id_type: "chat_id" },
      data: {
        receive_id: chatId,
        msg_type: "interactive",
        content: JSON.stringify(card),
      },
    });

    if (result.code === 0) {
      return { ok: true, data: { messageId: result.data?.message_id || "" } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 发送图片消息
 */
export async function sendImageMessage(
  account: ResolvedFeishuAccount,
  chatId: string,
  imagePath: string
): Promise<ApiResult<{ messageId: string }>> {
  const client = getFeishuClient(account);

  try {
    // 上传图片
    const imageBuffer = fs.readFileSync(imagePath);
    const uploadResult = await client.im.v1.image.create({
      data: {
        image_type: "message",
        image: new Blob([imageBuffer]),
      },
    });

    if (uploadResult.code !== 0) {
      return { ok: false, error: uploadResult.msg };
    }

    const imageKey = uploadResult.data?.image_key;
    if (!imageKey) {
      return { ok: false, error: "Failed to get image key" };
    }

    // 发送图片消息
    const result = await client.im.v1.message.create({
      params: { receive_id_type: "chat_id" },
      data: {
        receive_id: chatId,
        msg_type: "image",
        content: JSON.stringify({ image_key: imageKey }),
      },
    });

    if (result.code === 0) {
      return { ok: true, data: { messageId: result.data?.message_id || "" } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 发送文件消息
 */
export async function sendFileMessage(
  account: ResolvedFeishuAccount,
  chatId: string,
  filePath: string,
  fileName?: string
): Promise<ApiResult<{ messageId: string }>> {
  const client = getFeishuClient(account);

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const actualFileName = fileName || path.basename(filePath);

    // 上传文件
    const uploadResult = await client.im.v1.file.create({
      data: {
        file_type: "stream",
        file_name: actualFileName,
        file: new Blob([fileBuffer]),
      },
    });

    if (uploadResult.code !== 0) {
      return { ok: false, error: uploadResult.msg };
    }

    const fileKey = uploadResult.data?.file_key;
    if (!fileKey) {
      return { ok: false, error: "Failed to get file key" };
    }

    // 发送文件消息
    const result = await client.im.v1.message.create({
      params: { receive_id_type: "chat_id" },
      data: {
        receive_id: chatId,
        msg_type: "file",
        content: JSON.stringify({ file_key: fileKey }),
      },
    });

    if (result.code === 0) {
      return { ok: true, data: { messageId: result.data?.message_id || "" } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 回复消息
 */
export async function replyMessage(
  account: ResolvedFeishuAccount,
  messageId: string,
  text: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.message.reply({
      path: { message_id: messageId },
      data: {
        msg_type: "text",
        content: JSON.stringify({ text }),
      },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 撤回消息
 */
export async function recallMessage(
  account: ResolvedFeishuAccount,
  messageId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.message.delete({
      path: { message_id: messageId },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
