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
 * 解析 markdown 表格
 */
function parseMarkdownTable(tableText: string): { headers: string[]; rows: string[][] } | null {
  const lines = tableText.trim().split("\n");
  if (lines.length < 2) return null;

  // 第一行是表头
  const headers = lines[0]
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c);

  // 第二行是分隔线，跳过
  // 剩余行是数据
  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i]
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c);
    if (cells.length > 0) rows.push(cells);
  }

  return headers.length > 0 ? { headers, rows } : null;
}

/**
 * 将表格转换为 column_set 布局（带分隔线）
 */
function tableToColumnSet(table: { headers: string[]; rows: string[][] }): any[] {
  const elements: any[] = [];

  // 表头行（灰色背景）
  elements.push({
    tag: "column_set",
    flex_mode: "none",
    background_style: "grey",
    columns: table.headers.map((h) => ({
      tag: "column",
      width: "weighted",
      weight: 1,
      elements: [{ tag: "div", text: { tag: "lark_md", content: `**${h}**` } }],
    })),
  });

  // 表头下方分隔线
  elements.push({ tag: "hr" });

  // 数据行（奇偶行不同背景）
  for (let i = 0; i < table.rows.length; i++) {
    const row = table.rows[i];
    elements.push({
      tag: "column_set",
      flex_mode: "none",
      background_style: i % 2 === 1 ? "grey" : "default",
      columns: row.map((cell) => ({
        tag: "column",
        width: "weighted",
        weight: 1,
        elements: [{ tag: "div", text: { tag: "lark_md", content: cell } }],
      })),
    });
  }

  // 表格底部分隔线
  elements.push({ tag: "hr" });

  return elements;
}

/**
 * 代码块占位符（用于先提取代码块，后续单独渲染）
 */
const CODE_BLOCK_PLACEHOLDER = "___CODE_BLOCK_PLACEHOLDER___";

/**
 * 提取代码块，返回处理后的文本和代码块数组
 */
