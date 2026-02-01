/**
 * Clawdbot Plugin SDK 类型声明
 */

declare module "clawdbot/plugin-sdk" {
  export interface ClawdbotConfig {
    [key: string]: unknown;
  }

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
    getStatus: (ctx: { cfg: ClawdbotConfig }) => Promise<{
      channel: string;
      configured: boolean;
      statusLines: string[];
      selectionHint?: string;
    }>;
    configure: (ctx: {
      cfg: ClawdbotConfig;
      prompter: {
        note: (text: string, title?: string) => Promise<void>;
        confirm: (opts: { message: string; initialValue?: boolean }) => Promise<boolean>;
        text: (opts: { message: string; validate?: (v: string) => string | undefined }) => Promise<string>;
      };
    }) => Promise<{ cfg: ClawdbotConfig; accountId?: string }>;
    disable: (cfg: ClawdbotConfig) => ClawdbotConfig;
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
      listAccountIds: (cfg: ClawdbotConfig) => string[];
      resolveAccount: (cfg: ClawdbotConfig, accountId: string) => TAccount | undefined;
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
        cfg: ClawdbotConfig;
        abortSignal?: AbortSignal;
      }) => Promise<void>;
    };
  }

  export interface ChannelRuntime {
    channel: {
      reply: {
        dispatchReplyWithBufferedBlockDispatcher: (opts: {
          ctx: unknown;
          cfg: ClawdbotConfig;
          dispatcherOptions: {
            deliver: (payload: { text?: string; mediaUrls?: string[] }) => Promise<void>;
          };
        }) => Promise<void>;
      };
    };
  }

  export function getRuntime(): ChannelRuntime;
}
