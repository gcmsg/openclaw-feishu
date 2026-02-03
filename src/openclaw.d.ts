/**
 * OpenClaw Plugin SDK 类型声明
 * 与 OpenClaw 源码 types.adapters.ts 保持一致
 */

declare module "openclaw/plugin-sdk" {
  export interface OpenClawConfig {
    [key: string]: unknown;
  }

  // Alias for compatibility
  export type ClawdbotConfig = OpenClawConfig;

  export interface ChannelPluginMeta {
    id: string;
    label: string;
    selectionLabel?: string;
    docsPath?: string;
    blurb?: string;
  }

  export interface ChannelCapabilities {
    chatTypes: ("direct" | "group")[];
    reactions?: boolean;
    reply?: boolean;
    media?: boolean;
  }

  export interface ChannelOnboardingAdapter {
    channel: string;
    getStatus: (ctx: { cfg: OpenClawConfig }) => Promise<{
      channel: string;
      configured: boolean;
      statusLines: string[];
      selectionHint?: string;
    }>;
    configure: (ctx: {
      cfg: OpenClawConfig;
      prompter: {
        note: (text: string | string[], title?: string) => Promise<void>;
        confirm: (opts: { message: string; initialValue?: boolean }) => Promise<boolean>;
        text: (opts: {
          message: string;
          validate?: (v: string) => string | undefined;
        }) => Promise<string>;
      };
    }) => Promise<{ cfg: OpenClawConfig; accountId?: string }>;
    disable: (cfg: OpenClawConfig) => OpenClawConfig;
  }

  export interface ChannelMessageActionAdapter {
    listActions: () => Array<{
      action: string;
      description: string;
      params: string[];
    }>;
    extractToolSend: (ctx: any) => { to: string; text: string };
    handleAction: (ctx: any) => Promise<{ ok: boolean; data?: unknown; error?: string }>;
  }

  /**
   * Channel Config Adapter
   * 与 OpenClaw ChannelConfigAdapter 类型匹配
   */
  export interface ChannelConfigAdapter<TAccount = unknown> {
    listAccountIds: (cfg: OpenClawConfig) => string[];
    /** 
     * 注意：OpenClaw 期望此函数始终返回 TAccount（非 undefined）
     * 如果 accountId 无效，应返回一个默认/空账号或抛出错误
     */
    resolveAccount: (cfg: OpenClawConfig, accountId?: string | null) => TAccount;
    defaultAccountId?: (cfg: OpenClawConfig) => string;
    isEnabled?: (account: TAccount, cfg: OpenClawConfig) => boolean;
    disabledReason?: (account: TAccount, cfg: OpenClawConfig) => string;
    /**
     * 检查账号是否已配置
     * @param account 已解析的账号
     * @param cfg 完整配置（OpenClaw 会传入此参数）
     */
    isConfigured?: (account: TAccount, cfg: OpenClawConfig) => boolean | Promise<boolean>;
    unconfiguredReason?: (account: TAccount, cfg: OpenClawConfig) => string;
  }

  export interface ChannelPlugin<TAccount = unknown> {
    id: string;
    meta: ChannelPluginMeta;
    capabilities: ChannelCapabilities;
    onboarding?: ChannelOnboardingAdapter;
    actions?: ChannelMessageActionAdapter;
    config: ChannelConfigAdapter<TAccount>;
    outbound: {
      deliveryMode: "gateway" | "webhook";
      textChunkLimit?: number;
      sendText: (ctx: {
        account: TAccount;
        to: string;
        text: string;
      }) => Promise<{ ok: boolean; error?: Error }>;
      sendMedia?: (ctx: {
        account: TAccount;
        to: string;
        text?: string;
        mediaUrl?: string;
      }) => Promise<{ ok: boolean; error?: Error }>;
    };
    gateway?: {
      startAccount: (ctx: {
        account: TAccount;
        cfg: OpenClawConfig;
        abortSignal?: AbortSignal;
      }) => Promise<void>;
    };
  }

  export interface ChannelRuntime {
    channel: {
      reply: {
        dispatchReplyWithBufferedBlockDispatcher: (opts: {
          ctx: unknown;
          cfg: OpenClawConfig;
          dispatcherOptions: {
            deliver: (payload: { text?: string; mediaUrls?: string[] }) => Promise<void>;
          };
        }) => Promise<void>;
      };
    };
  }

  export function getRuntime(): ChannelRuntime;
}