function extractCodeBlocks(text: string): { text: string; codeBlocks: string[] } {
  const codeBlocks: string[] = [];
  const processed = text.replace(/```([\w]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const trimmed = code.trim();
    const langLabel = lang ? `📄 ${lang.toUpperCase()}` : "📄 CODE";
    codeBlocks.push(`${langLabel}\n${trimmed}`);
    return `\n${CODE_BLOCK_PLACEHOLDER}_${codeBlocks.length - 1}\n`;
  });
  return { text: processed, codeBlocks };
}

/**
 * 预处理 Markdown：将飞书不支持的语法转换为支持的格式
 * 飞书 lark_md 支持：**加粗** *斜体* ~~删除线~~ [链接](url)
 * 不支持：# 标题、``` 代码块、` 行内代码、> 引用、- 列表
 */
function preprocessMarkdown(text: string): string {
  let result = text;

  // 1. 行内代码 `code` → 「code」（用中文引号标记）
  result = result.replace(/`([^`]+)`/g, "「$1」");

  // 2. 标题 ## xxx → **xxx**（加粗 + 换行分隔）
  result = result.replace(/^#{1,6}\s+(.+)$/gm, "\n**$1**\n");

  // 3. 引用 > text → 💬 text
  result = result.replace(/^>\s*(.+)$/gm, "💬 $1");

  // 4. 无序列表 - item → • item
  result = result.replace(/^[-*]\s+(.+)$/gm, "• $1");

  // 5. 有序列表保持不变（1. 2. 3. 本身可读）

  // 6. 分隔线 --- 或 *** → ─────────────
  result = result.replace(/^[-*]{3,}$/gm, "─────────────");

  // 7. 清理多余空行（最多保留两个）
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

/**
 * 构建代码块元素（灰色背景）
 */
function buildCodeBlockElement(code: string): any {
  return {
    tag: "column_set",
    flex_mode: "none",
    background_style: "grey",
    columns: [
      {
        tag: "column",
        width: "weighted",
        weight: 1,
        elements: [
          {
            tag: "div",
            text: { tag: "plain_text", content: code },
          },
        ],
      },
    ],
  };
}

/**
 * 构建飞书卡片（大模型输出的 markdown 表格自动转 column_set）
 */
function buildFeishuCard(text: string): Record<string, any> {
  // 1. 先提取代码块
  const { text: textWithoutCode, codeBlocks } = extractCodeBlocks(text);
  
  const elements: any[] = [];

  // 2. 处理文本中的代码块占位符、表格和普通文本
  const processTextSegment = (segment: string) => {
    // 检查是否包含代码块占位符
    const placeholderRegex = new RegExp(`${CODE_BLOCK_PLACEHOLDER}_(\\d+)`, "g");
    let lastIdx = 0;
    let placeholderMatch;
    
    while ((placeholderMatch = placeholderRegex.exec(segment)) !== null) {
      // 占位符前的文本
      const beforePlaceholder = segment.slice(lastIdx, placeholderMatch.index).trim();
      if (beforePlaceholder) {
        const processed = preprocessMarkdown(beforePlaceholder);
        elements.push({ tag: "div", text: { tag: "lark_md", content: processed } });
      }
      
      // 代码块
      const codeIndex = parseInt(placeholderMatch[1], 10);
      if (codeBlocks[codeIndex]) {
        elements.push(buildCodeBlockElement(codeBlocks[codeIndex]));
      }
      
      lastIdx = placeholderMatch.index + placeholderMatch[0].length;
    }
    
    // 占位符后的文本
    const afterPlaceholder = segment.slice(lastIdx).trim();
    if (afterPlaceholder) {
      const processed = preprocessMarkdown(afterPlaceholder);
      elements.push({ tag: "div", text: { tag: "lark_md", content: processed } });
    }
  };

  // 3. 匹配 markdown 表格：连续多行以 | 开头和结尾
  const tableRegex = /(?:^\|.+\|$\n?)+/gm;
  let lastIndex = 0;
  let match;

  while ((match = tableRegex.exec(textWithoutCode)) !== null) {
    // 表格前的文本
    const before = textWithoutCode.slice(lastIndex, match.index).trim();
    if (before) {
      processTextSegment(before);
    }

    // 解析并转换表格
    const table = parseMarkdownTable(match[0]);
    if (table && table.headers.length > 0) {
      elements.push(...tableToColumnSet(table));
    } else {
      // 解析失败，原样保留
      elements.push({ tag: "div", text: { tag: "lark_md", content: match[0] } });
    }

    lastIndex = match.index + match[0].length;
  }

  // 4. 表格后的文本
  const after = textWithoutCode.slice(lastIndex).trim();
  if (after) {
    processTextSegment(after);
  }

  // 5. 如果没有匹配到任何内容，处理整个文本
  if (elements.length === 0) {
    processTextSegment(textWithoutCode);
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
  const hasMd = hasMarkdown(text);
  const fs = await import("fs");
  fs.appendFileSync("/tmp/feishu_debug.log", `[${new Date().toISOString()}] sendSmartMessage hasMd=${hasMd}, len=${text.length}, preview=${text.slice(0, 80).replace(/\n/g, "\\n")}\n`);

  // 强制使用指定格式
  if (options?.forceText) {
    console.info("[sendSmartMessage] -> forceText");
    return sendTextMessage(account, chatId, text);
  }

  if (options?.forceCard) {
    console.info("[sendSmartMessage] -> forceCard");
    const card = buildFeishuCard(text);
    return sendCardMessage(account, chatId, card);
  }

  // 智能检测：纯文本用 text，其他用卡片
  if (!hasMd) {
    console.info("[sendSmartMessage] -> text (no markdown)");
    return sendTextMessage(account, chatId, text);
  }

  // 使用卡片消息
  console.info("[sendSmartMessage] -> card (has markdown)");
  const card = buildFeishuCard(text);
  console.info("[sendSmartMessage] card elements:", card.elements?.length);
  return sendCardMessage(account, chatId, card);
}
