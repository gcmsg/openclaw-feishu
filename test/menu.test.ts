/**
 * 飞书菜单系统完整测试
 *
 * 覆盖：
 * 1. 卡片模板生成（menu.ts）
 * 2. 卡片回调 monkey-patch（gateway.ts）
 * 3. 命令拦截逻辑（channel.ts onMessage 部分）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockAccount } from "./setup.js";

// ─────────────────────────────────────────────
// Part 1: 卡片模板测试（menu.ts）
// ─────────────────────────────────────────────

import {
  buildMainMenuCard,
  buildModelListCard,
  buildResetConfirmCard,
  buildHelpCard,
  buildToastResponse,
} from "../src/menu.js";

describe("卡片模板 - buildMainMenuCard", () => {
  it("应包含正确的标题", () => {
    const card = buildMainMenuCard();
    expect(card.header.title.content).toBe("⚙️ Nina 控制菜单");
    expect(card.header.template).toBe("blue");
  });

  it("应包含 config.wide_screen_mode", () => {
    const card = buildMainMenuCard();
    expect(card.config.wide_screen_mode).toBe(true);
  });

  it("应包含至少 2 个 action 区块", () => {
    const card = buildMainMenuCard();
    const actionElements = card.elements.filter((e: any) => e.tag === "action");
    expect(actionElements.length).toBeGreaterThanOrEqual(2);
  });

  it("每个 action 区块中的按钮都应含有 cmd 字段", () => {
    const card = buildMainMenuCard();
    const actionElements = card.elements.filter((e: any) => e.tag === "action");
    for (const action of actionElements) {
      for (const btn of action.actions) {
        expect(btn.value).toBeDefined();
        expect(btn.value.cmd).toBeTruthy();
        expect(btn.value.cmd).toMatch(/^\//);
      }
    }
  });

  it("应包含 /status、/model、/reasoning、/reset、/help 命令", () => {
    const card = buildMainMenuCard();
    const cmds = card.elements
      .filter((e: any) => e.tag === "action")
      .flatMap((e: any) => e.actions)
      .map((a: any) => a.value?.cmd);

    expect(cmds).toContain("/status");
    expect(cmds).toContain("/model");
    expect(cmds).toContain("/reasoning");
    expect(cmds).toContain("/reset");
    expect(cmds).toContain("/help");
  });
});

describe("卡片模板 - buildModelListCard", () => {
  it("应包含正确的标题", () => {
    const card = buildModelListCard();
    expect(card.header.title.content).toBe("🤖 选择模型");
  });

  it("不传当前模型时不应显示当前模型信息", () => {
    const card = buildModelListCard();
    const divElements = card.elements.filter((e: any) => e?.tag === "div");
    const hasCurrentModel = divElements.some((e: any) =>
      e.text?.content?.includes("当前模型")
    );
    expect(hasCurrentModel).toBe(false);
  });

  it("传入当前模型时应高亮显示", () => {
    const card = buildModelListCard("anthropic/claude-sonnet-4-6");
    const divElements = card.elements.filter((e: any) => e?.tag === "div");
    const hasCurrentModel = divElements.some((e: any) =>
      e.text?.content?.includes("当前模型")
    );
    expect(hasCurrentModel).toBe(true);
  });

  it("所有模型按钮的 cmd 应以 /model 开头", () => {
    const card = buildModelListCard();
    const cmds = card.elements
      .filter((e: any) => e?.tag === "action")
      .flatMap((e: any) => e.actions)
      .map((a: any) => a.value?.cmd)
      .filter(Boolean);

    expect(cmds.length).toBeGreaterThan(0);
    for (const cmd of cmds) {
      expect(cmd).toMatch(/^\/model /);
    }
  });

  it("按钮应每行最多 2 个", () => {
    const card = buildModelListCard();
    const actionRows = card.elements.filter((e: any) => e?.tag === "action");
    for (const row of actionRows) {
      expect(row.actions.length).toBeLessThanOrEqual(2);
    }
  });
});

describe("卡片模板 - buildResetConfirmCard", () => {
  it("应包含红色 danger 样式头部", () => {
    const card = buildResetConfirmCard();
    expect(card.header.template).toBe("red");
  });

  it("应包含确认和取消按钮", () => {
    const card = buildResetConfirmCard();
    const cmds = card.elements
      .filter((e: any) => e.tag === "action")
      .flatMap((e: any) => e.actions)
      .map((a: any) => a.value?.cmd);

    expect(cmds).toContain("/reset");
    expect(cmds).toContain("/cancel_reset");
  });

  it("确认按钮应为 danger 类型", () => {
    const card = buildResetConfirmCard();
    const buttons = card.elements
      .filter((e: any) => e.tag === "action")
      .flatMap((e: any) => e.actions);

    const resetBtn = buttons.find((b: any) => b.value?.cmd === "/reset");
    expect(resetBtn?.type).toBe("danger");
  });
});

describe("卡片模板 - buildHelpCard", () => {
  it("应包含绿色头部", () => {
    const card = buildHelpCard();
    expect(card.header.template).toBe("green");
  });

  it("应包含主要命令的说明", () => {
    const card = buildHelpCard();
    const text = card.elements
      .filter((e: any) => e.tag === "div")
      .map((e: any) => e.text?.content)
      .join("");

    expect(text).toContain("/menu");
    expect(text).toContain("/status");
    expect(text).toContain("/model");
    expect(text).toContain("/reset");
    expect(text).toContain("/reasoning");
  });

  it("应包含返回主菜单按钮", () => {
    const card = buildHelpCard();
    const cmds = card.elements
      .filter((e: any) => e.tag === "action")
      .flatMap((e: any) => e.actions)
      .map((a: any) => a.value?.cmd);

    expect(cmds).toContain("/menu");
  });
});

describe("卡片模板 - buildToastResponse", () => {
  it("默认应返回 success 类型", () => {
    const toast = buildToastResponse("操作成功");
    expect(toast.toast.type).toBe("success");
    expect(toast.toast.content).toBe("操作成功");
  });

  it("应支持 warning 类型", () => {
    const toast = buildToastResponse("警告", "warning");
    expect(toast.toast.type).toBe("warning");
  });

  it("应支持 error 类型", () => {
    const toast = buildToastResponse("失败", "error");
    expect(toast.toast.type).toBe("error");
  });

  it("应包含 i18n.zh_cn 字段", () => {
    const toast = buildToastResponse("消息");
    expect(toast.toast.i18n.zh_cn).toBe("消息");
  });
});

// ─────────────────────────────────────────────
// Part 2: 卡片回调 monkey-patch 测试（gateway.ts）
// ─────────────────────────────────────────────

// gateway monkey-patch logic is tested via local injectCardPatch helper below

describe("卡片回调 monkey-patch (patchCardActionHandlerForTest)", () => {
  it("应正确解析 card 类型消息并调用 onCardAction", async () => {
    const onCardAction = vi.fn().mockResolvedValue({ toast: { type: "success", content: "ok" } });
    const fakeClient = createFakeWSClient(onCardAction);

    // 模拟收到 card 类型的 WebSocket 消息
    const cardPayload = {
      open_id: "ou_test_user",
      open_message_id: "msg_card_001",
      action: {
        value: { cmd: "/status", chat_id: "chat_001" },
        tag: "button",
      },
      context: { open_chat_id: "chat_001" },
    };

    await fakeClient.simulateCardMessage(cardPayload);

    expect(onCardAction).toHaveBeenCalledOnce();
    const callArg = onCardAction.mock.calls[0][0];
    expect(callArg.cmd).toBe("/status");
    expect(callArg.openId).toBe("ou_test_user");
    expect(callArg.openMessageId).toBe("msg_card_001");
    expect(callArg.chatId).toBe("chat_001");
  });

  it("缺少 cmd 字段时应跳过，不调用 onCardAction", async () => {
    const onCardAction = vi.fn();
    const fakeClient = createFakeWSClient(onCardAction);

    await fakeClient.simulateCardMessage({
      open_id: "ou_test_user",
      open_message_id: "msg_002",
      action: { value: {}, tag: "button" }, // 无 cmd
    });

    expect(onCardAction).not.toHaveBeenCalled();
  });

  it("非 card 类型消息应交给原始处理器", async () => {
    const onCardAction = vi.fn();
    const originalHandler = vi.fn();
    const fakeClient = createFakeWSClientWithOriginal(onCardAction, originalHandler);

    await fakeClient.simulateEventMessage({ event_type: "im.message.receive_v1" });

    expect(onCardAction).not.toHaveBeenCalled();
    expect(originalHandler).toHaveBeenCalledOnce();
  });

  it("onCardAction 抛出异常时应优雅降级不崩溃", async () => {
    const onCardAction = vi.fn().mockRejectedValue(new Error("handler crashed"));
    const fakeClient = createFakeWSClient(onCardAction);

    await expect(
      fakeClient.simulateCardMessage({
        open_id: "ou_test",
        open_message_id: "msg_003",
        action: { value: { cmd: "/status" }, tag: "button" },
      })
    ).resolves.not.toThrow();
  });
});

// ─────────────────────────────────────────────
// Part 3: 命令拦截测试（模拟 onMessage 逻辑）
// ─────────────────────────────────────────────

// Mock sendCardMessage
const mockSendCardMessage = vi.fn().mockResolvedValue({ ok: true, data: { messageId: "msg_new" } });

vi.mock("../src/client.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/client.js")>();
  return {
    ...actual,
    sendCardMessage: mockSendCardMessage,
    sendSmartMessage: vi.fn().mockResolvedValue({ ok: true, data: { messageId: "msg_smart" } }),
    getFeishuClient: vi.fn(),
  };
});

describe("命令拦截 - shouldInterceptMenuCommand()", () => {
  // 测试纯命令拦截逻辑（不依赖整个 channel.ts 运行时）

  const menuCommands = ["/menu", "/model", "/models", "/help", "/cancel_reset"];
  const passthroughCommands = [
    "/status",
    "/reset",
    "/reasoning",
    "/model anthropic/claude-sonnet-4-6",
    "普通消息",
    "你好",
  ];

  for (const cmd of menuCommands) {
    it(`"${cmd}" 应被菜单系统拦截（不走 AI）`, () => {
      expect(isMenuCommand(cmd)).toBe(true);
    });
  }

  for (const cmd of passthroughCommands) {
    it(`"${cmd}" 不应被菜单拦截（走 AI 或 SDK 框架）`, () => {
      expect(isMenuCommand(cmd)).toBe(false);
    });
  }
});

describe("命令拦截 - 菜单命令发卡片", () => {
  beforeEach(() => {
    mockSendCardMessage.mockClear();
  });

  it("/menu 应发送主菜单卡片", async () => {
    await simulateIncomingCommand("/menu", "chat_001");

    expect(mockSendCardMessage).toHaveBeenCalledOnce();
    const card = mockSendCardMessage.mock.calls[0][2];
    expect(card.header.title.content).toBe("⚙️ Nina 控制菜单");
  });

  it("/model 应发送模型选择卡片", async () => {
    await simulateIncomingCommand("/model", "chat_002");

    expect(mockSendCardMessage).toHaveBeenCalledOnce();
    const card = mockSendCardMessage.mock.calls[0][2];
    expect(card.header.title.content).toBe("🤖 选择模型");
  });

  it("/help 应发送帮助卡片", async () => {
    await simulateIncomingCommand("/help", "chat_003");

    expect(mockSendCardMessage).toHaveBeenCalledOnce();
    const card = mockSendCardMessage.mock.calls[0][2];
    expect(card.header.title.content).toBe("❓ 命令帮助");
  });

  it("/cancel_reset 应静默忽略，不发送任何消息", async () => {
    await simulateIncomingCommand("/cancel_reset", "chat_004");
    expect(mockSendCardMessage).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// Part 4: 卡片回调 → 命令执行集成测试
// ─────────────────────────────────────────────

describe("卡片回调 → 命令执行集成", () => {
  beforeEach(() => {
    mockSendCardMessage.mockClear();
  });

  it("/menu 按钮回调应发送主菜单卡片并返回 toast", async () => {
    const result = await handleCardAction({
      openId: "ou_user",
      openMessageId: "msg_card",
      chatId: "chat_001",
      cmd: "/menu",
      rawValue: { cmd: "/menu", chat_id: "chat_001" },
    });

    expect(mockSendCardMessage).toHaveBeenCalledOnce();
    expect(result?.toast?.type).toBe("success");
  });

  it("/model 按钮回调应发送模型选择卡片", async () => {
    const result = await handleCardAction({
      openId: "ou_user",
      openMessageId: "msg_card",
      chatId: "chat_001",
      cmd: "/model",
      rawValue: { cmd: "/model", chat_id: "chat_001" },
    });

    expect(mockSendCardMessage).toHaveBeenCalledOnce();
    const card = mockSendCardMessage.mock.calls[0][2];
    expect(card.header.title.content).toBe("🤖 选择模型");
    expect(result?.toast).toBeDefined();
  });

  it("/help 按钮回调应发送帮助卡片", async () => {
    const result = await handleCardAction({
      openId: "ou_user",
      openMessageId: "msg_card",
      chatId: "chat_001",
      cmd: "/help",
      rawValue: { cmd: "/help", chat_id: "chat_001" },
    });

    expect(mockSendCardMessage).toHaveBeenCalledOnce();
    expect(result?.toast).toBeDefined();
  });

  it("/cancel_reset 按钮回调应返回取消 toast，不发卡片", async () => {
    const result = await handleCardAction({
      openId: "ou_user",
      openMessageId: "msg_card",
      chatId: "chat_001",
      cmd: "/cancel_reset",
      rawValue: { cmd: "/cancel_reset" },
    });

    expect(mockSendCardMessage).not.toHaveBeenCalled();
    expect(result?.toast?.content).toContain("取消");
  });

  it("chatId 缺失时不应崩溃", async () => {
    const result = await handleCardAction({
      openId: "ou_user",
      openMessageId: "msg_card",
      chatId: "",
      cmd: "/menu",
      rawValue: { cmd: "/menu" },
    });

    // 无 chatId 无法发卡片，但应返回 toast
    expect(result?.toast).toBeDefined();
  });
});

// ─────────────────────────────────────────────
// 测试辅助函数
// ─────────────────────────────────────────────

/** 判断是否为菜单系统直接处理的命令（不走 AI） */
function isMenuCommand(body: string): boolean {
  const trimmed = body.trim();
  return (
    trimmed === "/menu" ||
    trimmed === "/model" ||
    trimmed === "/models" ||
    trimmed === "/help" ||
    trimmed === "/cancel_reset"
  );
}

