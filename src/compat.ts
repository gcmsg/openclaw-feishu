/**
 * SDK 兼容层 - 支持 OpenClaw / Clawdbot / Moltbot
 */

// 类型定义（编译时使用，不影响运行时）
export interface ClawdbotPluginApi {
  runtime: PluginRuntime;
  registerChannel: (opts: { plugin: any }) => void;
}

export interface PluginRuntime {
  channel: {
    reply: {
      dispatchReplyWithBufferedBlockDispatcher: (opts: any) => Promise<void>;
    };
  };
}

export interface ClawdbotConfig {
  channels?: Record<string, any>;
  [key: string]: any;
}

export interface ChannelPlugin<T = any> {
  id: string;
  meta: {
    id: string;
    label: string;
    selectionLabel: string;
    docsPath: string;
    blurb: string;
  };
  capabilities: {
    chatTypes: string[];
    reactions: boolean;
    reply: boolean;
    media: boolean;
  };
  onboarding?: any;
  actions?: any;
  config: {
    listAccountIds: (cfg: ClawdbotConfig) => string[];
    resolveAccount: (cfg: ClawdbotConfig, accountId: string) => T | undefined;
    isConfigured: (account: T) => Promise<boolean>;
  };
  outbound: {
    deliveryMode: string;
    textChunkLimit: number;
    sendText: (ctx: any) => Promise<{ ok: boolean; error?: Error }>;
    sendMedia?: (ctx: any) => Promise<{ ok: boolean; error?: Error }>;
  };
  gateway: {
    startAccount: (ctx: any) => Promise<void>;
  };
}

export interface ChannelOnboardingAdapter {
  channel: string;
  getStatus: (ctx: { cfg: ClawdbotConfig }) => Promise<{
    channel: string;
    configured: boolean;
    statusLines: string[];
    selectionHint: string;
  }>;
  configure: (ctx: any) => Promise<{ cfg: ClawdbotConfig; accountId: string }>;
  disable: (cfg: ClawdbotConfig) => ClawdbotConfig;
}

export interface ChannelMessageActionAdapter {
  listActions: () => Array<{
    action: string;
    description: string;
    params: string[];
  }>;
  extractToolSend: (ctx: any) => { to: string; text: string };
  handleAction: (ctx: any) => Promise<{ ok: boolean; error?: string; data?: any }>;
}

/**
 * SDK 包名检测
 */
const SDK_PACKAGES = ["openclaw", "clawdbot", "moltbot"] as const;
let detectedPkg: string | null = null;

export function getDetectedPackage(): string | null {
  return detectedPkg;
}

export function setDetectedPackage(pkg: string): void {
  detectedPkg = pkg;
}

/**
 * 运行时检测 SDK
 */
export async function detectSDK(): Promise<string> {
  if (detectedPkg) return detectedPkg;

  for (const pkg of SDK_PACKAGES) {
    try {
      await import(`${pkg}/plugin-sdk`);
      detectedPkg = pkg;
      return pkg;
    } catch {
      continue;
    }
  }

  // 默认使用 clawdbot（最广泛兼容）
  detectedPkg = "clawdbot";
  return detectedPkg;
}
