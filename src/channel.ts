/**
 * 飞书通道插件定义
 */

import type {
  ChannelPlugin,
  ClawdbotConfig,
  ChannelOnboardingAdapter,
  ChannelMessageActionAdapter,
} from "./compat.js";
import type { ResolvedFeishuAccount, FeishuChannelConfig, MsgContext } from "./types.js";
import {
  sendTextMessage,
  sendImageMessage,
  sendFileMessage,
  sendCardMessage,
  downloadImageByKey,
  downloadMessageFile,
  sendSmartMessage,
} from "./client.js";
import {
  createDocument,
  getDocument,
  getDocumentContent,
  getDocumentStructure,
  getBlock,
  updateBlock,
  deleteBlock,
  deleteBlocks,
  insertBlocksAfter,
  prependDocumentBlocks,
  appendText,
  appendMarkdown,
  appendDocumentBlocks,
} from "./document.js";
import { createFolder, listFiles, uploadFile, downloadFile, searchFiles } from "./space.js";
import {
  createBitableApp,
  getBitableApp,
  listBitableTables,
  createBitableTable,
  listBitableFields,
  createBitableField,
  listBitableRecords,
  searchBitableRecords,
  getBitableRecord,
  createBitableRecord,
  createBitableRecords,
  updateBitableRecord,
  deleteBitableRecord,
  deleteBitableRecords,
} from "./bitable.js";
import {
  createSpreadsheet,
  getSpreadsheet,
  listSheets,
  getSheet,
  readRange,
  writeRange,
  appendRows,
  batchReadRanges,
  batchWriteRanges,
  insertRows,
  deleteRows,
  insertColumns,
  deleteColumns,
} from "./sheets.js";
import { startGateway } from "./gateway.js";
import { getFeishuRuntime } from "./runtime.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const DEFAULT_ACCOUNT_ID = "default";

/**
 * 保存媒体到临时文件
 */
async function saveMediaToTemp(
  buffer: Buffer,
  ext: string,
  prefix: string = "feishu"
): Promise<string> {
  const tempDir = os.tmpdir();
  const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = path.join(tempDir, fileName);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
}
const CHANNEL_ID = "feishu" as const;

function getFeishuConfig(cfg: ClawdbotConfig): FeishuChannelConfig | undefined {
  return (cfg as any).channels?.feishu as FeishuChannelConfig | undefined;
}

function listFeishuAccountIds(cfg: ClawdbotConfig): string[] {
  const feishuCfg = getFeishuConfig(cfg);
  if (!feishuCfg || feishuCfg.enabled === false) return [];
  if (!feishuCfg.appId || !feishuCfg.appSecret) return [];
  return [DEFAULT_ACCOUNT_ID];
}

function resolveFeishuAccount(
  cfg: ClawdbotConfig,
  accountId: string
): ResolvedFeishuAccount | undefined {
  if (accountId !== DEFAULT_ACCOUNT_ID) return undefined;
  const feishuCfg = getFeishuConfig(cfg);
  if (!feishuCfg) return undefined;

  return {
    accountId: DEFAULT_ACCOUNT_ID,
    appId: feishuCfg.appId,
    appSecret: feishuCfg.appSecret,
    config: feishuCfg,
  };
}

// ========== Onboarding Adapter ==========

