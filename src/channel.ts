/**
 * 飞书通道插件定义
 */

import type {
  ChannelPlugin,
  ClawdbotConfig,
  ChannelOnboardingAdapter,
  ChannelMessageActionAdapter,
} from "./compat.js";
import type { ResolvedFeishuAccount, FeishuChannelConfig, MsgContext } from "./types.js";
import {
  sendTextMessage,
  sendImageMessage,
  sendFileMessage,
  sendCardMessage,
  downloadImageByKey,
  downloadMessageFile,
  sendSmartMessage,
  forwardMessage,
  mergeForwardMessages,
  sendUrgentMessage,
  getMessageReadUsers,
} from "./client.js";
import {
  createChat,
  getChat,
  updateChat,
  deleteChat,
  listChats,
  searchChats,
  addChatMembers,
  removeChatMembers,
  getChatMembers,
  isUserInChat,
  addChatManagers,
  removeChatManagers,
  createChatTab,
  listChatTabs,
  updateChatTab,
  deleteChatTabs,
  putTopNotice,
  deleteTopNotice,
  getChatAnnouncement,
  updateChatAnnouncement,
} from "./chat.js";
import {
  createDocument,
  getDocument,
  getDocumentContent,
  getDocumentStructure,
  getBlock,
  updateBlock,
  deleteBlock,
  deleteBlocks,
  insertBlocksAfter,
  prependDocumentBlocks,
  appendText,
  appendMarkdown,
  appendDocumentBlocks,
} from "./document.js";
import {
  createFolder,
  listFiles,
  uploadFile,
  downloadFile,
  searchFiles,
  getFileMeta,
  getBatchDownloadUrls,
  createShortcut,
  transferFileOwner,
  moveFile,
  copyFile,
  deleteFile,
} from "./space.js";
import {
  createBitableApp,
  getBitableApp,
  listBitableTables,
  createBitableTable,
  listBitableFields,
  createBitableField,
  listBitableRecords,
  searchBitableRecords,
  getBitableRecord,
  createBitableRecord,
  createBitableRecords,
  updateBitableRecord,
  deleteBitableRecord,
  deleteBitableRecords,
  // 视图
  listBitableViews,
  getBitableView,
  createBitableView,
  deleteBitableView,
  // 角色
  listBitableRoles,
  createBitableRole,
  updateBitableRole,
  deleteBitableRole,
  listBitableRoleMembers,
  addBitableRoleMember,
  removeBitableRoleMember,
  // 自动化
  listBitableWorkflows,
  toggleBitableWorkflow,
} from "./bitable.js";
import {
  createSpreadsheet,
  getSpreadsheet,
  listSheets,
  getSheet,
  readRange,
  writeRange,
  appendRows,
  insertRows,
  deleteRows,
  insertColumns,
  deleteColumns,
  setCellStyle,
  mergeCells,
  unmergeCells,
  createFilter,
  deleteFilter,
  sortRange,
  freezeRowsAndColumns,
  findReplace,
  setColumnWidth,
  setRowHeight,
  addSheet,
  deleteSheet,
  copySheet,
} from "./sheets.js";
import {
  listCalendars,
  getPrimaryCalendar,
  createCalendar,
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  searchEvents,
  listAttendees,
  addAttendees,
  queryFreeBusy,
  parseTimeString,
  // 订阅
  subscribeCalendar,
  unsubscribeCalendar,
  // ACL
  listCalendarAcls,
  addCalendarAcl,
  removeCalendarAcl,
} from "./calendar.js";
import {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  completeTask,
  uncompleteTask,
  listTasks,
  createTaskList,
  getTaskList,
  listTaskLists,
  deleteTaskList,
  addTaskToList,
  removeTaskFromList,
  addTaskReminder,
  parseDueString,
  // 成员
  addTaskMembers,
  removeTaskMembers,
  // 依赖
  addTaskDependencies,
  removeTaskDependencies,
  // 附件
  listTaskAttachments,
  getTaskAttachment,
  deleteTaskAttachment,
  // 任务列表成员
  addTaskListMembers,
  removeTaskListMembers,
} from "./task.js";
import {
  listWikiSpaces,
  getWikiSpace,
  createWikiSpace,
  listWikiNodes,
  getWikiNode,
  createWikiNode,
  updateWikiNodeTitle,
  moveWikiNode,
  copyWikiNode,
  listWikiMembers,
  addWikiMember,
  removeWikiMember,
} from "./wiki.js";
import { searchMessages, searchDocs, searchDriveFiles, universalSearch } from "./search.js";
import {
  recognizeImage,
  speechToText,
  translateText,
  detectLanguage,
  getSupportedLanguages,
  type LanguageCode,
} from "./ai.js";
import { startGateway } from "./gateway.js";
import { getFeishuRuntime } from "./runtime.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const DEFAULT_ACCOUNT_ID = "default";

/**
 * 保存媒体到临时文件
 */
async function saveMediaToTemp(
  buffer: Buffer,
  ext: string,
  prefix: string = "feishu"
): Promise<string> {
  const tempDir = os.tmpdir();
  const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = path.join(tempDir, fileName);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
}
const CHANNEL_ID = "feishu" as const;

function getFeishuConfig(cfg: ClawdbotConfig): FeishuChannelConfig | undefined {
  return (cfg as any).channels?.feishu as FeishuChannelConfig | undefined;
}

function listFeishuAccountIds(cfg: ClawdbotConfig): string[] {
  const feishuCfg = getFeishuConfig(cfg);
  if (!feishuCfg || feishuCfg.enabled === false) return [];
  if (!feishuCfg.appId || !feishuCfg.appSecret) return [];
  return [DEFAULT_ACCOUNT_ID];
}

function resolveFeishuAccount(
  cfg: ClawdbotConfig,
  accountId: string
): ResolvedFeishuAccount | undefined {
  if (accountId !== DEFAULT_ACCOUNT_ID) return undefined;
  const feishuCfg = getFeishuConfig(cfg);
  if (!feishuCfg) return undefined;

  return {
    accountId: DEFAULT_ACCOUNT_ID,
    appId: feishuCfg.appId,
    appSecret: feishuCfg.appSecret,
    config: feishuCfg,
  };
}

// ========== Onboarding Adapter ==========

const feishuOnboardingAdapter: ChannelOnboardingAdapter = {
  channel: CHANNEL_ID,

  getStatus: async ({ cfg }) => {
    const feishuCfg = getFeishuConfig(cfg);
    const configured = !!(feishuCfg?.appId && feishuCfg?.appSecret);
    return {
      channel: CHANNEL_ID,
      configured,
      statusLines: [`Feishu: ${configured ? "configured ✓" : "needs App ID & Secret"}`],
      selectionHint: configured ? "configured" : "needs credentials",
    };
  },

  configure: async (ctx) => {
    const { cfg, prompter } = ctx;
    let next = cfg;
    const currentCfg = getFeishuConfig(cfg);
    const hasAppId = !!currentCfg?.appId;
    const hasAppSecret = !!currentCfg?.appSecret;

    await prompter.note(
      [
        "📖 飞书 Plus 插件配置",
        "",
        "1) 登录飞书开放平台 → 创建企业自建应用",
        "2) 获取 App ID 和 App Secret",
        "3) 启用机器人能力 → 消息接收方式选「使用长连接接收消息」",
        "4) 添加权限：im:message, im:chat, docx:document, drive:drive",
        "5) 发布应用并授权",
        "",
        "Docs: https://open.feishu.cn/document",
      ].join("\n"),
      "配置向导"
    );

    let appId: string | null = null;
    let appSecret: string | null = null;

    if (hasAppId) {
      const keep = await prompter.confirm({
        message: `App ID 已配置 (${currentCfg!.appId.slice(0, 8)}...)，是否保留？`,
        initialValue: true,
      });
      if (!keep) {
        appId = String(
          await prompter.text({
            message: "请输入飞书 App ID",
            validate: (v) => (v?.trim() ? undefined : "必填"),
          })
        ).trim();
      }
    } else {
      appId = String(
        await prompter.text({
          message: "请输入飞书 App ID",
          validate: (v) => (v?.trim() ? undefined : "必填"),
        })
      ).trim();
    }

    if (hasAppSecret) {
      const keep = await prompter.confirm({
        message: "App Secret 已配置，是否保留？",
        initialValue: true,
      });
      if (!keep) {
        appSecret = String(
          await prompter.text({
            message: "请输入飞书 App Secret",
            validate: (v) => (v?.trim() ? undefined : "必填"),
          })
        ).trim();
      }
    } else {
      appSecret = String(
        await prompter.text({
          message: "请输入飞书 App Secret",
          validate: (v) => (v?.trim() ? undefined : "必填"),
        })
      ).trim();
    }

    next = {
      ...next,
      channels: {
        ...(next as any).channels,
        feishu: {
          ...(next as any).channels?.feishu,
          enabled: true,
          ...(appId ? { appId } : {}),
          ...(appSecret ? { appSecret } : {}),
        },
      },
    } as ClawdbotConfig;

    return { cfg: next, accountId: DEFAULT_ACCOUNT_ID };
  },

  disable: (cfg) =>
    ({
      ...cfg,
      channels: {
        ...(cfg as any).channels,
        feishu: { ...(cfg as any).channels?.feishu, enabled: false },
      },
    }) as ClawdbotConfig,
};

