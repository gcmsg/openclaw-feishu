/**
 * 飞书通道插件定义
 */

import type {
  ChannelPlugin,
  ClawdbotConfig,
  ChannelOnboardingAdapter,
  ChannelMessageActionAdapter,
} from "clawdbot/plugin-sdk";
import type { ResolvedFeishuAccount, FeishuChannelConfig, MsgContext } from "./types.js";
import { sendTextMessage, sendImageMessage, sendFileMessage, sendCardMessage } from "./client.js";
import { createDocument, getDocument, getDocumentContent, appendText, appendMarkdown } from "./document.js";
import { createFolder, listFiles, uploadFile, downloadFile, searchFiles } from "./space.js";
import { startGateway } from "./gateway.js";
import { getFeishuRuntime } from "./runtime.js";

const DEFAULT_ACCOUNT_ID = "default";
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
        appId = String(await prompter.text({
          message: "请输入飞书 App ID",
          validate: (v) => (v?.trim() ? undefined : "必填"),
        })).trim();
      }
    } else {
      appId = String(await prompter.text({
        message: "请输入飞书 App ID",
        validate: (v) => (v?.trim() ? undefined : "必填"),
      })).trim();
    }

    if (hasAppSecret) {
      const keep = await prompter.confirm({
        message: "App Secret 已配置，是否保留？",
        initialValue: true,
      });
      if (!keep) {
        appSecret = String(await prompter.text({
          message: "请输入飞书 App Secret",
          validate: (v) => (v?.trim() ? undefined : "必填"),
        })).trim();
      }
    } else {
      appSecret = String(await prompter.text({
        message: "请输入飞书 App Secret",
        validate: (v) => (v?.trim() ? undefined : "必填"),
      })).trim();
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

  disable: (cfg) => ({
    ...cfg,
    channels: {
      ...(cfg as any).channels,
      feishu: { ...(cfg as any).channels?.feishu, enabled: false },
    },
  } as ClawdbotConfig),
};

// ========== Message Actions ==========

const feishuMessageActions: ChannelMessageActionAdapter = {
  listActions: () => [
    { action: "send", description: "发送消息", params: ["target", "message"] },
    { action: "send_card", description: "发送卡片消息", params: ["target", "card"] },
    { action: "send_image", description: "发送图片", params: ["target", "filePath"] },
    { action: "send_file", description: "发送文件", params: ["target", "filePath"] },
    { action: "doc_create", description: "创建云文档", params: ["title", "folderId?"] },
    { action: "doc_get", description: "获取文档信息", params: ["documentId"] },
    { action: "doc_read", description: "读取文档内容", params: ["documentId"] },
    { action: "doc_append", description: "追加文本到文档", params: ["documentId", "content"] },
    { action: "doc_append_md", description: "追加 Markdown 到文档", params: ["documentId", "markdown"] },
    { action: "folder_create", description: "创建文件夹", params: ["name", "parentToken?"] },
    { action: "folder_list", description: "列出文件夹内容", params: ["folderToken"] },
    { action: "file_upload", description: "上传文件", params: ["filePath", "folderToken"] },
    { action: "file_download", description: "下载文件", params: ["fileToken", "savePath"] },
    { action: "file_search", description: "搜索文件", params: ["query"] },
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

      case "doc_append":
        return appendText(account, ctx.documentId, ctx.content);

      case "doc_append_md":
        return appendMarkdown(account, ctx.documentId, ctx.markdown);

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
          if (message.messageType !== "text" || !message.text) {
            return;
          }

          console.log(`[feishu:${account.accountId}] 收到消息: ${message.text}`);

          const msgCtx: MsgContext = {
            From: message.senderId,
            Body: message.text,
            AccountId: account.accountId,
            Provider: "feishu",
            Surface: "feishu",
            SessionKey: `feishu:${account.accountId}:${message.chatId}`,
            To: message.chatId,
            ChatType: message.chatType === "p2p" ? "direct" : "group",
            MessageId: message.messageId,
            Mentions: message.mentions?.map((m) => m.name),
          };

          await runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher({
            ctx: msgCtx,
            cfg,
            dispatcherOptions: {
              deliver: async (payload) => {
                const text = payload.text ?? "";
                if (text) {
                  await sendTextMessage(account, message.chatId, text);
                }
              },
            },
          });
        },
        logger: {
          info: (msg) => console.log(`[feishu:${account.accountId}] ${msg}`),
          error: (msg) => console.error(`[feishu:${account.accountId}] ${msg}`),
        },
      });
    },
  },
};