const feishuOnboardingAdapter: ChannelOnboardingAdapter = {
  channel: CHANNEL_ID,

  getStatus: async ({ cfg }) => {
    const feishuCfg = getFeishuConfig(cfg);
    const configured = !!(feishuCfg?.appId && feishuCfg?.appSecret);
    return {
      channel: CHANNEL_ID,
      configured,
      statusLines: [`Feishu: ${configured ? "configured ✓" : "needs App ID & Secret"}`],
      selectionHint: configured ? "configured" : "needs credentials",
    };
  },

  configure: async (ctx) => {
    const { cfg, prompter } = ctx;
    let next = cfg;
    const currentCfg = getFeishuConfig(cfg);
    const hasAppId = !!currentCfg?.appId;
    const hasAppSecret = !!currentCfg?.appSecret;

    await prompter.note(
      [
        "📖 飞书 Plus 插件配置",
        "",
        "1) 登录飞书开放平台 → 创建企业自建应用",
        "2) 获取 App ID 和 App Secret",
        "3) 启用机器人能力 → 消息接收方式选「使用长连接接收消息」",
        "4) 添加权限：im:message, im:chat, docx:document, drive:drive",
        "5) 发布应用并授权",
        "",
        "Docs: https://open.feishu.cn/document",
      ].join("\n"),
      "配置向导"
    );

    let appId: string | null = null;
    let appSecret: string | null = null;

    if (hasAppId) {
      const keep = await prompter.confirm({
        message: `App ID 已配置 (${currentCfg!.appId.slice(0, 8)}...)，是否保留？`,
        initialValue: true,
      });
      if (!keep) {
        appId = String(
          await prompter.text({
            message: "请输入飞书 App ID",
            validate: (v) => (v?.trim() ? undefined : "必填"),
          })
        ).trim();
      }
    } else {
      appId = String(
        await prompter.text({
          message: "请输入飞书 App ID",
          validate: (v) => (v?.trim() ? undefined : "必填"),
        })
      ).trim();
    }

    if (hasAppSecret) {
      const keep = await prompter.confirm({
        message: "App Secret 已配置，是否保留？",
        initialValue: true,
      });
      if (!keep) {
        appSecret = String(
          await prompter.text({
            message: "请输入飞书 App Secret",
            validate: (v) => (v?.trim() ? undefined : "必填"),
          })
        ).trim();
      }
    } else {
      appSecret = String(
        await prompter.text({
          message: "请输入飞书 App Secret",
          validate: (v) => (v?.trim() ? undefined : "必填"),
        })
      ).trim();
    }

    next = {
      ...next,
      channels: {
        ...(next as any).channels,
        feishu: {
          ...(next as any).channels?.feishu,
          enabled: true,
          ...(appId ? { appId } : {}),
          ...(appSecret ? { appSecret } : {}),
        },
      },
    } as ClawdbotConfig;

    return { cfg: next, accountId: DEFAULT_ACCOUNT_ID };
  },

  disable: (cfg) =>
    ({
      ...cfg,
      channels: {
        ...(cfg as any).channels,
        feishu: { ...(cfg as any).channels?.feishu, enabled: false },
      },
    }) as ClawdbotConfig,
};

// ========== Message Actions ==========

