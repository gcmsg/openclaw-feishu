/**
 * 飞书专属 Agent 工具
 *
 * 通过 agentTools 注册，提供飞书特有的功能：
 * - 卡片消息
 * - 云文档操作
 * - 多维表格
 * - 电子表格
 * - 日历/任务
 * - 知识库
 * - 审批流程
 * - 通讯录
 * - 邮件
 * - AI 能力
 */

import { Type, type TSchema } from "@sinclair/typebox";
import type { ResolvedFeishuAccount, FeishuChannelConfig } from "./types.js";

// ========== Action 定义 ==========

/**
 * 飞书专属 action 列表（不包含基础的 send，那个走 message 工具）
 */
export const FEISHU_ACTIONS = [
  // 消息 - 高级
  "send_card",
  "send_image",
  "send_file",
  "msg_forward",
  "msg_merge_forward",
  "msg_urgent",
  "msg_read_users",
  // 聊天管理
  "chat_create",
  "chat_get",
  "chat_update",
  "chat_delete",
  "chat_list",
  "chat_search",
  "chat_members_add",
  "chat_members_remove",
  "chat_members_list",
  "chat_members_check",
  "chat_managers_add",
  "chat_managers_remove",
  "chat_tab_create",
  "chat_tab_list",
  "chat_tab_update",
  "chat_tab_delete",
  "chat_top_notice_put",
  "chat_top_notice_delete",
  "chat_announcement_get",
  "chat_announcement_update",
  // 云文档
  "doc_create",
  "doc_get",
  "doc_read",
  "doc_structure",
  "doc_append",
  "doc_append_md",
  "doc_prepend",
  "doc_insert_after",
  "doc_block_get",
  "doc_block_update",
  "doc_block_delete",
  "doc_blocks_delete",
  // 云空间
  "folder_create",
  "folder_list",
  "file_upload",
  "file_download",
  "file_search",
  "file_meta",
  "file_move",
  "file_copy",
  "file_delete",
  "file_shortcut",
  "file_batch_download_urls",
  "file_transfer_owner",
  // 多维表格 - 应用
  "bitable_create",
  "bitable_get",
  "bitable_tables",
  "bitable_table_create",
  // 多维表格 - 字段
  "bitable_fields",
  "bitable_field_create",
  // 多维表格 - 记录
  "bitable_records",
  "bitable_record_get",
  "bitable_record_create",
  "bitable_record_update",
  "bitable_record_delete",
  "bitable_records_delete",
  // 多维表格 - 视图
  "bitable_views",
  "bitable_view_get",
  "bitable_view_create",
  "bitable_view_delete",
  // 多维表格 - 角色
  "bitable_roles",
  "bitable_role_create",
  "bitable_role_update",
  "bitable_role_delete",
  "bitable_role_members",
  "bitable_role_member_add",
  "bitable_role_member_remove",
  // 多维表格 - 自动化
  "bitable_workflows",
  "bitable_workflow_toggle",
  // 电子表格
  "sheet_create",
  "sheet_get",
  "sheet_list",
  "sheet_info",
  "sheet_read",
  "sheet_write",
  "sheet_append",
  "sheet_insert_rows",
  "sheet_delete_rows",
  "sheet_insert_cols",
  "sheet_delete_cols",
  "sheet_style",
  "sheet_merge",
  "sheet_unmerge",
  "sheet_sort",
  "sheet_freeze",
  "sheet_find_replace",
  "sheet_filter_create",
  "sheet_filter_delete",
  "sheet_col_width",
  "sheet_row_height",
  "sheet_add",
  "sheet_delete",
  "sheet_copy",
  // 日历
  "cal_list",
  "cal_primary",
  "cal_create",
  "cal_events",
  "cal_event_get",
  "cal_event_create",
  "cal_event_update",
  "cal_event_delete",
  "cal_event_search",
  "cal_attendees",
  "cal_attendee_add",
  "cal_freebusy",
  "cal_subscribe",
  "cal_unsubscribe",
  "cal_acls",
  "cal_acl_add",
  "cal_acl_remove",
  // 任务
  "task_create",
  "task_get",
  "task_update",
  "task_delete",
  "task_complete",
  "task_uncomplete",
  "task_list",
  "tasklist_create",
  "tasklist_get",
  "tasklist_list",
  "tasklist_delete",
  "tasklist_add_task",
  "tasklist_remove_task",
  "task_reminder_add",
  "task_members_add",
  "task_members_remove",
  "task_dependencies_add",
  "task_dependencies_remove",
  "task_attachments",
  "task_attachment_get",
  "task_attachment_delete",
  "tasklist_members_add",
  "tasklist_members_remove",
  // 知识库
  "wiki_spaces",
  "wiki_space_get",
  "wiki_space_create",
  "wiki_nodes",
  "wiki_node_get",
  "wiki_node_create",
  "wiki_node_rename",
  "wiki_node_move",
  "wiki_node_copy",
  "wiki_members",
  "wiki_member_add",
  "wiki_member_remove",
  // 搜索
  "search_messages",
  "search_docs",
  "search_files",
  "search_all",
  // AI 能力
  "ai_ocr",
  "ai_speech_to_text",
  "ai_translate",
  "ai_detect_language",
  "ai_languages",
  // 邮件
  "mail_send",
  "mail_get",
  "mail_list",
  "mail_attachment_url",
  "mail_folders",
  "mail_folder_create",
  "mail_folder_delete",
  "mailgroup_create",
  "mailgroup_get",
  "mailgroup_list",
  "mailgroup_update",
  "mailgroup_delete",
  "mailgroup_members",
  "mailgroup_member_add",
  "mailgroup_member_remove",
  "public_mailbox_create",
  "public_mailbox_get",
  "public_mailbox_list",
  "public_mailbox_update",
  "public_mailbox_delete",
  "public_mailbox_members",
  "public_mailbox_member_add",
  "public_mailbox_member_remove",
  "public_mailbox_members_clear",
  // 通讯录
  "contact_user_get",
  "contact_user_list",
  "contact_user_batch",
  "contact_user_batch_id",
  "contact_user_by_department",
  "contact_department_get",
  "contact_department_list",
  "contact_department_children",
  "contact_department_parent",
  "contact_department_search",
  "contact_department_batch",
  "contact_group_get",
  "contact_group_list",
  "contact_group_create",
  "contact_group_update",
  "contact_group_delete",
  "contact_user_groups",
  "contact_group_members",
  "contact_group_member_add",
  "contact_group_member_remove",
  "contact_group_members_batch_add",
  "contact_group_members_batch_remove",
  // 审批
  "approval_definition_get",
  "approval_create",
  "approval_get",
  "approval_list",
  "approval_cancel",
  "approval_cc",
  "approval_add_sign",
  "approval_rollback",
  "approval_approve",
  "approval_reject",
  "approval_transfer",
  "approval_tasks",
  "approval_tasks_search",
  "approval_comment_add",
  "approval_comments",
  "approval_comment_delete",
  // 词典
  "lingo_entity_create",
  "lingo_entity_get",
  "lingo_entity_update",
  "lingo_entity_delete",
  "lingo_entity_list",
  "lingo_entity_search",
  "lingo_entity_match",
  "lingo_entity_highlight",
  "lingo_classifications",
  "lingo_repos",
  "lingo_draft_create",
  "lingo_draft_update",
] as const;

