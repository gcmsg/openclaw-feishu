/**
 * 运行时上下文管理
 */

import type { PluginRuntime } from "clawdbot/plugin-sdk";

let feishuRuntime: PluginRuntime | null = null;

export function setFeishuRuntime(runtime: PluginRuntime) {
  feishuRuntime = runtime;
}

export function getFeishuRuntime(): PluginRuntime {
  if (!feishuRuntime) {
    throw new Error("Feishu runtime not initialized");
  }
  return feishuRuntime;
}