const feishuMessageActions: ChannelMessageActionAdapter = {
  listActions: () => [
    // 消息
    { action: "send", description: "发送消息", params: ["target", "message"] },
    { action: "send_card", description: "发送卡片消息", params: ["target", "card"] },
    { action: "send_image", description: "发送图片", params: ["target", "filePath"] },
    { action: "send_file", description: "发送文件", params: ["target", "filePath"] },
    // 文档 - 基础
    { action: "doc_create", description: "创建云文档", params: ["title", "folderId?"] },
    { action: "doc_get", description: "获取文档信息", params: ["documentId"] },
    { action: "doc_read", description: "读取文档纯文本", params: ["documentId"] },
    { action: "doc_structure", description: "获取文档结构（块列表）", params: ["documentId"] },
    // 文档 - 内容操作
    { action: "doc_append", description: "追加文本到文档末尾", params: ["documentId", "content"] },
    { action: "doc_append_md", description: "追加 Markdown 到文档", params: ["documentId", "markdown"] },
    { action: "doc_prepend", description: "在文档开头插入内容", params: ["documentId", "content"] },
    { action: "doc_insert_after", description: "在指定块后插入内容", params: ["documentId", "blockId", "content"] },
    // 文档 - 块操作
    { action: "doc_block_get", description: "获取指定块内容", params: ["documentId", "blockId"] },
    { action: "doc_block_update", description: "更新块内容", params: ["documentId", "blockId", "text", "checked?"] },
    { action: "doc_block_delete", description: "删除指定块", params: ["documentId", "blockId"] },
    { action: "doc_blocks_delete", description: "批量删除块", params: ["documentId", "blockIds"] },
    // 云空间
    { action: "folder_create", description: "创建文件夹", params: ["name", "parentToken?"] },
    { action: "folder_list", description: "列出文件夹内容", params: ["folderToken"] },
    { action: "file_upload", description: "上传文件", params: ["filePath", "folderToken"] },
    { action: "file_download", description: "下载文件", params: ["fileToken", "savePath"] },
    { action: "file_search", description: "搜索文件", params: ["query"] },
    // 多维表格 - 应用
    { action: "bitable_create", description: "创建多维表格", params: ["name", "folderId?"] },
    { action: "bitable_get", description: "获取多维表格信息", params: ["appToken"] },
    { action: "bitable_tables", description: "列出数据表", params: ["appToken"] },
    { action: "bitable_table_create", description: "创建数据表", params: ["appToken", "name"] },
    // 多维表格 - 字段
    { action: "bitable_fields", description: "列出字段", params: ["appToken", "tableId"] },
    { action: "bitable_field_create", description: "创建字段", params: ["appToken", "tableId", "fieldName", "fieldType"] },
    // 多维表格 - 记录
    { action: "bitable_records", description: "查询记录", params: ["appToken", "tableId", "pageSize?"] },
    { action: "bitable_record_get", description: "获取单条记录", params: ["appToken", "tableId", "recordId"] },
    { action: "bitable_record_create", description: "创建记录", params: ["appToken", "tableId", "fields"] },
    { action: "bitable_record_update", description: "更新记录", params: ["appToken", "tableId", "recordId", "fields"] },
    { action: "bitable_record_delete", description: "删除记录", params: ["appToken", "tableId", "recordId"] },
    { action: "bitable_records_delete", description: "批量删除记录", params: ["appToken", "tableId", "recordIds"] },
    // 电子表格 - 基础
    { action: "sheet_create", description: "创建电子表格", params: ["title", "folderId?"] },
    { action: "sheet_get", description: "获取电子表格信息", params: ["spreadsheetToken"] },
    { action: "sheet_list", description: "列出工作表", params: ["spreadsheetToken"] },
    { action: "sheet_info", description: "获取工作表信息", params: ["spreadsheetToken", "sheetId"] },
    // 电子表格 - 读写
    { action: "sheet_read", description: "读取单元格", params: ["spreadsheetToken", "range"] },
    { action: "sheet_write", description: "写入单元格", params: ["spreadsheetToken", "range", "values"] },
    { action: "sheet_append", description: "追加行数据", params: ["spreadsheetToken", "range", "values"] },
    // 电子表格 - 行列操作
    { action: "sheet_insert_rows", description: "插入行", params: ["spreadsheetToken", "sheetId", "startIndex", "count"] },
    { action: "sheet_delete_rows", description: "删除行", params: ["spreadsheetToken", "sheetId", "startIndex", "count"] },
    { action: "sheet_insert_cols", description: "插入列", params: ["spreadsheetToken", "sheetId", "startIndex", "count"] },
    { action: "sheet_delete_cols", description: "删除列", params: ["spreadsheetToken", "sheetId", "startIndex", "count"] },
  ],

  extractToolSend: (ctx) => ({
    to: ctx.target,
    text: ctx.message,
  }),

  handleAction: async (ctx) => {
    const account = ctx.account as ResolvedFeishuAccount;
    if (!account?.appId) {
      return { ok: false, error: "Account not configured" };
    }

    const { action } = ctx;

    switch (action) {
      case "send":
        return sendTextMessage(account, ctx.target, ctx.message);

      case "send_card":
        try {
          const card = typeof ctx.card === "string" ? JSON.parse(ctx.card) : ctx.card;
          return sendCardMessage(account, ctx.target, card);
        } catch (e) {
          return { ok: false, error: `Invalid card JSON: ${e}` };
        }

      case "send_image":
        return sendImageMessage(account, ctx.target, ctx.filePath);

      case "send_file":
        return sendFileMessage(account, ctx.target, ctx.filePath, ctx.fileName);

      case "doc_create":
        return createDocument(account, ctx.title, ctx.folderId);

      case "doc_get":
        return getDocument(account, ctx.documentId);

      case "doc_read":
        return getDocumentContent(account, ctx.documentId);

      case "doc_structure":
        return getDocumentStructure(account, ctx.documentId);

      case "doc_append":
        return appendText(account, ctx.documentId, ctx.content);

      case "doc_append_md":
        return appendMarkdown(account, ctx.documentId, ctx.markdown);

      case "doc_prepend": {
        const lines = (ctx.content || "").split("\n");
        const blocks = lines.map((line: string) => ({
          blockType: "text" as const,
          text: line || " ",
        }));
        return prependDocumentBlocks(account, ctx.documentId, blocks);
      }

      case "doc_insert_after": {
        const lines = (ctx.content || "").split("\n");
        const blocks = lines.map((line: string) => ({
          blockType: "text" as const,
          text: line || " ",
        }));
        return insertBlocksAfter(account, ctx.documentId, ctx.blockId, blocks);
      }

      case "doc_block_get":
        return getBlock(account, ctx.documentId, ctx.blockId);

      case "doc_block_update":
        return updateBlock(account, ctx.documentId, ctx.blockId, {
          text: ctx.text,
          checked: ctx.checked,
        });

      case "doc_block_delete":
        return deleteBlock(account, ctx.documentId, ctx.blockId);

      case "doc_blocks_delete": {
        const blockIds = Array.isArray(ctx.blockIds)
          ? ctx.blockIds
          : (ctx.blockIds || "").split(",").map((id: string) => id.trim());
        return deleteBlocks(account, ctx.documentId, blockIds);
      }

      case "folder_create":
        return createFolder(account, ctx.name, ctx.parentToken);

      case "folder_list":
        return listFiles(account, ctx.folderToken);

      case "file_upload":
        return uploadFile(account, ctx.filePath, ctx.folderToken, ctx.fileName);

      case "file_download":
        return downloadFile(account, ctx.fileToken, ctx.savePath);

      case "file_search":
        return searchFiles(account, ctx.query);

      // 多维表格 - 应用
      case "bitable_create":
        return createBitableApp(account, ctx.name, ctx.folderId);

      case "bitable_get":
        return getBitableApp(account, ctx.appToken);

      case "bitable_tables":
        return listBitableTables(account, ctx.appToken);

      case "bitable_table_create":
        return createBitableTable(account, ctx.appToken, ctx.name);

      // 多维表格 - 字段
      case "bitable_fields":
        return listBitableFields(account, ctx.appToken, ctx.tableId);

      case "bitable_field_create":
        return createBitableField(
          account,
          ctx.appToken,
          ctx.tableId,
          ctx.fieldName,
          parseInt(ctx.fieldType, 10) || 1
        );

      // 多维表格 - 记录
      case "bitable_records":
        return listBitableRecords(account, ctx.appToken, ctx.tableId, {
          pageSize: ctx.pageSize ? parseInt(ctx.pageSize, 10) : undefined,
        });

      case "bitable_record_get":
        return getBitableRecord(account, ctx.appToken, ctx.tableId, ctx.recordId);

      case "bitable_record_create": {
        const fields = typeof ctx.fields === "string" ? JSON.parse(ctx.fields) : ctx.fields;
        return createBitableRecord(account, ctx.appToken, ctx.tableId, fields);
      }

      case "bitable_record_update": {
        const fields = typeof ctx.fields === "string" ? JSON.parse(ctx.fields) : ctx.fields;
        return updateBitableRecord(account, ctx.appToken, ctx.tableId, ctx.recordId, fields);
      }

      case "bitable_record_delete":
        return deleteBitableRecord(account, ctx.appToken, ctx.tableId, ctx.recordId);

      case "bitable_records_delete": {
        const recordIds = Array.isArray(ctx.recordIds)
          ? ctx.recordIds
          : (ctx.recordIds || "").split(",").map((id: string) => id.trim());
        return deleteBitableRecords(account, ctx.appToken, ctx.tableId, recordIds);
      }

      // 电子表格 - 基础
      case "sheet_create":
        return createSpreadsheet(account, ctx.title, ctx.folderId);

      case "sheet_get":
        return getSpreadsheet(account, ctx.spreadsheetToken);

      case "sheet_list":
        return listSheets(account, ctx.spreadsheetToken);

      case "sheet_info":
        return getSheet(account, ctx.spreadsheetToken, ctx.sheetId);

      // 电子表格 - 读写
      case "sheet_read":
        return readRange(account, ctx.spreadsheetToken, ctx.range);

      case "sheet_write": {
        const values = typeof ctx.values === "string" ? JSON.parse(ctx.values) : ctx.values;
        return writeRange(account, ctx.spreadsheetToken, ctx.range, values);
      }

      case "sheet_append": {
        const values = typeof ctx.values === "string" ? JSON.parse(ctx.values) : ctx.values;
        return appendRows(account, ctx.spreadsheetToken, ctx.range, values);
      }

      // 电子表格 - 行列操作
      case "sheet_insert_rows":
        return insertRows(
          account,
          ctx.spreadsheetToken,
          ctx.sheetId,
          parseInt(ctx.startIndex, 10) || 0,
          parseInt(ctx.count, 10) || 1
        );

      case "sheet_delete_rows":
        return deleteRows(
          account,
          ctx.spreadsheetToken,
          ctx.sheetId,
          parseInt(ctx.startIndex, 10) || 0,
          parseInt(ctx.count, 10) || 1
        );

      case "sheet_insert_cols":
        return insertColumns(
          account,
          ctx.spreadsheetToken,
          ctx.sheetId,
          parseInt(ctx.startIndex, 10) || 0,
          parseInt(ctx.count, 10) || 1
        );

      case "sheet_delete_cols":
        return deleteColumns(
          account,
          ctx.spreadsheetToken,
          ctx.sheetId,
          parseInt(ctx.startIndex, 10) || 0,
          parseInt(ctx.count, 10) || 1
        );

      default:
        return { ok: false, error: `Unknown action: ${action}` };
    }
  },
};