// ========== Message Actions ==========

const feishuMessageActions: ChannelMessageActionAdapter = {
  listActions: () => [
    // 消息
    { action: "send", description: "发送消息", params: ["target", "message"] },
    { action: "send_card", description: "发送卡片消息", params: ["target", "card"] },
    { action: "send_image", description: "发送图片", params: ["target", "filePath"] },
    { action: "send_file", description: "发送文件", params: ["target", "filePath"] },
    // 消息 - 高级
    { action: "msg_forward", description: "转发消息", params: ["messageId", "targetChatId"] },
    {
      action: "msg_merge_forward",
      description: "合并转发多条消息",
      params: ["messageIds", "targetChatId"],
    },
    { action: "msg_urgent", description: "发送加急消息", params: ["messageId", "userIds"] },
    { action: "msg_read_users", description: "获取消息已读用户", params: ["messageId"] },
    // 聊天管理
    {
      action: "chat_create",
      description: "创建群聊",
      params: ["name", "description?", "userIds?"],
    },
    { action: "chat_get", description: "获取群聊信息", params: ["chatId"] },
    {
      action: "chat_update",
      description: "更新群聊信息",
      params: ["chatId", "name?", "description?"],
    },
    { action: "chat_delete", description: "解散群聊", params: ["chatId"] },
    { action: "chat_list", description: "获取群聊列表", params: [] },
    { action: "chat_search", description: "搜索群聊", params: ["query"] },
    // 聊天成员
    { action: "chat_members_add", description: "添加群成员", params: ["chatId", "userIds"] },
    { action: "chat_members_remove", description: "移除群成员", params: ["chatId", "userIds"] },
    { action: "chat_members_list", description: "获取群成员列表", params: ["chatId"] },
    {
      action: "chat_members_check",
      description: "判断用户是否在群中",
      params: ["chatId", "userId"],
    },
    // 群管理员
    { action: "chat_managers_add", description: "添加群管理员", params: ["chatId", "managerIds"] },
    {
      action: "chat_managers_remove",
      description: "移除群管理员",
      params: ["chatId", "managerIds"],
    },
    // 会话标签页
    {
      action: "chat_tab_create",
      description: "创建会话标签页",
      params: ["chatId", "tabName", "tabType", "url?", "doc?"],
    },
    { action: "chat_tab_list", description: "获取会话标签页列表", params: ["chatId"] },
    {
      action: "chat_tab_update",
      description: "更新会话标签页",
      params: ["chatId", "tabId", "tabName"],
    },
    { action: "chat_tab_delete", description: "删除会话标签页", params: ["chatId", "tabIds"] },
    // 置顶消息
    { action: "chat_top_notice_put", description: "置顶消息", params: ["chatId", "messageId"] },
    { action: "chat_top_notice_delete", description: "取消置顶消息", params: ["chatId"] },
    // 群公告
    { action: "chat_announcement_get", description: "获取群公告", params: ["chatId"] },
    {
      action: "chat_announcement_update",
      description: "更新群公告",
      params: ["chatId", "content", "revision"],
    },
    // 文档 - 基础
    { action: "doc_create", description: "创建云文档", params: ["title", "folderId?"] },
    { action: "doc_get", description: "获取文档信息", params: ["documentId"] },
    { action: "doc_read", description: "读取文档纯文本", params: ["documentId"] },
    { action: "doc_structure", description: "获取文档结构（块列表）", params: ["documentId"] },
    // 文档 - 内容操作
    { action: "doc_append", description: "追加文本到文档末尾", params: ["documentId", "content"] },
    {
      action: "doc_append_md",
      description: "追加 Markdown 到文档",
      params: ["documentId", "markdown"],
    },
    { action: "doc_prepend", description: "在文档开头插入内容", params: ["documentId", "content"] },
    {
      action: "doc_insert_after",
      description: "在指定块后插入内容",
      params: ["documentId", "blockId", "content"],
    },
    // 文档 - 块操作
    { action: "doc_block_get", description: "获取指定块内容", params: ["documentId", "blockId"] },
    {
      action: "doc_block_update",
      description: "更新块内容",
      params: ["documentId", "blockId", "text", "checked?"],
    },
    { action: "doc_block_delete", description: "删除指定块", params: ["documentId", "blockId"] },
    { action: "doc_blocks_delete", description: "批量删除块", params: ["documentId", "blockIds"] },
    // 云空间
    { action: "folder_create", description: "创建文件夹", params: ["name", "parentToken?"] },
    { action: "folder_list", description: "列出文件夹内容", params: ["folderToken"] },
    { action: "file_upload", description: "上传文件", params: ["filePath", "folderToken"] },
    { action: "file_download", description: "下载文件", params: ["fileToken", "savePath"] },
    { action: "file_search", description: "搜索文件", params: ["query"] },
    { action: "file_meta", description: "获取文件元数据", params: ["fileToken", "fileType"] },
    { action: "file_move", description: "移动文件", params: ["fileToken", "targetFolderToken"] },
    {
      action: "file_copy",
      description: "复制文件",
      params: ["fileToken", "targetFolderToken", "newName?"],
    },
    { action: "file_delete", description: "删除文件", params: ["fileToken"] },
    {
      action: "file_shortcut",
      description: "创建快捷方式",
      params: ["targetToken", "targetType", "parentFolderToken"],
    },
    { action: "file_batch_download_urls", description: "批量获取下载链接", params: ["fileTokens"] },
    {
      action: "file_transfer_owner",
      description: "转移文件所有权",
      params: ["fileToken", "fileType", "newOwnerId"],
    },
    // 多维表格 - 应用
    { action: "bitable_create", description: "创建多维表格", params: ["name", "folderId?"] },
    { action: "bitable_get", description: "获取多维表格信息", params: ["appToken"] },
    { action: "bitable_tables", description: "列出数据表", params: ["appToken"] },
    { action: "bitable_table_create", description: "创建数据表", params: ["appToken", "name"] },
    // 多维表格 - 字段
    { action: "bitable_fields", description: "列出字段", params: ["appToken", "tableId"] },
    {
      action: "bitable_field_create",
      description: "创建字段",
      params: ["appToken", "tableId", "fieldName", "fieldType"],
    },
    // 多维表格 - 记录
    {
      action: "bitable_records",
      description: "查询记录",
      params: ["appToken", "tableId", "pageSize?"],
    },
    {
      action: "bitable_record_get",
      description: "获取单条记录",
      params: ["appToken", "tableId", "recordId"],
    },
    {
      action: "bitable_record_create",
      description: "创建记录",
      params: ["appToken", "tableId", "fields"],
    },
    {
      action: "bitable_record_update",
      description: "更新记录",
      params: ["appToken", "tableId", "recordId", "fields"],
    },
    {
      action: "bitable_record_delete",
      description: "删除记录",
      params: ["appToken", "tableId", "recordId"],
    },
    {
      action: "bitable_records_delete",
      description: "批量删除记录",
      params: ["appToken", "tableId", "recordIds"],
    },
    // 多维表格 - 视图
    { action: "bitable_views", description: "列出视图", params: ["appToken", "tableId"] },
    {
      action: "bitable_view_get",
      description: "获取视图详情",
      params: ["appToken", "tableId", "viewId"],
    },
    {
      action: "bitable_view_create",
      description: "创建视图",
      params: ["appToken", "tableId", "viewName", "viewType?"],
    },
    {
      action: "bitable_view_delete",
      description: "删除视图",
      params: ["appToken", "tableId", "viewId"],
    },
    // 多维表格 - 角色
    { action: "bitable_roles", description: "列出角色", params: ["appToken"] },
    {
      action: "bitable_role_create",
      description: "创建角色",
      params: ["appToken", "roleName", "tablePerm?", "recPerm?"],
    },
    {
      action: "bitable_role_update",
      description: "更新角色",
      params: ["appToken", "roleId", "roleName?", "tablePerm?", "recPerm?"],
    },
    { action: "bitable_role_delete", description: "删除角色", params: ["appToken", "roleId"] },
    { action: "bitable_role_members", description: "列出角色成员", params: ["appToken", "roleId"] },
    {
      action: "bitable_role_member_add",
      description: "添加角色成员",
      params: ["appToken", "roleId", "memberId", "memberType?"],
    },
    {
      action: "bitable_role_member_remove",
      description: "移除角色成员",
      params: ["appToken", "roleId", "memberId", "memberType?"],
    },
    // 多维表格 - 自动化
    { action: "bitable_workflows", description: "列出自动化规则", params: ["appToken", "tableId"] },
    {
      action: "bitable_workflow_toggle",
      description: "启用/禁用自动化规则",
      params: ["appToken", "tableId", "workflowId", "enabled"],
    },
    // 电子表格 - 基础
    { action: "sheet_create", description: "创建电子表格", params: ["title", "folderId?"] },
    { action: "sheet_get", description: "获取电子表格信息", params: ["spreadsheetToken"] },
    { action: "sheet_list", description: "列出工作表", params: ["spreadsheetToken"] },
    {
      action: "sheet_info",
      description: "获取工作表信息",
      params: ["spreadsheetToken", "sheetId"],
    },
    // 电子表格 - 读写
    { action: "sheet_read", description: "读取单元格", params: ["spreadsheetToken", "range"] },
    {
      action: "sheet_write",
      description: "写入单元格",
      params: ["spreadsheetToken", "range", "values"],
    },
    {
      action: "sheet_append",
      description: "追加行数据",
      params: ["spreadsheetToken", "range", "values"],
    },
    // 电子表格 - 行列操作
    {
      action: "sheet_insert_rows",
      description: "插入行",
      params: ["spreadsheetToken", "sheetId", "startIndex", "count"],
    },
    {
      action: "sheet_delete_rows",
      description: "删除行",
      params: ["spreadsheetToken", "sheetId", "startIndex", "count"],
    },
    {
      action: "sheet_insert_cols",
      description: "插入列",
      params: ["spreadsheetToken", "sheetId", "startIndex", "count"],
    },
    {
      action: "sheet_delete_cols",
      description: "删除列",
      params: ["spreadsheetToken", "sheetId", "startIndex", "count"],
    },
    // 电子表格 - 样式
    {
      action: "sheet_style",
      description: "设置单元格样式",
      params: ["spreadsheetToken", "range", "style"],
    },
    {
      action: "sheet_merge",
      description: "合并单元格",
      params: ["spreadsheetToken", "range", "mergeType?"],
    },
    { action: "sheet_unmerge", description: "拆分单元格", params: ["spreadsheetToken", "range"] },
    // 电子表格 - 高级
    {
      action: "sheet_sort",
      description: "排序",
      params: ["spreadsheetToken", "sheetId", "range", "sortSpecs"],
    },
    {
      action: "sheet_freeze",
      description: "冻结行列",
      params: ["spreadsheetToken", "sheetId", "frozenRows", "frozenColumns"],
    },
    {
      action: "sheet_find_replace",
      description: "查找替换",
      params: ["spreadsheetToken", "sheetId", "find", "replace"],
    },
    {
      action: "sheet_filter_create",
      description: "创建筛选",
      params: ["spreadsheetToken", "sheetId", "range"],
    },
    {
      action: "sheet_filter_delete",
      description: "删除筛选",
      params: ["spreadsheetToken", "sheetId"],
    },
    {
      action: "sheet_col_width",
      description: "设置列宽",
      params: ["spreadsheetToken", "sheetId", "startCol", "endCol", "width"],
    },
    {
      action: "sheet_row_height",
      description: "设置行高",
      params: ["spreadsheetToken", "sheetId", "startRow", "endRow", "height"],
    },
    // 电子表格 - 工作表管理
    {
      action: "sheet_add",
      description: "添加工作表",
      params: ["spreadsheetToken", "title", "index?"],
    },
    { action: "sheet_delete", description: "删除工作表", params: ["spreadsheetToken", "sheetId"] },
    {
      action: "sheet_copy",
      description: "复制工作表",
      params: ["spreadsheetToken", "sourceSheetId", "targetTitle?"],
    },
    // 日历 - 基础
    { action: "cal_list", description: "列出日历", params: [] },
    { action: "cal_primary", description: "获取主日历", params: [] },
    { action: "cal_create", description: "创建日历", params: ["summary", "description?"] },
    // 日历 - 日程
    {
      action: "cal_events",
      description: "列出日程",
      params: ["calendarId", "startTime?", "endTime?"],
    },
    { action: "cal_event_get", description: "获取日程详情", params: ["calendarId", "eventId"] },
    {
      action: "cal_event_create",
      description: "创建日程",
      params: ["calendarId", "summary", "startTime", "endTime", "description?", "location?"],
    },
    {
      action: "cal_event_update",
      description: "更新日程",
      params: ["calendarId", "eventId", "summary?", "startTime?", "endTime?"],
    },
    { action: "cal_event_delete", description: "删除日程", params: ["calendarId", "eventId"] },
    { action: "cal_event_search", description: "搜索日程", params: ["calendarId", "query"] },
    // 日历 - 参与者
    { action: "cal_attendees", description: "获取日程参与者", params: ["calendarId", "eventId"] },
    {
      action: "cal_attendee_add",
      description: "添加参与者",
      params: ["calendarId", "eventId", "userIds"],
    },
    // 日历 - 忙闲
    {
      action: "cal_freebusy",
      description: "查询忙闲状态",
      params: ["userIds", "startTime", "endTime"],
    },
    // 日历 - 订阅
    { action: "cal_subscribe", description: "订阅日历", params: ["calendarId"] },
    { action: "cal_unsubscribe", description: "取消订阅日历", params: ["calendarId"] },
    // 日历 - 权限
    { action: "cal_acls", description: "获取日历访问控制列表", params: ["calendarId"] },
    {
      action: "cal_acl_add",
      description: "添加日历访问控制",
      params: ["calendarId", "userId", "role"],
    },
    { action: "cal_acl_remove", description: "删除日历访问控制", params: ["calendarId", "aclId"] },
    // 任务 - 基础
    { action: "task_create", description: "创建任务", params: ["summary", "due?", "description?"] },
    { action: "task_get", description: "获取任务详情", params: ["taskId"] },
    {
      action: "task_update",
      description: "更新任务",
      params: ["taskId", "summary?", "due?", "description?"],
    },
    { action: "task_delete", description: "删除任务", params: ["taskId"] },
    { action: "task_complete", description: "完成任务", params: ["taskId"] },
    { action: "task_uncomplete", description: "取消完成任务", params: ["taskId"] },
    { action: "task_list", description: "列出任务", params: ["tasklistId?", "completed?"] },
    // 任务列表
    { action: "tasklist_create", description: "创建任务列表", params: ["name"] },
    { action: "tasklist_get", description: "获取任务列表详情", params: ["tasklistId"] },
    { action: "tasklist_list", description: "列出所有任务列表", params: [] },
    { action: "tasklist_delete", description: "删除任务列表", params: ["tasklistId"] },
    {
      action: "tasklist_add_task",
      description: "将任务添加到列表",
      params: ["tasklistId", "taskId"],
    },
    {
      action: "tasklist_remove_task",
      description: "从列表移除任务",
      params: ["tasklistId", "taskId"],
    },
    // 任务提醒
    { action: "task_reminder_add", description: "添加任务提醒", params: ["taskId", "minutes"] },
    // 任务成员
    {
      action: "task_members_add",
      description: "添加任务成员",
      params: ["taskId", "memberIds", "memberRole?"],
    },
    {
      action: "task_members_remove",
      description: "移除任务成员",
      params: ["taskId", "memberIds", "memberRole?"],
    },
    // 任务依赖
    {
      action: "task_dependencies_add",
      description: "添加任务依赖",
      params: ["taskId", "dependencyTaskIds", "dependencyType?"],
    },
    {
      action: "task_dependencies_remove",
      description: "移除任务依赖",
      params: ["taskId", "dependencyTaskIds", "dependencyType?"],
    },
    // 任务附件
    { action: "task_attachments", description: "获取任务附件列表", params: ["taskId"] },
    { action: "task_attachment_get", description: "获取任务附件详情", params: ["attachmentId"] },
    { action: "task_attachment_delete", description: "删除任务附件", params: ["attachmentId"] },
    // 任务列表成员
    {
      action: "tasklist_members_add",
      description: "添加任务列表成员",
      params: ["tasklistId", "memberIds"],
    },
    {
      action: "tasklist_members_remove",
      description: "移除任务列表成员",
      params: ["tasklistId", "memberIds"],
    },
    // 知识库 - 空间
    { action: "wiki_spaces", description: "列出知识空间", params: [] },
    { action: "wiki_space_get", description: "获取知识空间详情", params: ["spaceId"] },
    {
      action: "wiki_space_create",
      description: "创建知识空间",
      params: ["name", "description?", "visibility?"],
    },
    // 知识库 - 节点
    { action: "wiki_nodes", description: "列出节点", params: ["spaceId", "parentNodeToken?"] },
    { action: "wiki_node_get", description: "获取节点详情", params: ["nodeToken"] },
    {
      action: "wiki_node_create",
      description: "创建节点",
      params: ["spaceId", "objType", "parentNodeToken?", "title?"],
    },
    {
      action: "wiki_node_rename",
      description: "重命名节点",
      params: ["spaceId", "nodeToken", "title"],
    },
    {
      action: "wiki_node_move",
      description: "移动节点",
      params: ["spaceId", "nodeToken", "targetParentToken?", "targetSpaceId?"],
    },
    {
      action: "wiki_node_copy",
      description: "复制节点",
      params: ["spaceId", "nodeToken", "targetParentToken?", "title?"],
    },
    // 知识库 - 成员
    { action: "wiki_members", description: "列出成员", params: ["spaceId"] },
    {
      action: "wiki_member_add",
      description: "添加成员",
      params: ["spaceId", "memberId", "memberType", "memberRole?"],
    },
    {
      action: "wiki_member_remove",
      description: "移除成员",
      params: ["spaceId", "memberId", "memberType"],
    },
    // 搜索
    {
      action: "search_messages",
      description: "搜索消息",
      params: ["query", "chatId?", "startTime?", "endTime?"],
    },
    { action: "search_docs", description: "搜索云文档", params: ["query", "docTypes?"] },
    { action: "search_files", description: "搜索云空间文件", params: ["query", "folderToken?"] },
    { action: "search_all", description: "综合搜索", params: ["query", "types?"] },
    // AI 能力
    { action: "ai_ocr", description: "图片文字识别", params: ["image"] },
    { action: "ai_speech_to_text", description: "语音转文字", params: ["audio", "format?"] },
    {
      action: "ai_translate",
      description: "翻译文本",
      params: ["text", "targetLang", "sourceLang?"],
    },
    { action: "ai_detect_language", description: "检测文本语言", params: ["text"] },
    { action: "ai_languages", description: "获取支持的语言列表", params: [] },
  ],

  extractToolSend: (ctx) => ({
    to: ctx.target,
    text: ctx.message,
  }),

  handleAction: async (ctx) => {
    const account = ctx.account as ResolvedFeishuAccount;
    if (!account?.appId) {
      return { ok: false, error: "Account not configured" };
    }

    const { action } = ctx;

    switch (action) {
      case "send":
        return sendTextMessage(account, ctx.target, ctx.message);

      case "send_card":
        try {
          const card = typeof ctx.card === "string" ? JSON.parse(ctx.card) : ctx.card;
          return sendCardMessage(account, ctx.target, card);
        } catch (e) {
          return { ok: false, error: `Invalid card JSON: ${e}` };
        }

      case "send_image":
        return sendImageMessage(account, ctx.target, ctx.filePath);

      case "send_file":
        return sendFileMessage(account, ctx.target, ctx.filePath, ctx.fileName);

      // 消息 - 高级
      case "msg_forward":
        return forwardMessage(account, ctx.messageId, ctx.targetChatId);

      case "msg_merge_forward": {
        const msgIds = Array.isArray(ctx.messageIds)
          ? ctx.messageIds
          : ctx.messageIds.split(",").map((id: string) => id.trim());
        return mergeForwardMessages(account, msgIds, ctx.targetChatId);
      }

      case "msg_urgent": {
        const userIds = Array.isArray(ctx.userIds)
          ? ctx.userIds
          : ctx.userIds.split(",").map((id: string) => id.trim());
        return sendUrgentMessage(account, ctx.messageId, userIds);
      }

      case "msg_read_users":
        return getMessageReadUsers(account, ctx.messageId);

      // 聊天管理
      case "chat_create":
        return createChat(account, ctx.name, {
          description: ctx.description,
          userIds: ctx.userIds
            ? Array.isArray(ctx.userIds)
              ? ctx.userIds
              : ctx.userIds.split(",").map((id: string) => id.trim())
            : undefined,
        });

      case "chat_get":
        return getChat(account, ctx.chatId);

      case "chat_update":
        return updateChat(account, ctx.chatId, {
          name: ctx.name,
          description: ctx.description,
        });

      case "chat_delete":
        return deleteChat(account, ctx.chatId);

      case "chat_list":
        return listChats(account);

      case "chat_search":
        return searchChats(account, ctx.query);

      case "chat_members_add": {
        const userIds = Array.isArray(ctx.userIds)
          ? ctx.userIds
          : ctx.userIds.split(",").map((id: string) => id.trim());
        return addChatMembers(account, ctx.chatId, userIds);
      }

      case "chat_members_remove": {
        const userIds = Array.isArray(ctx.userIds)
          ? ctx.userIds
          : ctx.userIds.split(",").map((id: string) => id.trim());
        return removeChatMembers(account, ctx.chatId, userIds);
      }

      case "chat_members_list":
        return getChatMembers(account, ctx.chatId);

      case "chat_members_check":
        return isUserInChat(account, ctx.chatId, ctx.userId);

      case "chat_managers_add": {
        const managerIds = Array.isArray(ctx.managerIds)
          ? ctx.managerIds
          : ctx.managerIds.split(",").map((id: string) => id.trim());
        return addChatManagers(account, ctx.chatId, managerIds);
      }

      case "chat_managers_remove": {
        const managerIds = Array.isArray(ctx.managerIds)
          ? ctx.managerIds
          : ctx.managerIds.split(",").map((id: string) => id.trim());
        return removeChatManagers(account, ctx.chatId, managerIds);
      }

      case "chat_tab_create":
        return createChatTab(account, ctx.chatId, ctx.tabName, ctx.tabType as any, {
          url: ctx.url,
          doc: ctx.doc,
        });

      case "chat_tab_list":
        return listChatTabs(account, ctx.chatId);

      case "chat_tab_update":
        return updateChatTab(account, ctx.chatId, ctx.tabId, ctx.tabName);

      case "chat_tab_delete": {
        const tabIds = Array.isArray(ctx.tabIds)
          ? ctx.tabIds
          : ctx.tabIds.split(",").map((id: string) => id.trim());
        return deleteChatTabs(account, ctx.chatId, tabIds);
      }

      case "chat_top_notice_put":
        return putTopNotice(account, ctx.chatId, ctx.messageId);

      case "chat_top_notice_delete":
        return deleteTopNotice(account, ctx.chatId);

      case "chat_announcement_get":
        return getChatAnnouncement(account, ctx.chatId);

      case "chat_announcement_update":
        return updateChatAnnouncement(account, ctx.chatId, ctx.content, ctx.revision);

      case "doc_create":
        return createDocument(account, ctx.title, ctx.folderId);

      case "doc_get":
        return getDocument(account, ctx.documentId);

      case "doc_read":
        return getDocumentContent(account, ctx.documentId);

      case "doc_structure":
        return getDocumentStructure(account, ctx.documentId);

      case "doc_append":
        return appendText(account, ctx.documentId, ctx.content);

      case "doc_append_md":
        return appendMarkdown(account, ctx.documentId, ctx.markdown);

      case "doc_prepend": {
        const lines = (ctx.content || "").split("\n");
        const blocks = lines.map((line: string) => ({
          blockType: "text" as const,
          text: line || " ",
        }));
        return prependDocumentBlocks(account, ctx.documentId, blocks);
      }

      case "doc_insert_after": {
        const lines = (ctx.content || "").split("\n");
        const blocks = lines.map((line: string) => ({
          blockType: "text" as const,
          text: line || " ",
        }));
        return insertBlocksAfter(account, ctx.documentId, ctx.blockId, blocks);
      }

      case "doc_block_get":
        return getBlock(account, ctx.documentId, ctx.blockId);

      case "doc_block_update":
        return updateBlock(account, ctx.documentId, ctx.blockId, {
          text: ctx.text,
          checked: ctx.checked,
        });

      case "doc_block_delete":
        return deleteBlock(account, ctx.documentId, ctx.blockId);

      case "doc_blocks_delete": {
        const blockIds = Array.isArray(ctx.blockIds)
          ? ctx.blockIds
          : (ctx.blockIds || "").split(",").map((id: string) => id.trim());
        return deleteBlocks(account, ctx.documentId, blockIds);
      }

      case "folder_create":
        return createFolder(account, ctx.name, ctx.parentToken);

      case "folder_list":
        return listFiles(account, ctx.folderToken);

      case "file_upload":
        return uploadFile(account, ctx.filePath, ctx.folderToken, ctx.fileName);

      case "file_download":
        return downloadFile(account, ctx.fileToken, ctx.savePath);

      case "file_search":
        return searchFiles(account, ctx.query);

      case "file_meta":
        return getFileMeta(account, ctx.fileToken, ctx.fileType as any);

      case "file_move":
        return moveFile(account, ctx.fileToken, ctx.targetFolderToken);

      case "file_copy":
        return copyFile(account, ctx.fileToken, ctx.targetFolderToken, ctx.newName);

      case "file_delete":
        return deleteFile(account, ctx.fileToken);

      case "file_shortcut":
        return createShortcut(
          account,
          ctx.targetToken,
          ctx.targetType as any,
          ctx.parentFolderToken
        );

      case "file_batch_download_urls": {
        const tokens = Array.isArray(ctx.fileTokens)
          ? ctx.fileTokens
          : ctx.fileTokens.split(",").map((t: string) => t.trim());
        return getBatchDownloadUrls(account, tokens);
      }

      case "file_transfer_owner":
        return transferFileOwner(account, ctx.fileToken, ctx.fileType as any, ctx.newOwnerId);

      // 多维表格 - 应用
      case "bitable_create":
        return createBitableApp(account, ctx.name, ctx.folderId);

      case "bitable_get":
        return getBitableApp(account, ctx.appToken);

      case "bitable_tables":
        return listBitableTables(account, ctx.appToken);

      case "bitable_table_create":
        return createBitableTable(account, ctx.appToken, ctx.name);

      // 多维表格 - 字段
      case "bitable_fields":
        return listBitableFields(account, ctx.appToken, ctx.tableId);

      case "bitable_field_create":
        return createBitableField(
          account,
          ctx.appToken,
          ctx.tableId,
          ctx.fieldName,
          parseInt(ctx.fieldType, 10) || 1
        );

      // 多维表格 - 记录
      case "bitable_records":
        return listBitableRecords(account, ctx.appToken, ctx.tableId, {
          pageSize: ctx.pageSize ? parseInt(ctx.pageSize, 10) : undefined,
        });

      case "bitable_record_get":
        return getBitableRecord(account, ctx.appToken, ctx.tableId, ctx.recordId);

      case "bitable_record_create": {
        const fields = typeof ctx.fields === "string" ? JSON.parse(ctx.fields) : ctx.fields;
        return createBitableRecord(account, ctx.appToken, ctx.tableId, fields);
      }

      case "bitable_record_update": {
        const fields = typeof ctx.fields === "string" ? JSON.parse(ctx.fields) : ctx.fields;
        return updateBitableRecord(account, ctx.appToken, ctx.tableId, ctx.recordId, fields);
      }

      case "bitable_record_delete":
        return deleteBitableRecord(account, ctx.appToken, ctx.tableId, ctx.recordId);

      case "bitable_records_delete": {
        const recordIds = Array.isArray(ctx.recordIds)
          ? ctx.recordIds
          : (ctx.recordIds || "").split(",").map((id: string) => id.trim());
        return deleteBitableRecords(account, ctx.appToken, ctx.tableId, recordIds);
      }

      // 多维表格 - 视图
      case "bitable_views":
        return listBitableViews(account, ctx.appToken, ctx.tableId);

      case "bitable_view_get":
        return getBitableView(account, ctx.appToken, ctx.tableId, ctx.viewId);

      case "bitable_view_create":
        return createBitableView(
          account,
          ctx.appToken,
          ctx.tableId,
          ctx.viewName,
          ctx.viewType as any
        );

      case "bitable_view_delete":
        return deleteBitableView(account, ctx.appToken, ctx.tableId, ctx.viewId);

      // 多维表格 - 角色
      case "bitable_roles":
        return listBitableRoles(account, ctx.appToken);

      case "bitable_role_create":
        return createBitableRole(account, ctx.appToken, ctx.roleName, {
          tablePerm: ctx.tablePerm ? parseInt(ctx.tablePerm, 10) : undefined,
          recPerm: ctx.recPerm ? parseInt(ctx.recPerm, 10) : undefined,
        });

      case "bitable_role_update":
        return updateBitableRole(account, ctx.appToken, ctx.roleId, {
          roleName: ctx.roleName,
          tablePerm: ctx.tablePerm ? parseInt(ctx.tablePerm, 10) : undefined,
          recPerm: ctx.recPerm ? parseInt(ctx.recPerm, 10) : undefined,
        });

      case "bitable_role_delete":
        return deleteBitableRole(account, ctx.appToken, ctx.roleId);

      case "bitable_role_members":
        return listBitableRoleMembers(account, ctx.appToken, ctx.roleId);

      case "bitable_role_member_add":
        return addBitableRoleMember(
          account,
          ctx.appToken,
          ctx.roleId,
          ctx.memberId,
          ctx.memberType as any
        );

      case "bitable_role_member_remove":
        return removeBitableRoleMember(
          account,
          ctx.appToken,
          ctx.roleId,
          ctx.memberId,
          ctx.memberType as any
        );

      // 多维表格 - 自动化
      case "bitable_workflows":
        return listBitableWorkflows(account, ctx.appToken, ctx.tableId);

      case "bitable_workflow_toggle":
        return toggleBitableWorkflow(
          account,
          ctx.appToken,
          ctx.tableId,
          ctx.workflowId,
          ctx.enabled === "true" || ctx.enabled === true
        );

      // 电子表格 - 基础
      case "sheet_create":
        return createSpreadsheet(account, ctx.title, ctx.folderId);

      case "sheet_get":
        return getSpreadsheet(account, ctx.spreadsheetToken);

      case "sheet_list":
        return listSheets(account, ctx.spreadsheetToken);

      case "sheet_info":
        return getSheet(account, ctx.spreadsheetToken, ctx.sheetId);

      // 电子表格 - 读写
      case "sheet_read":
        return readRange(account, ctx.spreadsheetToken, ctx.range);

      case "sheet_write": {
        const values = typeof ctx.values === "string" ? JSON.parse(ctx.values) : ctx.values;
        return writeRange(account, ctx.spreadsheetToken, ctx.range, values);
      }

      case "sheet_append": {
        const values = typeof ctx.values === "string" ? JSON.parse(ctx.values) : ctx.values;
        return appendRows(account, ctx.spreadsheetToken, ctx.range, values);
      }

      // 电子表格 - 行列操作
      case "sheet_insert_rows":
        return insertRows(
          account,
          ctx.spreadsheetToken,
          ctx.sheetId,
          parseInt(ctx.startIndex, 10) || 0,
          parseInt(ctx.count, 10) || 1
        );

      case "sheet_delete_rows":
        return deleteRows(
          account,
          ctx.spreadsheetToken,
          ctx.sheetId,
          parseInt(ctx.startIndex, 10) || 0,
          parseInt(ctx.count, 10) || 1
        );

      case "sheet_insert_cols":
        return insertColumns(
          account,
          ctx.spreadsheetToken,
          ctx.sheetId,
          parseInt(ctx.startIndex, 10) || 0,
          parseInt(ctx.count, 10) || 1
        );

      case "sheet_delete_cols":
        return deleteColumns(
          account,
          ctx.spreadsheetToken,
          ctx.sheetId,
          parseInt(ctx.startIndex, 10) || 0,
          parseInt(ctx.count, 10) || 1
        );

      // 电子表格 - 样式
      case "sheet_style": {
        const style = typeof ctx.style === "string" ? JSON.parse(ctx.style) : ctx.style;
        return setCellStyle(account, ctx.spreadsheetToken, ctx.range, style);
      }

      case "sheet_merge":
        return mergeCells(account, ctx.spreadsheetToken, ctx.range, ctx.mergeType || "MERGE_ALL");

      case "sheet_unmerge":
        return unmergeCells(account, ctx.spreadsheetToken, ctx.range);

      // 电子表格 - 高级
      case "sheet_sort": {
        const sortSpecs =
          typeof ctx.sortSpecs === "string" ? JSON.parse(ctx.sortSpecs) : ctx.sortSpecs;
        return sortRange(account, ctx.spreadsheetToken, ctx.sheetId, ctx.range, sortSpecs);
      }

      case "sheet_freeze":
        return freezeRowsAndColumns(
          account,
          ctx.spreadsheetToken,
          ctx.sheetId,
          parseInt(ctx.frozenRows, 10) || 0,
          parseInt(ctx.frozenColumns, 10) || 0
        );

      case "sheet_find_replace":
        return findReplace(account, ctx.spreadsheetToken, ctx.sheetId, ctx.find, ctx.replace);

      case "sheet_filter_create":
        return createFilter(account, ctx.spreadsheetToken, ctx.sheetId, ctx.range);

      case "sheet_filter_delete":
        return deleteFilter(account, ctx.spreadsheetToken, ctx.sheetId);

      case "sheet_col_width":
        return setColumnWidth(
          account,
          ctx.spreadsheetToken,
          ctx.sheetId,
          parseInt(ctx.startCol, 10) || 0,
          parseInt(ctx.endCol, 10) || 1,
          parseInt(ctx.width, 10) || 100
        );

      case "sheet_row_height":
        return setRowHeight(
          account,
          ctx.spreadsheetToken,
          ctx.sheetId,
          parseInt(ctx.startRow, 10) || 0,
          parseInt(ctx.endRow, 10) || 1,
          parseInt(ctx.height, 10) || 20
        );

      // 电子表格 - 工作表管理
      case "sheet_add":
        return addSheet(
          account,
          ctx.spreadsheetToken,
          ctx.title,
          ctx.index ? parseInt(ctx.index, 10) : undefined
        );

      case "sheet_delete":
        return deleteSheet(account, ctx.spreadsheetToken, ctx.sheetId);

      case "sheet_copy":
        return copySheet(account, ctx.spreadsheetToken, ctx.sourceSheetId, ctx.targetTitle);

      // 日历 - 基础
      case "cal_list":
        return listCalendars(account);

      case "cal_primary":
        return getPrimaryCalendar(account);

      case "cal_create":
        return createCalendar(account, ctx.summary, ctx.description);

      // 日历 - 日程
      case "cal_events": {
        const startTime = ctx.startTime
          ? parseTimeString(ctx.startTime) || parseInt(ctx.startTime, 10)
          : undefined;
        const endTime = ctx.endTime
          ? parseTimeString(ctx.endTime) || parseInt(ctx.endTime, 10)
          : undefined;
        return listEvents(account, ctx.calendarId, { startTime, endTime });
      }

      case "cal_event_get":
        return getEvent(account, ctx.calendarId, ctx.eventId);

      case "cal_event_create": {
        const startTime = parseTimeString(ctx.startTime) || parseInt(ctx.startTime, 10);
        const endTime = parseTimeString(ctx.endTime) || parseInt(ctx.endTime, 10);
        return createEvent(account, ctx.calendarId, {
          summary: ctx.summary,
          description: ctx.description,
          startTime,
          endTime,
          location: ctx.location,
        });
      }

      case "cal_event_update": {
        const params: any = {};
        if (ctx.summary) params.summary = ctx.summary;
        if (ctx.description) params.description = ctx.description;
        if (ctx.startTime)
          params.startTime = parseTimeString(ctx.startTime) || parseInt(ctx.startTime, 10);
        if (ctx.endTime) params.endTime = parseTimeString(ctx.endTime) || parseInt(ctx.endTime, 10);
        if (ctx.location) params.location = ctx.location;
        return updateEvent(account, ctx.calendarId, ctx.eventId, params);
      }

      case "cal_event_delete":
        return deleteEvent(account, ctx.calendarId, ctx.eventId);

      case "cal_event_search":
        return searchEvents(account, ctx.calendarId, ctx.query);

      // 日历 - 参与者
      case "cal_attendees":
        return listAttendees(account, ctx.calendarId, ctx.eventId);

      case "cal_attendee_add": {
        const userIds = Array.isArray(ctx.userIds)
          ? ctx.userIds
          : (ctx.userIds || "").split(",").map((id: string) => id.trim());
        return addAttendees(
          account,
          ctx.calendarId,
          ctx.eventId,
          userIds.map((userId: string) => ({ userId }))
        );
      }

      // 日历 - 忙闲
      case "cal_freebusy": {
        const userIds = Array.isArray(ctx.userIds)
          ? ctx.userIds
          : (ctx.userIds || "").split(",").map((id: string) => id.trim());
        const startTime = parseTimeString(ctx.startTime) || parseInt(ctx.startTime, 10);
        const endTime = parseTimeString(ctx.endTime) || parseInt(ctx.endTime, 10);
        return queryFreeBusy(account, userIds, startTime, endTime);
      }

      // 日历 - 订阅
      case "cal_subscribe":
        return subscribeCalendar(account, ctx.calendarId);

      case "cal_unsubscribe":
        return unsubscribeCalendar(account, ctx.calendarId);

      // 日历 - 权限
      case "cal_acls":
        return listCalendarAcls(account, ctx.calendarId);

      case "cal_acl_add":
        return addCalendarAcl(account, ctx.calendarId, ctx.userId, ctx.role as any);

      case "cal_acl_remove":
        return removeCalendarAcl(account, ctx.calendarId, ctx.aclId);

      // 任务 - 基础
      case "task_create": {
        const due = ctx.due ? parseDueString(ctx.due) || parseInt(ctx.due, 10) : undefined;
        return createTask(account, {
          summary: ctx.summary,
          description: ctx.description,
          due,
        });
      }

      case "task_get":
        return getTask(account, ctx.taskId);

      case "task_update": {
        const params: any = {};
        if (ctx.summary) params.summary = ctx.summary;
        if (ctx.description) params.description = ctx.description;
        if (ctx.due) params.due = parseDueString(ctx.due) || parseInt(ctx.due, 10);
        return updateTask(account, ctx.taskId, params);
      }

      case "task_delete":
        return deleteTask(account, ctx.taskId);

      case "task_complete":
        return completeTask(account, ctx.taskId);

      case "task_uncomplete":
        return uncompleteTask(account, ctx.taskId);

      case "task_list": {
        const completed =
          ctx.completed === "true" ? true : ctx.completed === "false" ? false : undefined;
        return listTasks(account, { tasklistId: ctx.tasklistId, completed });
      }

      // 任务列表
      case "tasklist_create":
        return createTaskList(account, ctx.name);

      case "tasklist_get":
        return getTaskList(account, ctx.tasklistId);

      case "tasklist_list":
        return listTaskLists(account);

      case "tasklist_delete":
        return deleteTaskList(account, ctx.tasklistId);

      case "tasklist_add_task":
        return addTaskToList(account, ctx.tasklistId, ctx.taskId);

      case "tasklist_remove_task":
        return removeTaskFromList(account, ctx.tasklistId, ctx.taskId);

      // 任务提醒
      case "task_reminder_add":
        return addTaskReminder(account, ctx.taskId, parseInt(ctx.minutes, 10) || 30);

      // 任务成员
      case "task_members_add": {
        const memberIds = Array.isArray(ctx.memberIds)
          ? ctx.memberIds
          : ctx.memberIds.split(",").map((id: string) => id.trim());
        return addTaskMembers(account, ctx.taskId, memberIds, ctx.memberRole as any);
      }

      case "task_members_remove": {
        const memberIds = Array.isArray(ctx.memberIds)
          ? ctx.memberIds
          : ctx.memberIds.split(",").map((id: string) => id.trim());
        return removeTaskMembers(account, ctx.taskId, memberIds, ctx.memberRole as any);
      }

      // 任务依赖
      case "task_dependencies_add": {
        const depIds = Array.isArray(ctx.dependencyTaskIds)
          ? ctx.dependencyTaskIds
          : ctx.dependencyTaskIds.split(",").map((id: string) => id.trim());
        return addTaskDependencies(account, ctx.taskId, depIds, ctx.dependencyType as any);
      }

      case "task_dependencies_remove": {
        const depIds = Array.isArray(ctx.dependencyTaskIds)
          ? ctx.dependencyTaskIds
          : ctx.dependencyTaskIds.split(",").map((id: string) => id.trim());
        return removeTaskDependencies(account, ctx.taskId, depIds, ctx.dependencyType as any);
      }

      // 任务附件
      case "task_attachments":
        return listTaskAttachments(account, ctx.taskId);

      case "task_attachment_get":
        return getTaskAttachment(account, ctx.attachmentId);

      case "task_attachment_delete":
        return deleteTaskAttachment(account, ctx.attachmentId);

      // 任务列表成员
      case "tasklist_members_add": {
        const memberIds = Array.isArray(ctx.memberIds)
          ? ctx.memberIds
          : ctx.memberIds.split(",").map((id: string) => id.trim());
        return addTaskListMembers(account, ctx.tasklistId, memberIds);
      }

      case "tasklist_members_remove": {
        const memberIds = Array.isArray(ctx.memberIds)
          ? ctx.memberIds
          : ctx.memberIds.split(",").map((id: string) => id.trim());
        return removeTaskListMembers(account, ctx.tasklistId, memberIds);
      }

      // 知识库 - 空间
      case "wiki_spaces":
        return listWikiSpaces(account);

      case "wiki_space_get":
        return getWikiSpace(account, ctx.spaceId);

      case "wiki_space_create":
        return createWikiSpace(account, ctx.name, {
          description: ctx.description,
          visibility: ctx.visibility as any,
        });

      // 知识库 - 节点
      case "wiki_nodes":
        return listWikiNodes(account, ctx.spaceId, {
          parentNodeToken: ctx.parentNodeToken,
        });

      case "wiki_node_get":
        return getWikiNode(account, ctx.nodeToken);

      case "wiki_node_create":
        return createWikiNode(account, ctx.spaceId, {
          objType: ctx.objType as any,
          parentNodeToken: ctx.parentNodeToken,
          title: ctx.title,
        });

      case "wiki_node_rename":
        return updateWikiNodeTitle(account, ctx.spaceId, ctx.nodeToken, ctx.title);

      case "wiki_node_move":
        return moveWikiNode(
          account,
          ctx.spaceId,
          ctx.nodeToken,
          ctx.targetParentToken,
          ctx.targetSpaceId
        );

      case "wiki_node_copy":
        return copyWikiNode(
          account,
          ctx.spaceId,
          ctx.nodeToken,
          ctx.targetParentToken,
          undefined,
          ctx.title
        );

      // 知识库 - 成员
      case "wiki_members":
        return listWikiMembers(account, ctx.spaceId);

      case "wiki_member_add":
        return addWikiMember(
          account,
          ctx.spaceId,
          ctx.memberId,
          ctx.memberType as any,
          (ctx.memberRole as any) || "member"
        );

      case "wiki_member_remove":
        return removeWikiMember(account, ctx.spaceId, ctx.memberId, ctx.memberType as any);

      // 搜索
      case "search_messages": {
        const filter: any = {};
        if (ctx.chatId) filter.chatIds = [ctx.chatId];
        if (ctx.startTime)
          filter.startTime = parseTimeString(ctx.startTime) || parseInt(ctx.startTime, 10);
        if (ctx.endTime) filter.endTime = parseTimeString(ctx.endTime) || parseInt(ctx.endTime, 10);
        return searchMessages(account, ctx.query, { filter });
      }

      case "search_docs": {
        const filter: any = {};
        if (ctx.docTypes) {
          filter.docTypes = Array.isArray(ctx.docTypes)
            ? ctx.docTypes
            : ctx.docTypes.split(",").map((t: string) => t.trim());
        }
        return searchDocs(account, ctx.query, { filter });
      }

      case "search_files":
        return searchDriveFiles(account, ctx.query, {
          folderToken: ctx.folderToken,
        });

      case "search_all": {
        const types = ctx.types
          ? Array.isArray(ctx.types)
            ? ctx.types
            : ctx.types.split(",").map((t: string) => t.trim())
          : ["message", "doc"];
        return universalSearch(account, ctx.query, {
          searchTypes: types as any,
        });
      }

      // AI 能力
      case "ai_ocr":
        return recognizeImage(account, ctx.image);

      case "ai_speech_to_text":
        return speechToText(account, ctx.audio, {
          format: ctx.format as any,
        });

      case "ai_translate":
        return translateText(
          account,
          ctx.text,
          ctx.targetLang as LanguageCode,
          ctx.sourceLang as LanguageCode | undefined
        );

      case "ai_detect_language":
        return detectLanguage(account, ctx.text);

      case "ai_languages":
        return { ok: true, data: { languages: getSupportedLanguages() } };

      default:
        return { ok: false, error: `Unknown action: ${action}` };
    }
  },
};