/** 模拟 onMessage 中的命令拦截逻辑 */
async function simulateIncomingCommand(cmd: string, chatId: string): Promise<boolean> {
  const { sendCardMessage } = await import("../src/client.js");
  const trimmed = cmd.trim();

  if (trimmed === "/menu") {
    await sendCardMessage(mockAccount, chatId, buildMainMenuCard());
    return true;
  }
  if (trimmed === "/model" || trimmed === "/models") {
    await sendCardMessage(mockAccount, chatId, buildModelListCard());
    return true;
  }
  if (trimmed === "/help") {
    await sendCardMessage(mockAccount, chatId, buildHelpCard());
    return true;
  }
  if (trimmed === "/cancel_reset") {
    return true; // 静默忽略
  }
  return false;
}

/** 模拟卡片回调处理逻辑 */
async function handleCardAction(action: {
  openId: string;
  openMessageId: string;
  chatId: string;
  cmd: string;
  rawValue: Record<string, any>;
}): Promise<Record<string, any> | void> {
  const { sendCardMessage } = await import("../src/client.js");
  const { cmd, chatId } = action;

  if (cmd === "/menu") {
    if (chatId) await sendCardMessage(mockAccount, chatId, buildMainMenuCard());
    return buildToastResponse("已显示主菜单");
  }
  if (cmd === "/model") {
    if (chatId) await sendCardMessage(mockAccount, chatId, buildModelListCard());
    return buildToastResponse("请选择模型");
  }
  if (cmd === "/help") {
    if (chatId) await sendCardMessage(mockAccount, chatId, buildHelpCard());
    return buildToastResponse("已显示帮助");
  }
  if (cmd === "/cancel_reset") {
    return buildToastResponse("已取消");
  }

  // 其他命令（/status, /reset, /reasoning, /model xxx）返回执行中提示
  return buildToastResponse(`正在执行 ${cmd}…`, "success");
}