export type FeishuAction = (typeof FEISHU_ACTIONS)[number];

// ========== Tool Schema ==========

/**
 * 构建飞书工具的参数 schema
 */
function buildFeishuToolSchema(): TSchema {
  return Type.Object({
    // 必填：操作类型
    action: Type.Unsafe({
      type: "string",
      enum: FEISHU_ACTIONS,
      description: "飞书操作类型",
    }),
    // 目标（聊天/用户 ID）
    target: Type.Optional(Type.String({ description: "目标聊天或用户 ID" })),
    // 通用参数
    chatId: Type.Optional(Type.String()),
    messageId: Type.Optional(Type.String()),
    userId: Type.Optional(Type.String()),
    userIds: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    // 卡片消息
    card: Type.Optional(Type.Any({ description: "卡片 JSON 对象" })),
    // 文件操作
    filePath: Type.Optional(Type.String()),
    fileName: Type.Optional(Type.String()),
    fileToken: Type.Optional(Type.String()),
    fileTokens: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    fileType: Type.Optional(Type.String()),
    folderToken: Type.Optional(Type.String()),
    parentToken: Type.Optional(Type.String()),
    targetFolderToken: Type.Optional(Type.String()),
    savePath: Type.Optional(Type.String()),
    newName: Type.Optional(Type.String()),
    newOwnerId: Type.Optional(Type.String()),
    targetToken: Type.Optional(Type.String()),
    targetType: Type.Optional(Type.String()),
    parentFolderToken: Type.Optional(Type.String()),
    // 文档操作
    documentId: Type.Optional(Type.String()),
    title: Type.Optional(Type.String()),
    folderId: Type.Optional(Type.String()),
    content: Type.Optional(Type.String()),
    markdown: Type.Optional(Type.String()),
    blockId: Type.Optional(Type.String()),
    blockIds: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    text: Type.Optional(Type.String()),
    checked: Type.Optional(Type.Boolean()),
    // 聊天操作
    name: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
    query: Type.Optional(Type.String()),
    managerIds: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    tabId: Type.Optional(Type.String()),
    tabIds: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    tabName: Type.Optional(Type.String()),
    tabType: Type.Optional(Type.String()),
    url: Type.Optional(Type.String()),
    doc: Type.Optional(Type.String()),
    revision: Type.Optional(Type.String()),
    targetChatId: Type.Optional(Type.String()),
    messageIds: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    // 多维表格
    appToken: Type.Optional(Type.String()),
    tableId: Type.Optional(Type.String()),
    recordId: Type.Optional(Type.String()),
    recordIds: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    viewId: Type.Optional(Type.String()),
    viewName: Type.Optional(Type.String()),
    viewType: Type.Optional(Type.String()),
    fieldName: Type.Optional(Type.String()),
    fieldType: Type.Optional(Type.String()),
    fields: Type.Optional(Type.Any()),
    pageSize: Type.Optional(Type.Number()),
    roleId: Type.Optional(Type.String()),
    roleName: Type.Optional(Type.String()),
    tablePerm: Type.Optional(Type.Number()),
    recPerm: Type.Optional(Type.Number()),
    memberId: Type.Optional(Type.String()),
    memberIds: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    memberType: Type.Optional(Type.String()),
    memberRole: Type.Optional(Type.String()),
    workflowId: Type.Optional(Type.String()),
    enabled: Type.Optional(Type.Boolean()),
    // 电子表格
    spreadsheetToken: Type.Optional(Type.String()),
    sheetId: Type.Optional(Type.String()),
    sourceSheetId: Type.Optional(Type.String()),
    targetTitle: Type.Optional(Type.String()),
    range: Type.Optional(Type.String()),
    values: Type.Optional(Type.Any()),
    startIndex: Type.Optional(Type.Number()),
    count: Type.Optional(Type.Number()),
    style: Type.Optional(Type.Any()),
    mergeType: Type.Optional(Type.String()),
    sortSpecs: Type.Optional(Type.Any()),
    frozenRows: Type.Optional(Type.Number()),
    frozenColumns: Type.Optional(Type.Number()),
    find: Type.Optional(Type.String()),
    replace: Type.Optional(Type.String()),
    startCol: Type.Optional(Type.Number()),
    endCol: Type.Optional(Type.Number()),
    startRow: Type.Optional(Type.Number()),
    endRow: Type.Optional(Type.Number()),
    width: Type.Optional(Type.Number()),
    height: Type.Optional(Type.Number()),
    index: Type.Optional(Type.Number()),
    // 日历
    calendarId: Type.Optional(Type.String()),
    eventId: Type.Optional(Type.String()),
    summary: Type.Optional(Type.String()),
    startTime: Type.Optional(Type.String()),
    endTime: Type.Optional(Type.String()),
    location: Type.Optional(Type.String()),
    role: Type.Optional(Type.String()),
    aclId: Type.Optional(Type.String()),
    // 任务
    taskId: Type.Optional(Type.String()),
    tasklistId: Type.Optional(Type.String()),
    due: Type.Optional(Type.String()),
    completed: Type.Optional(Type.Boolean()),
    minutes: Type.Optional(Type.Number()),
    dependencyTaskIds: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    dependencyType: Type.Optional(Type.String()),
    attachmentId: Type.Optional(Type.String()),
    // 知识库
    spaceId: Type.Optional(Type.String()),
    nodeToken: Type.Optional(Type.String()),
    parentNodeToken: Type.Optional(Type.String()),
    targetParentToken: Type.Optional(Type.String()),
    targetSpaceId: Type.Optional(Type.String()),
    objType: Type.Optional(Type.String()),
    visibility: Type.Optional(Type.String()),
    // 搜索
    docTypes: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    types: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    // AI
    image: Type.Optional(Type.String()),
    audio: Type.Optional(Type.String()),
    format: Type.Optional(Type.String()),
    targetLang: Type.Optional(Type.String()),
    sourceLang: Type.Optional(Type.String()),
    // 邮件
    userMailboxId: Type.Optional(Type.String()),
    subject: Type.Optional(Type.String()),
    to: Type.Optional(Type.String()),
    bodyHtml: Type.Optional(Type.String()),
    bodyPlainText: Type.Optional(Type.String()),
    cc: Type.Optional(Type.String()),
    bcc: Type.Optional(Type.String()),
    parentFolderId: Type.Optional(Type.String()),
    mailGroupId: Type.Optional(Type.String()),
    email: Type.Optional(Type.String()),
    type: Type.Optional(Type.String()),
    publicMailboxId: Type.Optional(Type.String()),
    // 通讯录
    userIdType: Type.Optional(Type.String()),
    emails: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    mobiles: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    departmentId: Type.Optional(Type.String()),
    parentDepartmentId: Type.Optional(Type.String()),
    departmentIds: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    fetchChild: Type.Optional(Type.Boolean()),
    groupId: Type.Optional(Type.String()),
    members: Type.Optional(Type.Any()),
    // 审批
    approvalCode: Type.Optional(Type.String()),
    instanceCode: Type.Optional(Type.String()),
    form: Type.Optional(Type.Any()),
    ccUserIds: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    comment: Type.Optional(Type.String()),
    addSignUserIds: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    addSignType: Type.Optional(Type.String()),
    reason: Type.Optional(Type.String()),
    targetNodeId: Type.Optional(Type.String()),
    transferUserId: Type.Optional(Type.String()),
    topic: Type.Optional(Type.String()),
    taskStatus: Type.Optional(Type.String()),
    commentId: Type.Optional(Type.String()),
    // 词典
    entityId: Type.Optional(Type.String()),
    repoId: Type.Optional(Type.String()),
    mainKey: Type.Optional(Type.String()),
    aliases: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
    richText: Type.Optional(Type.String()),
    word: Type.Optional(Type.String()),
    draftId: Type.Optional(Type.String()),
  });
}

