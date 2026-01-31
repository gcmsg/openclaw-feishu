/**
 * Clawdbot 飞书通道插件
 *
 * 功能：
 * - 📨 消息收发（文本、富文本、卡片、图片、文件）
 * - 📄 云文档操作（创建、读取、追加内容）
 * - 📁 云空间管理（文件夹、上传、下载、搜索）
 *
 * 安装：
 *   clawdbot plugins install https://github.com/gcmsg/openclaw-feishu
 *
 * 配置：
 *   clawdbot onboard feishu
 */

import type { ClawdbotPluginApi } from "clawdbot/plugin-sdk";
import { feishuPlugin } from "./src/channel.js";
import { setFeishuRuntime } from "./src/runtime.js";

export const plugin = {
  id: "feishu",
  name: "Feishu",
  description: "飞书通道插件 - 支持消息、云文档、云空间",

  register(api: ClawdbotPluginApi) {
    setFeishuRuntime(api.runtime);
    api.registerChannel({ plugin: feishuPlugin });
  },
};

export default plugin;

// 导出通道插件
export { feishuPlugin } from "./src/channel.js";

// 导出类型
export * from "./src/types.js";

// 导出消息 API
export {
  getFeishuClient,
  sendTextMessage,
  sendPostMessage,
  sendCardMessage,
  sendImageMessage,
  sendFileMessage,
  replyMessage,
  recallMessage,
} from "./src/client.js";

// 导出云文档 API
export {
  createDocument,
  getDocument,
  getDocumentContent,
  getDocumentBlocks,
  appendDocumentBlocks,
  appendText,
  appendMarkdown,
} from "./src/document.js";

// 导出云空间 API
export {
  createFolder,
  listFiles,
  uploadFile,
  downloadFile,
  moveFile,
  copyFile,
  deleteFile,
  searchFiles,
} from "./src/space.js";

// 导出网关
export { startGateway, stopGateway } from "./src/gateway.js";

// 导出运行时
export { setFeishuRuntime, getFeishuRuntime } from "./src/runtime.js";