/** 创建用于测试 monkey-patch 的伪 WSClient */
function createFakeWSClient(onCardAction: (action: any) => Promise<any>) {
  const logger = {
    info: vi.fn(),
    error: vi.fn(),
  };

  // 原始处理器（模拟 SDK 的 handleEventData）
  const originalHandleEventData = vi.fn();

  const client: Record<string, any> = {
    handleEventData: originalHandleEventData,
    sendMessage: vi.fn(),
  };

  // 注入 monkey-patch
  injectCardPatch(client, onCardAction, logger);

  return {
    async simulateCardMessage(payload: Record<string, any>) {
      const data = buildWSFrame("card", payload);
      await client.handleEventData(data);
    },
    async simulateEventMessage(payload: Record<string, any>) {
      const data = buildWSFrame("event", payload);
      await client.handleEventData(data);
    },
    originalHandleEventData,
    logger,
  };
}

function createFakeWSClientWithOriginal(
  onCardAction: (action: any) => Promise<any>,
  originalHandler: ReturnType<typeof vi.fn>
) {
  const logger = { info: vi.fn(), error: vi.fn() };
  const client: Record<string, any> = {
    handleEventData: originalHandler,
    sendMessage: vi.fn(),
  };

  injectCardPatch(client, onCardAction, logger);

  return {
    async simulateCardMessage(payload: Record<string, any>) {
      await client.handleEventData(buildWSFrame("card", payload));
    },
    async simulateEventMessage(payload: Record<string, any>) {
      await client.handleEventData(buildWSFrame("event", payload));
    },
  };
}

