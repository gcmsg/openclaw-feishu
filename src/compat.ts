/**
 * SDK 兼容层 - 支持 OpenClaw / Clawdbot / Moltbot
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Command = any;

// Logger 接口
export interface PluginLogger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug?: (message: string) => void;
}

// Prompter 接口（用于交互式 CLI）
export interface PluginPrompter {
  text(opts: { message: string; validate?: (v: string) => string | undefined }): Promise<string>;
  confirm(opts: { message: string; initialValue?: boolean }): Promise<boolean>;
  note(message: string, title?: string): Promise<void>;
  select?<T>(opts: { message: string; options: Array<{ value: T; label: string }> }): Promise<T>;
}

// CLI 注册上下文
export interface CliRegistrationContext {
  program: Command;
  prompter?: PluginPrompter;
}

// 类型定义（编译时使用，不影响运行时）
export interface ClawdbotPluginApi {
  /** 插件运行时 */
  runtime: PluginRuntime;
  /** 完整配置 */
  config: ClawdbotConfig;
  /** 插件自身配置 (plugins.entries.<id>.config) */
  pluginConfig?: unknown;
  /** 日志器 */
  logger: PluginLogger;
  /** 注册通道 */
  registerChannel: (opts: { plugin: any }) => void;
  /** 注册 CLI 命令 */
  registerCli: (
    factory: (ctx: CliRegistrationContext) => void,
    opts?: { commands?: string[] }
  ) => void;
  /** 注册 Gateway 方法 */
  registerGatewayMethod?: (name: string, handler: (ctx: any) => void) => void;
  /** 注册后台服务 */
  registerService?: (opts: { id: string; start: () => Promise<void>; stop: () => Promise<void> }) => void;
}

export interface PluginRuntime {
  channel: {
    reply: {
      dispatchReplyWithBufferedBlockDispatcher: (opts: any) => Promise<void>;
    };
  };
  /** 更新配置 */
  configPatch?: (patch: Partial<ClawdbotConfig>) => Promise<void>;
  /** 重启 Gateway */
  restart?: () => Promise<void>;
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
