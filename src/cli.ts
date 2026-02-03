/**
 * 飞书插件 CLI 命令
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Command = any;

import type { ClawdbotConfig } from "./compat.js";
import type { FeishuChannelConfig } from "./types.js";

interface PrompterLike {
  text(opts: { message: string; validate?: (v: string) => string | undefined }): Promise<string>;
  confirm(opts: { message: string; initialValue?: boolean }): Promise<boolean>;
  note(message: string, title?: string): Promise<void>;
}

interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

interface CliContext {
  program: Command;
  config: ClawdbotConfig;
  prompter?: PrompterLike;
  updateConfig?: (patch: Partial<ClawdbotConfig>) => Promise<void>;
  restartGateway?: () => Promise<void>;
  logger: Logger;
}

function getFeishuConfig(cfg: ClawdbotConfig): FeishuChannelConfig | undefined {
  return (cfg as any).channels?.["openclaw-feishu"];
}

function getPluginsAllow(cfg: ClawdbotConfig): string[] {
  return (cfg as any).plugins?.allow ?? [];
}

function needsAllowlistUpdate(cfg: ClawdbotConfig): boolean {
  const allow = getPluginsAllow(cfg);
  // 如果 allow 列表非空且不包含 feishu，需要更新
  return allow.length > 0 && !allow.includes("feishu");
}

export function registerFeishuCli(ctx: CliContext) {
  const { program, config } = ctx;

  const root = program
    .command("feishu")
    .description("飞书插件工具")
    .addHelpText("after", () => `\nDocs: https://github.com/gcmsg/openclaw-feishu\n`);

  // clawdbot feishu status
  root
    .command("status")
    .description("显示飞书插件状态")
    .action(async () => {
      const feishuCfg = getFeishuConfig(config);
      const configured = !!(feishuCfg?.appId && feishuCfg?.appSecret);
      const enabled = feishuCfg?.enabled !== false;

      console.info("\n📱 飞书插件状态\n");
      console.info(`  状态: ${configured ? "✅ 已配置" : "❌ 未配置"}`);
      console.info(`  启用: ${enabled ? "✅ 是" : "❌ 否"}`);
      if (feishuCfg?.appId) {
        console.info(`  App ID: ${feishuCfg.appId.slice(0, 10)}...`);
      }
      console.info();
    });

  // clawdbot feishu setup
  root
    .command("setup")
    .description("交互式配置飞书插件")
    .option("--app-id <id>", "飞书 App ID")
    .option("--app-secret <secret>", "飞书 App Secret")
    .option("--non-interactive", "非交互模式（需提供 --app-id 和 --app-secret）")
    .action(async (options: { appId?: string; appSecret?: string; nonInteractive?: boolean }) => {
      const currentCfg = getFeishuConfig(config);

      // 非交互模式
      if (options.nonInteractive) {
        if (!options.appId || !options.appSecret) {
          console.error("❌ 非交互模式需要提供 --app-id 和 --app-secret");
          process.exit(1);
        }
        console.info("📝 正在配置飞书插件...");
        console.info(`  App ID: ${options.appId.slice(0, 10)}...`);

        if (ctx.updateConfig) {
          // 构建配置更新
          const patch: any = {
            channels: {
              ...(config as any).channels,
              feishu: {
                ...currentCfg,
                enabled: true,
                appId: options.appId,
                appSecret: options.appSecret,
              },
            },
          };

          // 如果需要，自动添加到白名单
          if (needsAllowlistUpdate(config)) {
            const currentAllow = getPluginsAllow(config);
            patch.plugins = {
              ...(config as any).plugins,
              allow: [...currentAllow, "feishu"],
            };
            console.info("  已自动添加到插件白名单 ✓");
          }

          await ctx.updateConfig(patch);
          console.info("✅ 配置已保存");

          if (ctx.restartGateway) {
            console.info("🔄 正在重启 Gateway...");
            await ctx.restartGateway();
          }
        } else {
          // 直接输出配置指令
          console.info("\n请运行以下命令完成配置:\n");
          console.info(`clawdbot config set channels.openclaw-feishu.enabled true`);
          console.info(`clawdbot config set channels.openclaw-feishu.appId "${options.appId}"`);
          console.info(`clawdbot config set channels.openclaw-feishu.appSecret "${options.appSecret}"`);
          if (needsAllowlistUpdate(config)) {
            const currentAllow = getPluginsAllow(config);
            console.info(
              `clawdbot config set 'plugins.allow' '${JSON.stringify([...currentAllow, "feishu"])}'`
            );
          }
          console.info(`clawdbot gateway restart`);
        }
        return;
      }

      // 交互模式
      console.info("\n📖 飞书插件配置向导\n");
      console.info("  1) 登录飞书开放平台 → 创建企业自建应用");
      console.info("  2) 获取 App ID 和 App Secret");
      console.info("  3) 启用机器人能力 → 消息接收方式选「使用长连接接收消息」");
      console.info("  4) 添加权限：im:message, im:chat, docx:document, drive:drive");
      console.info("  5) 发布应用并授权");
      console.info("\n  📚 文档: https://open.feishu.cn/document\n");

      // 如果有 prompter，使用交互式输入
      if (ctx.prompter) {
        let appId = options.appId;
        let appSecret = options.appSecret;

        if (!appId) {
          if (currentCfg?.appId) {
            const keep = await ctx.prompter.confirm({
              message: `App ID 已配置 (${currentCfg.appId.slice(0, 10)}...)，是否保留？`,
              initialValue: true,
            });
            if (!keep) {
              appId = await ctx.prompter.text({
                message: "请输入飞书 App ID",
                validate: (v) => (v?.trim() ? undefined : "必填"),
              });
            } else {
              appId = currentCfg.appId;
            }
          } else {
            appId = await ctx.prompter.text({
              message: "请输入飞书 App ID",
              validate: (v) => (v?.trim() ? undefined : "必填"),
            });
          }
        }

        if (!appSecret) {
          if (currentCfg?.appSecret) {
            const keep = await ctx.prompter.confirm({
              message: "App Secret 已配置，是否保留？",
              initialValue: true,
            });
            if (!keep) {
              appSecret = await ctx.prompter.text({
                message: "请输入飞书 App Secret",
                validate: (v) => (v?.trim() ? undefined : "必填"),
              });
            } else {
              appSecret = currentCfg.appSecret;
            }
          } else {
            appSecret = await ctx.prompter.text({
              message: "请输入飞书 App Secret",
              validate: (v) => (v?.trim() ? undefined : "必填"),
            });
          }
        }

        if (ctx.updateConfig && appId && appSecret) {
          // 构建配置更新
          const patch: any = {
            channels: {
              ...(config as any).channels,
              feishu: {
                ...currentCfg,
                enabled: true,
                appId,
                appSecret,
              },
            },
          };

          // 如果需要，自动添加到白名单
          if (needsAllowlistUpdate(config)) {
            const currentAllow = getPluginsAllow(config);
            patch.plugins = {
              ...(config as any).plugins,
              allow: [...currentAllow, "feishu"],
            };
            console.info("\n  已自动添加到插件白名单 ✓");
          }

          await ctx.updateConfig(patch);
          console.info("\n✅ 配置已保存");

          if (ctx.restartGateway) {
            console.info("🔄 正在重启 Gateway...");
            await ctx.restartGateway();
          }
        }
      } else {
        // 没有 prompter，输出手动配置说明
        console.info("请手动配置:\n");
        console.info("clawdbot config set channels.openclaw-feishu.enabled true");
        console.info('clawdbot config set channels.openclaw-feishu.appId "cli_xxxxxxxx"');
        console.info('clawdbot config set channels.openclaw-feishu.appSecret "xxxxxxxx"');
        if (needsAllowlistUpdate(config)) {
          const currentAllow = getPluginsAllow(config);
          console.info(
            `clawdbot config set 'plugins.allow' '${JSON.stringify([...currentAllow, "feishu"])}'`
          );
        }
        console.info("clawdbot gateway restart");
      }
    });

  // clawdbot feishu test
  root
    .command("test")
    .description("测试飞书连接")
    .action(async () => {
      const feishuCfg = getFeishuConfig(config);

      if (!feishuCfg?.appId || !feishuCfg?.appSecret) {
        console.error("❌ 飞书未配置，请先运行: clawdbot feishu setup");
        process.exit(1);
      }

      console.info("🔍 正在测试飞书连接...\n");

      try {
        // 动态导入并测试获取群列表（简单的 API 调用测试）
        const { listChats } = await import("./chat.js");
        const account = {
          accountId: "default",
          appId: feishuCfg.appId,
          appSecret: feishuCfg.appSecret,
          config: feishuCfg,
        };

        const result = await listChats(account);
        if (result.ok) {
          console.info("✅ 连接成功！");
          console.info(`   已获取 ${result.data?.chats?.length || 0} 个群聊`);
        } else {
          console.error("❌ API 调用失败:", result.error);
          process.exit(1);
        }
      } catch (err) {
        console.error("❌ 连接失败:", err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  return root;
}