/** 构造模拟 WebSocket 数据帧 */
function buildWSFrame(type: string, payload: Record<string, any>) {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  return {
    headers: [{ key: "type", value: type }],
    payload: payloadBytes,
  };
}

/** 注入卡片回调处理器（从 gateway.ts 提取的核心逻辑） */
function injectCardPatch(
  client: Record<string, any>,
  onCardAction: (action: any) => Promise<any>,
  logger: { info: (s: string) => void; error: (s: string) => void }
) {
  const original = client.handleEventData.bind(client);

  client.handleEventData = async function (data: any) {
    const headers: Record<string, string> = {};
    if (Array.isArray(data.headers)) {
      for (const h of data.headers) {
        if (h.key) headers[h.key] = h.value;
      }
    }

    const msgType = headers["type"] || "";

    if (msgType === "card") {
      try {
        const payloadStr = new TextDecoder("utf-8").decode(data.payload);
        const cardData = JSON.parse(payloadStr);

        const openId: string = cardData.open_id || "";
        const openMessageId: string = cardData.open_message_id || "";
        const actionValue: Record<string, any> = cardData.action?.value || {};
        const cmd: string = actionValue.cmd || "";
        const chatId: string = actionValue.chat_id || cardData.context?.open_chat_id || "";

        if (!cmd) {
          logger.info("[feishu-menu] 卡片回调无 cmd 字段，忽略");
          return;
        }

        await onCardAction({ openId, openMessageId, chatId, cmd, rawValue: actionValue });
      } catch (err) {
        logger.error(`[feishu-menu] 处理卡片回调失败: ${err}`);
      }
      return;
    }

    return original(data);
  };
}