// ========== Channel Plugin ==========

export const feishuPlugin: ChannelPlugin<ResolvedFeishuAccount> = {
  id: "feishu",

  meta: {
    id: "feishu",
    label: "Feishu",
    selectionLabel: "飞书 (消息/文档/云空间)",
    docsPath: "https://github.com/gcmsg/openclaw-feishu",
    blurb: "飞书通道插件 - 支持消息、云文档、云空间操作",
  },

  capabilities: {
    chatTypes: ["direct", "group"],
    reactions: false,
    reply: true,
    media: true,
  },

  onboarding: feishuOnboardingAdapter,
  actions: feishuMessageActions,

  config: {
    listAccountIds: (cfg) => listFeishuAccountIds(cfg),
    resolveAccount: (cfg, accountId) => resolveFeishuAccount(cfg, accountId),
    isConfigured: async (account) => !!(account.appId && account.appSecret),
  },

  outbound: {
    deliveryMode: "gateway",
    textChunkLimit: 4000,

    sendText: async (ctx) => {
      const account = ctx.account as ResolvedFeishuAccount;
      const result = await sendTextMessage(account, ctx.to, ctx.text);
      return { ok: result.ok, error: result.error ? new Error(result.error) : undefined };
    },

    sendMedia: async (ctx) => {
      const account = ctx.account as ResolvedFeishuAccount;
      const mediaUrl = ctx.mediaUrl;

      if (mediaUrl && !mediaUrl.startsWith("http")) {
        const ext = mediaUrl.toLowerCase().split(".").pop();
        const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext || "");

        if (isImage) {
          const result = await sendImageMessage(account, ctx.to, mediaUrl);
          return { ok: result.ok, error: result.error ? new Error(result.error) : undefined };
        } else {
          const result = await sendFileMessage(account, ctx.to, mediaUrl);
          return { ok: result.ok, error: result.error ? new Error(result.error) : undefined };
        }
      }

      const text = ctx.text ? `${ctx.text}\n${mediaUrl}` : mediaUrl || "";
      const result = await sendTextMessage(account, ctx.to, text);
      return { ok: result.ok, error: result.error ? new Error(result.error) : undefined };
    },
  },

  gateway: {
    startAccount: async (ctx) => {
      const runtime = getFeishuRuntime();
      const account = ctx.account;
      const cfg = ctx.cfg;

      startGateway({
        account,
        abortSignal: ctx.abortSignal,
        onMessage: async (message) => {
          const logger = {
            info: (msg: string) => console.info(`[feishu-plus:${account.accountId}] ${msg}`),
            error: (msg: string) => console.error(`[feishu-plus:${account.accountId}] ${msg}`),
          };

          let bodyText = "";
          const mediaUrls: string[] = [];

          // 处理不同类型的消息
          switch (message.messageType) {
            case "text":
              bodyText = message.text || "";
              logger.info(`收到文本消息: ${bodyText}`);
              break;

            case "image":
              if (message.imageKey) {
                logger.info(`收到图片消息: ${message.imageKey}`);
                try {
                  const imgResult = await downloadImageByKey(account, message.imageKey);
                  if (imgResult.ok && imgResult.data) {
                    const filePath = await saveMediaToTemp(
                      imgResult.data.buffer,
                      "png",
                      "feishu_img"
                    );
                    mediaUrls.push(filePath);
                    bodyText = "[图片]";
                    logger.info(`图片已下载: ${filePath}`);
                  } else {
                    logger.error(`下载图片失败: ${imgResult.error}`);
                    bodyText = "[图片下载失败]";
                  }
                } catch (err) {
                  logger.error(`下载图片异常: ${err}`);
                  bodyText = "[图片]";
                }
              }
              break;

            case "file":
              if (message.fileKey) {
                const fileName = message.fileName || "file";
                logger.info(`收到文件消息: ${fileName}`);
                try {
                  const fileResult = await downloadMessageFile(
                    account,
                    message.messageId,
                    message.fileKey
                  );
                  if (fileResult.ok && fileResult.data) {
                    const ext = path.extname(fileName) || ".bin";
                    const filePath = await saveMediaToTemp(
                      fileResult.data.buffer,
                      ext.slice(1),
                      "feishu_file"
                    );
                    mediaUrls.push(filePath);
                    bodyText = `[文件: ${fileName}]`;
                    logger.info(`文件已下载: ${filePath}`);
                  } else {
                    logger.error(`下载文件失败: ${fileResult.error}`);
                    bodyText = `[文件: ${fileName}]`;
                  }
                } catch (err) {
                  logger.error(`下载文件异常: ${err}`);
                  bodyText = `[文件: ${fileName}]`;
                }
              }
              break;

            case "audio":
              if (message.audioRecognition) {
                // 飞书提供了语音转文字结果
                bodyText = message.audioRecognition;
                const durationSec = message.audioDuration
                  ? (message.audioDuration / 1000).toFixed(1)
                  : "?";
                logger.info(`收到语音消息 (${durationSec}s): ${bodyText.slice(0, 50)}...`);
              } else {
                // 没有转写结果，提示用户
                const durationSec = message.audioDuration
                  ? (message.audioDuration / 1000).toFixed(1)
                  : "?";
                bodyText = `[语音消息 ${durationSec}s - 无法识别，请开启语音识别权限]`;
                logger.info(`收到语音消息 (${durationSec}s)，无转写结果`);
              }
              break;

            case "media":
              bodyText = "[视频消息 - 暂不支持]";
              logger.info("收到视频消息（暂不支持）");
              break;

            case "sticker":
              bodyText = "[表情包]";
              logger.info("收到表情包消息");
              break;

            case "post":
              // 富文本消息，尝试提取纯文本
              try {
                const postContent = JSON.parse(message.content);
                const extractText = (node: any): string => {
                  if (typeof node === "string") return node;
                  if (node.text) return node.text;
                  if (Array.isArray(node)) return node.map(extractText).join("");
                  if (node.content) return extractText(node.content);
                  return "";
                };
                bodyText = extractText(postContent);
                logger.info(`收到富文本消息: ${bodyText.slice(0, 100)}...`);
              } catch {
                bodyText = "[富文本消息]";
              }
              break;

            case "share_card":
              bodyText = "[分享卡片]";
              logger.info("收到分享卡片消息");
              break;

            case "share_user":
              bodyText = "[用户名片]";
              logger.info("收到用户名片消息");
              break;

            default:
              bodyText = `[未知消息类型: ${message.messageType}]`;
              logger.info(`收到未知类型消息: ${message.messageType}`);
          }

          // 如果没有任何内容，跳过
          if (!bodyText && mediaUrls.length === 0) {
            return;
          }

          // 如果有引用消息，把引用内容加到正文前面
          if (message.quotedText) {
            bodyText = `[引用: ${message.quotedText}]\n\n${bodyText}`;
            logger.info(`包含引用消息: ${message.quotedText.slice(0, 50)}...`);
          }

          const msgCtx: MsgContext = {
            From: message.senderId,
            Body: bodyText,
            AccountId: account.accountId,
            Provider: "feishu",
            Surface: "feishu",
            SessionKey: `feishu:${account.accountId}:${message.chatId}`,
            To: message.chatId,
            ChatType: message.chatType === "p2p" ? "direct" : "group",
            MessageId: message.messageId,
            ReplyToId: message.parentId,
            Mentions: message.mentions?.map((m) => m.name),
            MediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
          };

          await runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher({
            ctx: msgCtx,
            cfg,
            dispatcherOptions: {
              deliver: async (payload) => {
                const text = payload.text ?? "";
                if (text) {
                  // 自动检测 Markdown，转换为飞书富文本
                  await sendSmartMessage(account, message.chatId, text);
                }
              },
            },
          });
        },
        logger: {
          info: (msg) => console.info(`[feishu:${account.accountId}] ${msg}`),
          error: (msg) => console.error(`[feishu:${account.accountId}] ${msg}`),
        },
      });
    },
  },
};
