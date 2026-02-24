/**
 * 飞书菜单系统测试（方案 A：机器人指令）
 *
 * 覆盖：
 * 1. 卡片模板生成（menu.ts）
 * 2. 命令拦截逻辑（/menu、/model、/help 发卡片，不走 AI）
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAccount } from "./setup.js";

import {
  buildMainMenuCard,
  buildModelListCard,
  buildHelpCard,
} from "../src/menu.js";

// ─────────────────────────────────────────────
// Part 1: 卡片模板测试
// ─────────────────────────────────────────────

describe("buildMainMenuCard", () => {
  it("应包含正确标题", () => {
    const card = buildMainMenuCard();
    expect(card.header.title.content).toBe("⚙️ Nina 指令菜单");
    expect(card.header.template).toBe("blue");
  });

  it("应包含 wide_screen_mode", () => {
    expect(buildMainMenuCard().config.wide_screen_mode).toBe(true);
  });

  it("内容应包含 /status、/model、/reset、/reasoning", () => {
    const text = JSON.stringify(buildMainMenuCard());
    expect(text).toContain("/status");
    expect(text).toContain("/model");
    expect(text).toContain("/reset");
    expect(text).toContain("/reasoning");
  });

  it("应包含使用提示（输入 / 唤起菜单）", () => {
    const text = JSON.stringify(buildMainMenuCard());
    expect(text).toContain("/");
  });

  it("不应包含交互式按钮（不需要回调）", () => {
    const card = buildMainMenuCard();
    const hasActionButtons = card.elements.some((e: any) => e.tag === "action");
    expect(hasActionButtons).toBe(false);
  });
});

describe("buildModelListCard", () => {
  it("应包含正确标题", () => {
    expect(buildModelListCard().header.title.content).toBe("🤖 可用模型列表");
  });

  it("应列出主要模型", () => {
    const text = JSON.stringify(buildModelListCard());
    expect(text).toContain("claude-sonnet-4-6");
    expect(text).toContain("claude-opus-4-5");
    expect(text).toContain("claude-haiku-4-5");
    expect(text).toContain("gpt-4o");
    expect(text).toContain("gemini-2.0-flash");
  });

  it("不传 currentModel 时不应有「当前模型」标注", () => {
    const text = JSON.stringify(buildModelListCard());
    expect(text).not.toContain("当前模型");
  });

  it("传入 currentModel 时应显示「当前模型」标注", () => {
    const text = JSON.stringify(buildModelListCard("anthropic/claude-sonnet-4-6"));
    expect(text).toContain("当前模型");
  });

  it("应包含切换命令说明", () => {
    const text = JSON.stringify(buildModelListCard());
    expect(text).toContain("/model");
  });

  it("不应包含交互式按钮", () => {
    const card = buildModelListCard();
    const hasActionButtons = card.elements.filter(Boolean).some((e: any) => e.tag === "action");
    expect(hasActionButtons).toBe(false);
  });
});

describe("buildHelpCard", () => {
  it("应包含绿色头部", () => {
    expect(buildHelpCard().header.template).toBe("green");
  });

  it("应包含所有主要指令说明", () => {
    const text = JSON.stringify(buildHelpCard());
    expect(text).toContain("/menu");
    expect(text).toContain("/status");
    expect(text).toContain("/model");
    expect(text).toContain("/reset");
    expect(text).toContain("/reasoning");
    expect(text).toContain("/help");
  });

  it("应包含唤起提示", () => {
    const text = JSON.stringify(buildHelpCard());
    expect(text).toContain("/");
  });
});

// ─────────────────────────────────────────────
// Part 2: 命令拦截逻辑测试
// ─────────────────────────────────────────────

const mockSendCardMessage = vi.fn().mockResolvedValue({ ok: true, data: { messageId: "msg_001" } });

vi.mock("../src/client.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/client.js")>();
  return {
    ...actual,
    sendCardMessage: mockSendCardMessage,
    sendSmartMessage: vi.fn().mockResolvedValue({ ok: true }),
  };
});

/** 模拟 onMessage 中的命令拦截逻辑 */
async function simulateCommand(cmd: string, chatId: string): Promise<"intercepted" | "passthrough"> {
  const { sendCardMessage } = await import("../src/client.js");
  const trimmed = cmd.trim();

  if (trimmed === "/menu") {
    await sendCardMessage(mockAccount, chatId, buildMainMenuCard());
    return "intercepted";
  }
  if (trimmed === "/model" || trimmed === "/models") {
    await sendCardMessage(mockAccount, chatId, buildModelListCard());
    return "intercepted";
  }
  if (trimmed === "/help") {
    await sendCardMessage(mockAccount, chatId, buildHelpCard());
    return "intercepted";
  }
  if (trimmed === "/cancel_reset") {
    return "intercepted"; // 静默忽略
  }
  return "passthrough";
}

describe("命令拦截 - 菜单命令", () => {
  beforeEach(() => {
    mockSendCardMessage.mockClear();
  });

  it("/menu 应拦截并发主菜单卡片", async () => {
    const result = await simulateCommand("/menu", "chat_001");
    expect(result).toBe("intercepted");
    expect(mockSendCardMessage).toHaveBeenCalledOnce();
    const card = mockSendCardMessage.mock.calls[0][2];
    expect(card.header.title.content).toBe("⚙️ Nina 指令菜单");
  });

  it("/model 应拦截并发模型列表卡片", async () => {
    const result = await simulateCommand("/model", "chat_002");
    expect(result).toBe("intercepted");
    expect(mockSendCardMessage).toHaveBeenCalledOnce();
    const card = mockSendCardMessage.mock.calls[0][2];
    expect(card.header.title.content).toBe("🤖 可用模型列表");
  });

  it("/models 也应拦截并发模型列表卡片", async () => {
    const result = await simulateCommand("/models", "chat_002");
    expect(result).toBe("intercepted");
  });

  it("/help 应拦截并发帮助卡片", async () => {
    const result = await simulateCommand("/help", "chat_003");
    expect(result).toBe("intercepted");
    expect(mockSendCardMessage).toHaveBeenCalledOnce();
    const card = mockSendCardMessage.mock.calls[0][2];
    expect(card.header.title.content).toBe("❓ 指令帮助");
  });

  it("/cancel_reset 应静默拦截，不发卡片", async () => {
    const result = await simulateCommand("/cancel_reset", "chat_004");
    expect(result).toBe("intercepted");
    expect(mockSendCardMessage).not.toHaveBeenCalled();
  });
});

describe("命令拦截 - 透传命令（走 AI / SDK 框架）", () => {
  beforeEach(() => {
    mockSendCardMessage.mockClear();
  });

  const passthroughs = [
    "/status",
    "/reset",
    "/reasoning",
    "/model anthropic/claude-sonnet-4-6",
    "/new",
    "你好",
    "普通消息内容",
  ];

  for (const cmd of passthroughs) {
    it(`"${cmd}" 不应被拦截`, async () => {
      const result = await simulateCommand(cmd, "chat_pass");
      expect(result).toBe("passthrough");
      expect(mockSendCardMessage).not.toHaveBeenCalled();
    });
  }
});
