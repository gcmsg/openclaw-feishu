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

export interface ChannelAgentTool {
  label: string;
  name: string;
  description: string;
  parameters: any;
  execute: (
    toolCallId: string,
    args: Record<string, unknown>,
    signal?: AbortSignal
  ) => Promise<{
    content: Array<{ type: string; text: string }>;
    details?: Record<string, unknown>;
  }>;
}

export type ChannelAgentToolFactory = (params: { cfg?: ClawdbotConfig }) => ChannelAgentTool[];

/**
 * Channel Config Adapter - 与 OpenClaw 类型兼容
 */
export interface ChannelConfigAdapter<T = any> {
  listAccountIds: (cfg: ClawdbotConfig) => string[];
  /**
   * 解析账号 - OpenClaw 期望始终返回有效账号
   * 如果 accountId 无效，应返回默认账号或抛出错误
   */
  resolveAccount: (cfg: ClawdbotConfig, accountId?: string | null) => T;
  defaultAccountId?: (cfg: ClawdbotConfig) => string;
  isEnabled?: (account: T, cfg: ClawdbotConfig) => boolean;
  disabledReason?: (account: T, cfg: ClawdbotConfig) => string;
  /**
   * 检查账号是否已配置
   * @param account 已解析的账号
   * @param cfg 完整配置（OpenClaw/Clawdbot 会传入此参数）
   */
  isConfigured?: (account: T, cfg: ClawdbotConfig) => boolean | Promise<boolean>;
  unconfiguredReason?: (account: T, cfg: ClawdbotConfig) => string;
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
  // Channel-owned agent tools (飞书专属工具等)
  agentTools?: ChannelAgentToolFactory | ChannelAgentTool[];
  config: ChannelConfigAdapter<T>;
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

  // 默认使用 openclaw（新版优先）
  detectedPkg = "openclaw";
  return detectedPkg;
}