// ========== Channel Plugin ==========

export const feishuPlugin: ChannelPlugin<ResolvedFeishuAccount> = {
  id: "feishu",

  meta: {
    id: "feishu",
    label: "Feishu",
    selectionLabel: "飞书 (消息/文档/云空间)",
    docsPath: "https://github.com/gcmsg/openclaw-feishu",
    blurb: "飞书通道插件 - 支持消息、云文档、云空间操作",
  },

  capabilities: {
    chatTypes: ["direct", "group"],
    reactions: false,
    reply: true,
    media: true,
  },

  onboarding: feishuOnboardingAdapter,
  actions: feishuMessageActions,

  config: {
    listAccountIds: (cfg) => listFeishuAccountIds(cfg),
    resolveAccount: (cfg, accountId) => resolveFeishuAccount(cfg, accountId),
    isConfigured: async (account) => !!(account.appId && account.appSecret),
  },

  outbound: {
    deliveryMode: "gateway",
    textChunkLimit: 4000,

    sendText: async (ctx) => {
      const account = ctx.account as ResolvedFeishuAccount;
      const result = await sendTextMessage(account, ctx.to, ctx.text);
      return { ok: result.ok, error: result.error ? new Error(result.error) : undefined };
    },

    sendMedia: async (ctx) => {
      const account = ctx.account as ResolvedFeishuAccount;
      const mediaUrl = ctx.mediaUrl;

      if (mediaUrl && !mediaUrl.startsWith("http")) {
        const ext = mediaUrl.toLowerCase().split(".").pop();
        const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext || "");

        if (isImage) {
          const result = await sendImageMessage(account, ctx.to, mediaUrl);
          return { ok: result.ok, error: result.error ? new Error(result.error) : undefined };
        } else {
          const result = await sendFileMessage(account, ctx.to, mediaUrl);
          return { ok: result.ok, error: result.error ? new Error(result.error) : undefined };
        }
      }

      const text = ctx.text ? `${ctx.text}\n${mediaUrl}` : mediaUrl || "";
      const result = await sendTextMessage(account, ctx.to, text);
      return { ok: result.ok, error: result.error ? new Error(result.error) : undefined };
    },
  },

  gateway: {
    startAccount: async (ctx) => {
      const runtime = getFeishuRuntime();
      const account = ctx.account;
      const cfg = ctx.cfg;

      startGateway({
        account,
        abortSignal: ctx.abortSignal,
        onMessage: async (message) => {
          const logger = {
            info: (msg: string) => console.info(`[feishu-plus:${account.accountId}] ${msg}`),
            error: (msg: string) => console.error(`[feishu-plus:${account.accountId}] ${msg}`),
          };

          let bodyText = "";
          const mediaUrls: string[] = [];

          // 处理不同类型的消息
          switch (message.messageType) {
            case "text":
              bodyText = message.text || "";
              logger.info(`收到文本消息: ${bodyText}`);
              break;

            case "image":
              if (message.imageKey) {
                logger.info(`收到图片消息: ${message.imageKey}`);
                try {
                  const imgResult = await downloadImageByKey(account, message.imageKey);
                  if (imgResult.ok && imgResult.data) {
                    const filePath = await saveMediaToTemp(
                      imgResult.data.buffer,
                      "png",
                      "feishu_img"
                    );
                    mediaUrls.push(filePath);
                    bodyText = "[图片]";
                    logger.info(`图片已下载: ${filePath}`);
                  } else {
                    logger.error(`下载图片失败: ${imgResult.error}`);
                    bodyText = "[图片下载失败]";
                  }
                } catch (err) {
                  logger.error(`下载图片异常: ${err}`);
                  bodyText = "[图片]";
                }
              }
              break;

            case "file":
              if (message.fileKey) {
                const fileName = message.fileName || "file";
                logger.info(`收到文件消息: ${fileName}`);
                try {
                  const fileResult = await downloadMessageFile(
                    account,
                    message.messageId,
                    message.fileKey
                  );
                  if (fileResult.ok && fileResult.data) {
                    const ext = path.extname(fileName) || ".bin";
                    const filePath = await saveMediaToTemp(
                      fileResult.data.buffer,
                      ext.slice(1),
                      "feishu_file"
                    );
                    mediaUrls.push(filePath);
                    bodyText = `[文件: ${fileName}]`;
                    logger.info(`文件已下载: ${filePath}`);
                  } else {
                    logger.error(`下载文件失败: ${fileResult.error}`);
                    bodyText = `[文件: ${fileName}]`;
                  }
                } catch (err) {
                  logger.error(`下载文件异常: ${err}`);
                  bodyText = `[文件: ${fileName}]`;
                }
              }
              break;

            case "audio":
              if (message.audioRecognition) {
                // 飞书提供了语音转文字结果
                bodyText = message.audioRecognition;
                const durationSec = message.audioDuration
                  ? (message.audioDuration / 1000).toFixed(1)
                  : "?";
                logger.info(`收到语音消息 (${durationSec}s): ${bodyText.slice(0, 50)}...`);
              } else {
                // 没有转写结果，提示用户
                const durationSec = message.audioDuration
                  ? (message.audioDuration / 1000).toFixed(1)
                  : "?";
                bodyText = `[语音消息 ${durationSec}s - 无法识别，请开启语音识别权限]`;
                logger.info(`收到语音消息 (${durationSec}s)，无转写结果`);
              }
              break;

            case "media":
              bodyText = "[视频消息 - 暂不支持]";
              logger.info("收到视频消息（暂不支持）");
              break;

            case "sticker":
              bodyText = "[表情包]";
              logger.info("收到表情包消息");
              break;

            case "post":
              // 富文本消息，尝试提取纯文本
              try {
                const postContent = JSON.parse(message.content);
                const extractText = (node: any): string => {
                  if (typeof node === "string") return node;
                  if (node.text) return node.text;
                  if (Array.isArray(node)) return node.map(extractText).join("");
                  if (node.content) return extractText(node.content);
                  return "";
                };
                bodyText = extractText(postContent);
                logger.info(`收到富文本消息: ${bodyText.slice(0, 100)}...`);
              } catch {
                bodyText = "[富文本消息]";
              }
              break;

            case "share_card":
              bodyText = "[分享卡片]";
              logger.info("收到分享卡片消息");
              break;

            case "share_user":
              bodyText = "[用户名片]";
              logger.info("收到用户名片消息");
              break;

            default:
              bodyText = `[未知消息类型: ${message.messageType}]`;
              logger.info(`收到未知类型消息: ${message.messageType}`);
          }

          // 如果没有任何内容，跳过
          if (!bodyText && mediaUrls.length === 0) {
            return;
          }

          // 如果有引用消息，把引用内容加到正文前面
          if (message.quotedText) {
            bodyText = `[引用: ${message.quotedText}]\n\n${bodyText}`;
            logger.info(`包含引用消息: ${message.quotedText.slice(0, 50)}...`);
          }

          const msgCtx: MsgContext = {
            From: message.senderId,
            Body: bodyText,
            AccountId: account.accountId,
            Provider: "feishu",
            Surface: "feishu",
            SessionKey: `feishu:${account.accountId}:${message.chatId}`,
            To: message.chatId,
            ChatType: message.chatType === "p2p" ? "direct" : "group",
            MessageId: message.messageId,
            ReplyToId: message.parentId,
            Mentions: message.mentions?.map((m) => m.name),
            MediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
          };

          await runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher({
            ctx: msgCtx,
            cfg,
            dispatcherOptions: {
              deliver: async (payload) => {
                const text = payload.text ?? "";
                if (text) {
                  // 自动检测 Markdown，转换为飞书富文本
                  await sendSmartMessage(account, message.chatId, text);
                }
              },
            },
          });
        },
        logger: {
          info: (msg) => console.info(`[feishu:${account.accountId}] ${msg}`),
          error: (msg) => console.error(`[feishu:${account.accountId}] ${msg}`),
        },
      });
    },
  },
};
