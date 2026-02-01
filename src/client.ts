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

// ==================== 下载 API ====================

/**
 * 将飞书 SDK 返回的响应转换为 Buffer
 */
async function responseToBuffer(response: any): Promise<Buffer | null> {
  // 如果已经是 Buffer
  if (Buffer.isBuffer(response)) {
    return response;
  }

  // 如果是 ArrayBuffer
  if (response instanceof ArrayBuffer) {
    return Buffer.from(response);
  }

  // 飞书 SDK 返回的对象带有 getReadableStream 方法
  if (response && typeof response.getReadableStream === "function") {
    const stream = response.getReadableStream();
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });
    return Buffer.concat(chunks);
  }

  // 如果是 Node.js Stream
  if (response && typeof response.pipe === "function") {
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      response.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      response.on("end", () => resolve());
      response.on("error", reject);
    });
    return Buffer.concat(chunks);
  }

  return null;
}

/**
 * 通过 image_key 下载图片
 */
export async function downloadImageByKey(
  account: ResolvedFeishuAccount,
  imageKey: string
): Promise<ApiResult<{ buffer: Buffer; mimeType: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.image.get({
      path: { image_key: imageKey },
    });

    const buffer = await responseToBuffer(result);
    if (buffer) {
      return {
        ok: true,
        data: {
          buffer,
          mimeType: "image/png",
        },
      };
    }

    return { ok: false, error: "Unexpected response format" };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 下载文件（通过消息 ID 和 file_key）
 */
export async function downloadMessageFile(
  account: ResolvedFeishuAccount,
  messageId: string,
  fileKey: string
): Promise<ApiResult<{ buffer: Buffer; fileName?: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.messageResource.get({
      path: {
        message_id: messageId,
        file_key: fileKey,
      },
      params: {
        type: "file",
      },
    });

    const buffer = await responseToBuffer(result);
    if (buffer) {
      return {
        ok: true,
        data: { buffer },
      };
    }

    return { ok: false, error: "Unexpected response format" };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 智能发送 ====================

import { markdownToPost, hasMarkdown, type PostContent } from "./markdown.js";

/**
 * 发送 Post 格式消息（直接传 PostContent）
 */
export async function sendPost(
  account: ResolvedFeishuAccount,
  chatId: string,
  postContent: PostContent
): Promise<ApiResult<{ messageId: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.message.create({
      params: { receive_id_type: "chat_id" },
      data: {
        receive_id: chatId,
        msg_type: "post",
        content: JSON.stringify(postContent),
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
 * 智能发送消息
 * - 检测 Markdown 格式，自动转换为 Post 富文本
 * - 普通文本直接发送
 */
export async function sendSmartMessage(
  account: ResolvedFeishuAccount,
  chatId: string,
  text: string,
  options?: { forceRichText?: boolean }
): Promise<ApiResult<{ messageId: string }>> {
  // 检测是否需要富文本
  const useRichText = options?.forceRichText || hasMarkdown(text);

  if (useRichText) {
    const postContent = markdownToPost(text);
    return sendPost(account, chatId, postContent);
  }

  return sendTextMessage(account, chatId, text);
}