// ========== Tool Description ==========

const FEISHU_TOOL_DESCRIPTION = `飞书专属操作工具，支持：

**消息**: send_card(卡片), send_image, send_file, msg_forward, msg_urgent
**群聊**: chat_create/get/update/delete/list/search, chat_members_*, chat_managers_*
**文档**: doc_create/get/read/append/append_md, doc_block_*
**云空间**: folder_create/list, file_upload/download/search/move/copy/delete
**多维表格**: bitable_create/get/tables, bitable_records/record_*, bitable_fields/views/roles
**电子表格**: sheet_create/get/list/read/write/append, sheet_insert_*/delete_*/style/merge
**日历**: cal_list/primary/create, cal_event_*/cal_attendees/cal_freebusy
**任务**: task_create/get/update/delete/complete, tasklist_*, task_members_*
**知识库**: wiki_spaces/space_*/nodes/node_*/members
**搜索**: search_messages/docs/files/all
**AI**: ai_ocr, ai_speech_to_text, ai_translate, ai_detect_language
**邮件**: mail_send/get/list, mailgroup_*, public_mailbox_*
**通讯录**: contact_user_*/contact_department_*/contact_group_*
**审批**: approval_create/get/list/approve/reject/transfer/cancel
**词典**: lingo_entity_*/lingo_draft_*

使用示例:
- 发送卡片: action="send_card", target="chat_id", card={...}
- 创建文档: action="doc_create", title="标题"
- 查询记录: action="bitable_records", appToken="xxx", tableId="xxx"`;

