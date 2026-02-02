/**
 * OpenClaw Plugin SDK 类型声明
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
        note: (text: string, title?: string) => Promise<void>;
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

  export interface ChannelPlugin<TAccount = unknown> {
    id: string;
    meta: ChannelPluginMeta;
    capabilities: ChannelCapabilities;
    onboarding?: ChannelOnboardingAdapter;
    actions?: ChannelMessageActionAdapter;
    config: {
      listAccountIds: (cfg: OpenClawConfig) => string[];
      resolveAccount: (cfg: OpenClawConfig, accountId: string) => TAccount | undefined;
      isConfigured: (account: TAccount) => Promise<boolean>;
    };
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
