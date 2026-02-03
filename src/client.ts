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
    // 上传图片 - 使用 ReadStream（Node.js 环境兼容性更好）
    const uploadResult = await client.im.v1.image.create({
      data: {
        image_type: "message",
        image: fs.createReadStream(imagePath),
      },
    });

    // 新版 SDK 直接返回数据对象或 null
    const imageKey = uploadResult?.image_key;
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

    if (result?.code === 0) {
      return { ok: true, data: { messageId: result.data?.message_id || "" } };
    }
    return { ok: false, error: result?.msg || "Failed to send image message" };
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
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return { ok: false, error: `File not found: ${filePath}` };
    }
    const actualFileName = fileName || path.basename(filePath);

    // 上传文件 - 使用 ReadStream（Node.js 环境兼容性更好）
    const uploadResult = await client.im.v1.file.create({
      data: {
        file_type: "stream",
        file_name: actualFileName,
        file: fs.createReadStream(filePath),
      },
    });

    // 新版 SDK 直接返回数据对象或 null
    const fileKey = uploadResult?.file_key;
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

    if (result?.code === 0) {
      return { ok: true, data: { messageId: result.data?.message_id || "" } };
    }
    return { ok: false, error: result?.msg || "Failed to send file message" };
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
): Promise<ApiResult<{ messageId: string }>> {
  const client = getFeishuClient(account);

  // 智能检测：纯文本用 text，其他用卡片
  const usePlainText = !hasMarkdown(text);

  try {
    let result;
    if (usePlainText) {
      result = await client.im.v1.message.reply({
        path: { message_id: messageId },
        data: {
          msg_type: "text",
          content: JSON.stringify({ text }),
        },
      });
    } else {
      // 使用卡片消息（表格自动转 column_set）
      const card = buildFeishuCard(text);
      result = await client.im.v1.message.reply({
        path: { message_id: messageId },
        data: {
          msg_type: "interactive",
          content: JSON.stringify(card),
        },
      });
    }

    if (result.code === 0) {
      return { ok: true, data: { messageId: result.data?.message_id || "" } };
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

/**
 * 获取单条消息内容
 */
export async function getMessage(
  account: ResolvedFeishuAccount,
  messageId: string
): Promise<ApiResult<{ messageType: string; content: string; text?: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.message.get({
      path: { message_id: messageId },
    });

    if (result.code === 0 && result.data?.items?.[0]) {
      const msg = result.data.items[0];
      const messageType = msg.msg_type || "";
      const content = msg.body?.content || "";

      // 尝试提取文本内容
      let text: string | undefined;
      try {
        const parsed = JSON.parse(content);
        if (messageType === "text") {
          text = parsed.text;
        } else if (messageType === "post") {
          // 富文本消息，提取纯文本
          const extractText = (node: any): string => {
            if (typeof node === "string") return node;
            if (node.text) return node.text;
            if (Array.isArray(node)) return node.map(extractText).join("");
            if (node.content) return extractText(node.content);
            if (node.zh_cn?.content) return extractText(node.zh_cn.content);
            return "";
          };
          text = extractText(parsed);
        } else if (messageType === "image") {
          text = "[图片]";
        } else if (messageType === "file") {
          text = `[文件: ${parsed.file_name || "未知文件"}]`;
        } else if (messageType === "audio") {
          text = "[语音]";
        } else if (messageType === "video") {
          text = "[视频]";
        } else if (messageType === "sticker") {
          text = "[表情]";
        } else if (messageType === "interactive") {
          text = "[卡片消息]";
        } else if (messageType === "share_card") {
          text = "[分享卡片]";
        } else if (messageType === "share_user") {
          text = "[分享用户]";
        } else if (messageType === "share_chat") {
          text = "[分享群组]";
        } else if (messageType === "system") {
          text = "[系统消息]";
        } else if (messageType === "location") {
          text = "[位置]";
        } else if (messageType === "media") {
          text = "[媒体]";
        } else {
          text = `[${messageType || "未知类型"}消息]`;
        }
      } catch {
        // JSON 解析失败时，根据消息类型返回描述
        if (messageType === "image") {
          text = "[图片]";
        } else if (messageType) {
          text = `[${messageType}消息]`;
        }
      }

      return {
        ok: true,
        data: { messageType, content, text },
      };
    }
    return { ok: false, error: result.msg || "Message not found" };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 转发消息
 */
export async function forwardMessage(
  account: ResolvedFeishuAccount,
  messageId: string,
  targetChatId: string
): Promise<ApiResult<{ messageId: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.message.forward({
      path: { message_id: messageId },
      params: { receive_id_type: "chat_id" },
      data: {
        receive_id: targetChatId,
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: { messageId: result.data?.message_id || "" },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 合并转发多条消息
 */
export async function mergeForwardMessages(
  account: ResolvedFeishuAccount,
  messageIds: string[],
  targetChatId: string
): Promise<ApiResult<{ messageId: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.message.mergeForward({
      params: { receive_id_type: "chat_id" },
      data: {
        receive_id: targetChatId,
        message_id_list: messageIds,
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: { messageId: result.data?.message?.message_id || "" },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 发送加急消息 (应用内)
 */
export async function sendUrgentMessage(
  account: ResolvedFeishuAccount,
  messageId: string,
  userIds: string[]
): Promise<ApiResult<{ invalidUserIds?: string[] }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.message.urgentApp({
      path: { message_id: messageId },
      params: { user_id_type: "open_id" },
      data: {
        user_id_list: userIds,
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: { invalidUserIds: result.data?.invalid_user_id_list },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取消息已读用户列表
 */
export async function getMessageReadUsers(
  account: ResolvedFeishuAccount,
  messageId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ users: Array<{ userId: string; readTime: number }>; pageToken?: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.message.readUsers({
      path: { message_id: messageId },
      params: {
        user_id_type: "open_id",
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const users = (result.data?.items || []).map((u: any) => ({
        userId: u.user_id,
        readTime: parseInt(u.timestamp, 10) || 0,
      }));
      return {
        ok: true,
        data: {
          users,
          pageToken: result.data?.page_token,
        },
      };
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
 * 下载消息中的图片（通过消息 ID 和 image_key）
 * 注意：用户发送的图片必须通过 messageResource API 下载，不能用 image API
 */
export async function downloadMessageImage(
  account: ResolvedFeishuAccount,
  messageId: string,
  imageKey: string
): Promise<ApiResult<{ buffer: Buffer; mimeType: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.messageResource.get({
      path: {
        message_id: messageId,
        file_key: imageKey,
      },
      params: {
        type: "image",
      },
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

import { hasMarkdown, type PostContent } from "./markdown.js";

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
 * 检测是否为纯文本（只包含文字和标点符号）
 */
/**
 * 解析 markdown 表格为行列数据
 */
function parseMarkdownTable(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = text.trim().split("\n");
  const tableLines: string[] = [];

  for (const line of lines) {
    if (/^\|.+\|$/.test(line.trim())) {
      tableLines.push(line.trim());
    }
  }

  if (tableLines.length < 2) return null;

  // 解析表头
  const headerLine = tableLines[0];
  const headers = headerLine
    .split("|")
    .filter((cell) => cell.trim())
    .map((cell) => cell.trim());

  // 跳过分隔线，解析数据行
  const rows: string[][] = [];
  for (let i = 2; i < tableLines.length; i++) {
    const cells = tableLines[i]
      .split("|")
      .filter((cell) => cell.trim() !== "")
      .map((cell) => cell.trim());
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return { headers, rows };
}

/**
 * 构建飞书卡片（支持表格转 column_set）
 */
function buildFeishuCard(text: string): Record<string, any> {
  const elements: any[] = [];

  // 检测是否包含表格
  const tableMatch = text.match(/(\|.+\|\n)+/);
  if (tableMatch) {
    const tableText = tableMatch[0];
    const tableData = parseMarkdownTable(tableText);

    if (tableData && tableData.headers.length > 0) {
      // 表格前的内容
      const beforeTable = text.slice(0, text.indexOf(tableText)).trim();
      if (beforeTable) {
        elements.push({
          tag: "div",
          text: { tag: "lark_md", content: beforeTable },
        });
      }

      // 表头行（灰色背景）
      elements.push({
        tag: "column_set",
        flex_mode: "none",
        background_style: "grey",
        columns: tableData.headers.map((header) => ({
          tag: "column",
          width: "weighted",
          weight: 1,
          elements: [{ tag: "div", text: { tag: "lark_md", content: `**${header}**` } }],
        })),
      });

      // 数据行
      for (const row of tableData.rows) {
        elements.push({
          tag: "column_set",
          flex_mode: "none",
          columns: row.map((cell) => ({
            tag: "column",
            width: "weighted",
            weight: 1,
            elements: [{ tag: "div", text: { tag: "lark_md", content: cell } }],
          })),
        });
      }

      // 表格后的内容
      const afterTable = text.slice(text.indexOf(tableText) + tableText.length).trim();
      if (afterTable) {
        elements.push({
          tag: "div",
          text: { tag: "lark_md", content: afterTable },
        });
      }
    }
  }

  // 如果没有表格或解析失败，直接用 lark_md
  if (elements.length === 0) {
    elements.push({
      tag: "div",
      text: { tag: "lark_md", content: text },
    });
  }

  return {
    config: { wide_screen_mode: true },
    header: {
      template: "blue",
      title: { tag: "plain_text", content: "📝" },
    },
    elements,
  };
}

/**
 * 智能发送消息
 * - 纯文字+标点 → text 消息
 * - 其他所有格式（Markdown）→ 飞书卡片（表格自动转 column_set）
 */
export async function sendSmartMessage(
  account: ResolvedFeishuAccount,
  chatId: string,
  text: string,
  options?: { forceText?: boolean; forceCard?: boolean }
): Promise<ApiResult<{ messageId: string }>> {
  // 强制使用指定格式
  if (options?.forceText) {
    return sendTextMessage(account, chatId, text);
  }

  if (options?.forceCard) {
    const card = buildFeishuCard(text);
    return sendCardMessage(account, chatId, card);
  }

  // 智能检测：纯文本用 text，其他用卡片
  if (!hasMarkdown(text)) {
    return sendTextMessage(account, chatId, text);
  }

  // 使用卡片消息
  const card = buildFeishuCard(text);
  return sendCardMessage(account, chatId, card);
}