// ========== Tool Type ==========

export interface FeishuAgentTool {
  label: string;
  name: string;
  description: string;
  parameters: TSchema;
  execute: (
    toolCallId: string,
    args: Record<string, unknown>,
    signal?: AbortSignal
  ) => Promise<{
    content: Array<{ type: string; text: string }>;
    details?: Record<string, unknown>;
  }>;
}

// ========== Tool Factory ==========

/**
 * 创建飞书 Agent 工具
 *
 * @param deps 依赖注入（用于获取账户信息和执行 action）
 */
export function createFeishuTool(deps: {
  getAccount: () => ResolvedFeishuAccount | undefined;
  handleAction: (ctx: {
    action: string;
    account: ResolvedFeishuAccount;
    [key: string]: unknown;
  }) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
}): FeishuAgentTool {
  return {
    label: "Feishu",
    name: "feishu",
    description: FEISHU_TOOL_DESCRIPTION,
    parameters: buildFeishuToolSchema(),
    execute: async (_toolCallId, args, _signal) => {
      const account = deps.getAccount();
      if (!account) {
        return {
          content: [{ type: "text", text: "❌ 飞书账户未配置" }],
          details: { ok: false, error: "Account not configured" },
        };
      }

      const action = args.action as string;
      if (!action) {
        return {
          content: [{ type: "text", text: "❌ 缺少 action 参数" }],
          details: { ok: false, error: "Missing action parameter" },
        };
      }

      try {
        const result = await deps.handleAction({
          action,
          account,
          ...args,
        });

        if (result.ok) {
          const text = result.data
            ? `✅ ${action} 成功\n\n${JSON.stringify(result.data, null, 2)}`
            : `✅ ${action} 成功`;
          return {
            content: [{ type: "text", text }],
            details: { ok: true, data: result.data },
          };
        } else {
          return {
            content: [{ type: "text", text: `❌ ${action} 失败: ${result.error}` }],
            details: { ok: false, error: result.error },
          };
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `❌ ${action} 异常: ${errorMsg}` }],
          details: { ok: false, error: errorMsg },
        };
      }
    },
  };
}
