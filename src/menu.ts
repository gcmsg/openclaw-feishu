/**
 * 飞书菜单系统 — 展示卡片模板
 *
 * 方案 A：使用飞书「机器人指令」代替交互式卡片回调。
 * 用户在输入框输入 / 触发指令菜单，点选后直接发送为消息。
 * 这里的卡片仅作展示用途（/menu、/help、/model 时回复）。
 */

/** 构建主菜单卡片（纯展示，列出可用指令） */
export function buildMainMenuCard(): Record<string, any> {
  return {
    config: { wide_screen_mode: true },
    header: {
      template: "blue",
      title: { tag: "plain_text", content: "⚙️ Nina 指令菜单" },
    },
    elements: [
      {
        tag: "div",
        text: {
          tag: "lark_md",
          content: "在输入框输入 `/` 可呼出指令菜单，或直接发送以下命令：",
        },
      },
      { tag: "hr" },
      {
        tag: "div",
        text: {
          tag: "lark_md",
          content: [
            "**📊 状态与信息**",
            "`/status` — 查看当前模型和会话状态",
            "`/help` — 查看所有可用指令",
            "",
            "**🤖 模型控制**",
            "`/model` — 查看可用模型列表",
            "`/model [id]` — 切换指定模型",
            "`/reasoning` — 开启/关闭推理模式",
            "",
            "**🔄 会话管理**",
            "`/reset` — 重置当前对话",
            "`/new` — 开启新对话",
          ].join("\n"),
        },
      },
      { tag: "hr" },
      {
        tag: "note",
        elements: [
          {
            tag: "plain_text",
            content: "提示：在飞书输入框输入「/」即可唤起快捷指令菜单",
          },
        ],
      },
    ],
  };
}

/** 构建模型列表卡片（展示可用模型，供用户参考） */
export function buildModelListCard(currentModel?: string): Record<string, any> {
  const models = [
    { id: "anthropic/claude-sonnet-4-6", name: "Claude Sonnet 4.6", tag: "⚡ 快速均衡" },
    { id: "anthropic/claude-opus-4-5", name: "Claude Opus 4.5", tag: "🧠 顶级推理" },
    { id: "anthropic/claude-haiku-4-5", name: "Claude Haiku 4.5", tag: "🚀 极速轻量" },
    { id: "openai/gpt-4o", name: "GPT-4o", tag: "🌐 OpenAI" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", tag: "🌐 轻量" },
    { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash", tag: "✨ Google" },
  ];

  const modelLines = models.map((m) => {
    const isActive = currentModel && currentModel.includes(m.id.split("/")[1]);
    return `${isActive ? "✅ " : "　"}\`${m.id}\` — ${m.name} ${m.tag}`;
  });

  return {
    config: { wide_screen_mode: true },
    header: {
      template: "indigo",
      title: { tag: "plain_text", content: "🤖 可用模型列表" },
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
      {
        tag: "div",
        text: {
          tag: "lark_md",
          content: modelLines.join("\n"),
        },
      },
      { tag: "hr" },
      {
        tag: "note",
        elements: [
          {
            tag: "plain_text",
            content: "发送「/model [模型ID]」即可切换，例如：/model anthropic/claude-opus-4-5",
          },
        ],
      },
    ].filter(Boolean),
  };
}

/** 构建帮助卡片 */
export function buildHelpCard(): Record<string, any> {
  return {
    config: { wide_screen_mode: true },
    header: {
      template: "green",
      title: { tag: "plain_text", content: "❓ 指令帮助" },
    },
    elements: [
      {
        tag: "div",
        text: {
          tag: "lark_md",
          content: [
            "**基础指令**",
            "─────────────────",
            "`/menu` — 显示指令菜单",
            "`/status` — 查看当前模型和会话状态",
            "`/help` — 显示所有可用指令",
            "",
            "**模型控制**",
            "─────────────────",
            "`/model` — 查看可用模型列表",
            "`/model [id]` — 切换到指定模型",
            "`/models` — 浏览更多可用模型",
            "`/reasoning` — 开启/关闭推理模式",
            "",
            "**会话管理**",
            "─────────────────",
            "`/reset` — 重置当前对话（清除历史）",
            "`/new` — 开启新对话",
            "`/config` — 查看会话配置",
          ].join("\n"),
        },
      },
      { tag: "hr" },
      {
        tag: "note",
        elements: [
          {
            tag: "plain_text",
            content: "在飞书输入框输入「/」可快速唤起指令菜单",
          },
        ],
      },
    ],
  };
}
