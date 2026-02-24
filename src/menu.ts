/**
 * 飞书菜单系统 — 卡片模板
 *
 * 通过交互式卡片按钮控制模型行为。
 * 按钮点击通过 WebSocket 长连接的 card 类型消息回调（在 gateway.ts 中 monkey-patch 处理）。
 */

export interface CardButton {
  text: string;
  cmd: string;
  type?: "default" | "primary" | "danger";
}

/** 构建主菜单卡片 */
export function buildMainMenuCard(): Record<string, any> {
  return {
    config: { wide_screen_mode: true, update_multi: false },
    header: {
      template: "blue",
      title: { tag: "plain_text", content: "⚙️ Nina 控制菜单" },
    },
    elements: [
      {
        tag: "div",
        text: { tag: "lark_md", content: "选择一个操作，或直接发送斜杠命令：" },
      },
      { tag: "hr" },
      {
        tag: "action",
        actions: [
          buildButton("📊 查看状态", "/status", "default"),
          buildButton("🤖 切换模型", "/model", "default"),
          buildButton("🧠 推理模式", "/reasoning", "default"),
        ],
      },
      {
        tag: "action",
        actions: [
          buildButton("🔄 重置对话", "/reset", "danger"),
          buildButton("❓ 帮助", "/help", "default"),
        ],
      },
      { tag: "hr" },
      {
        tag: "note",
        elements: [
          {
            tag: "plain_text",
            content: "提示：也可以直接输入 /status、/model、/reset 等命令",
          },
        ],
      },
    ],
  };
}

/** 构建模型列表卡片 */
export function buildModelListCard(currentModel?: string): Record<string, any> {
  const models = [
    { id: "anthropic/claude-sonnet-4-6", name: "Claude Sonnet 4.6", tag: "⚡ 快速" },
    { id: "anthropic/claude-opus-4-5", name: "Claude Opus 4.5", tag: "🧠 强力" },
    { id: "anthropic/claude-haiku-4-5", name: "Claude Haiku 4.5", tag: "🚀 极速" },
    { id: "openai/gpt-4o", name: "GPT-4o", tag: "🌐 OpenAI" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", tag: "🌐 轻量" },
    { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash", tag: "✨ Google" },
  ];

  const actions = models.map((m) => {
    const isActive = currentModel && currentModel.includes(m.id.split("/")[1]);
    return buildButton(
      `${isActive ? "✅ " : ""}${m.name} ${m.tag}`,
      `/model ${m.id}`,
      isActive ? "primary" : "default"
    );
  });

  // 每行最多 2 个按钮
  const actionRows: any[] = [];
  for (let i = 0; i < actions.length; i += 2) {
    actionRows.push({
      tag: "action",
      actions: actions.slice(i, i + 2),
    });
  }

  return {
    config: { wide_screen_mode: true },
    header: {
      template: "indigo",
      title: { tag: "plain_text", content: "🤖 选择模型" },
    },
    elements: [
      currentModel
        ? {
            tag: "div",
            text: {
              tag: "lark_md",
              content: `**当前模型：** \`${currentModel}\``,
            },
          }
        : null,
      { tag: "hr" },
      ...actionRows,
      { tag: "hr" },
      {
        tag: "note",
        elements: [
          {
            tag: "plain_text",
            content: "也可以直接输入 /model [模型ID] 切换，输入 /models 查看更多",
          },
        ],
      },
    ].filter(Boolean),
  };
}

/** 构建重置确认卡片 */
export function buildResetConfirmCard(): Record<string, any> {
  return {
    config: { wide_screen_mode: true },
    header: {
      template: "red",
      title: { tag: "plain_text", content: "⚠️ 确认重置对话" },
    },
    elements: [
      {
        tag: "div",
        text: {
          tag: "lark_md",
          content: "这将**清除当前对话的所有历史记录**，Nina 会忘记此次对话的内容。\n\n确定要继续吗？",
        },
      },
      { tag: "hr" },
      {
        tag: "action",
        actions: [
          buildButton("✅ 确认重置", "/reset", "danger"),
          buildButton("❌ 取消", "/cancel_reset", "default"),
        ],
      },
    ],
  };
}

/** 构建帮助卡片 */
export function buildHelpCard(): Record<string, any> {
  return {
    config: { wide_screen_mode: true },
    header: {
      template: "green",
      title: { tag: "plain_text", content: "❓ 命令帮助" },
    },
    elements: [
      {
        tag: "div",
        text: {
          tag: "lark_md",
          content: [
            "**基础命令**",
            "─────────────",
            "`/menu` — 显示控制菜单（本页面）",
            "`/status` — 查看当前模型和会话状态",
            "`/help` — 显示所有可用命令",
            "",
            "**模型控制**",
            "─────────────",
            "`/model` — 显示模型选择菜单",
            "`/model [id]` — 直接切换到指定模型",
            "`/models` — 浏览所有可用模型",
            "`/reasoning` — 开启/关闭推理模式",
            "",
            "**会话管理**",
            "─────────────",
            "`/reset` — 重置当前对话（清除历史）",
            "`/new` — 开启新对话",
            "`/config` — 查看会话配置",
          ].join("\n"),
        },
      },
      { tag: "hr" },
      {
        tag: "action",
        actions: [buildButton("← 返回主菜单", "/menu", "default")],
      },
    ],
  };
}

/** 构建单个按钮元素 */
function buildButton(
  text: string,
  cmd: string,
  type: "default" | "primary" | "danger" = "default"
): Record<string, any> {
  return {
    tag: "button",
    text: { tag: "plain_text", content: text },
    type,
    value: { cmd },
  };
}

/** 构建操作结果 Toast（用于卡片回调响应） */
export function buildToastResponse(message: string, type: "success" | "warning" | "error" = "success"): Record<string, any> {
  return {
    toast: {
      type,
      content: message,
      i18n: { zh_cn: message },
    },
  };
}
