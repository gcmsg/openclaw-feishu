/**
 * 飞书审批 API
 *
 * 支持的操作：
 * - 审批定义查询
 * - 审批实例管理（发起、撤销、抄送、加签、退回）
 * - 审批任务处理（同意、拒绝、转交）
 * - 审批评论
 */

import type { ResolvedFeishuAccount, ApiResult } from "./types.js";
import { getFeishuClient } from "./client.js";

// ==================== 类型定义 ====================

/** 审批定义 */
export interface ApprovalDefinition {
  approvalCode: string;
  approvalName: string;
  status: "ACTIVE" | "INACTIVE" | "DELETED" | "UNKNOWN";
  form?: string; // JSON 格式的表单定义
  nodeList?: ApprovalNode[];
  viewers?: Array<{ type: string; userId?: string; departmentId?: string }>;
}

/** 审批节点 */
export interface ApprovalNode {
  nodeId: string;
  nodeName?: string;
  nodeType?: string;
  approverList?: Array<{ userId: string }>;
}

/** 审批实例 */
export interface ApprovalInstance {
  instanceCode: string;
  approvalCode: string;
  approvalName?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED" | "DELETED" | "REVERTED";
  form?: string; // JSON 格式的表单数据
  userId?: string;
  openId?: string;
  departmentId?: string;
  startTime?: number;
  endTime?: number;
  serialNumber?: string;
  timeline?: ApprovalTimeline[];
  taskList?: ApprovalTask[];
  ccList?: Array<{ userId: string; readStatus: string; openId?: string }>;
}

/** 审批时间线 */
export interface ApprovalTimeline {
  type: string;
  createTime?: number;
  userId?: string;
  openId?: string;
  comment?: string;
  nodeKey?: string;
}

/** 审批任务 */
export interface ApprovalTask {
  taskId: string;
  userId?: string;
  openId?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "TRANSFERRED" | "DONE";
  nodeId?: string;
  nodeName?: string;
  startTime?: number;
  endTime?: number;
}

/** 审批评论 */
export interface ApprovalComment {
  commentId: string;
  userId?: string;
  openId?: string;
  content?: string;
  createTime?: number;
}

// ==================== 审批定义 ====================

/**
 * 获取审批定义
 */
export async function getApprovalDefinition(
  account: ResolvedFeishuAccount,
  approvalCode: string,
  locale?: "zh-CN" | "en-US" | "ja-JP"
): Promise<ApiResult<ApprovalDefinition>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.approval.v4.approval.get({
      path: { approval_code: approvalCode },
      params: { locale: locale || "zh-CN", user_id_type: "open_id" },
    });

    if (result.code === 0 && result.data) {
      const d = result.data as any;
      return {
        ok: true,
        data: {
          approvalCode: d.approval_code || approvalCode,
          approvalName: d.approval_name || "",
          status: d.status,
          form: d.form,
          nodeList: d.node_list?.map((n: any) => ({
            nodeId: n.node_id,
            nodeName: n.name,
            nodeType: n.node_type,
            approverList: n.approver?.map((a: any) => ({ userId: a.user_id })),
          })),
          viewers: d.viewers?.map((v: any) => ({
            type: v.viewer_type,
            userId: v.viewer_user_id,
            departmentId: v.viewer_department_id,
          })),
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 审批实例 ====================

/**
 * 创建审批实例（发起审批）
 */
export async function createApprovalInstance(
  account: ResolvedFeishuAccount,
  approvalCode: string,
  userId: string,
  form: string | Record<string, any>,
  options?: {
    nodeApproverUserIdList?: Array<{ key: string; value: string[] }>;
    nodeApproverOpenIdList?: Array<{ key: string; value: string[] }>;
    nodeCcUserIdList?: Array<{ key: string; value: string[] }>;
    uuid?: string;
  }
): Promise<ApiResult<{ instanceCode: string }>> {
  const client = getFeishuClient(account);

  try {
    const formStr = typeof form === "string" ? form : JSON.stringify(form);

    const result = await client.approval.v4.instance.create({
      data: {
        approval_code: approvalCode,
        user_id: userId,
        form: formStr,
        node_approver_user_id_list: options?.nodeApproverUserIdList?.map((n) => ({
          key: n.key,
          value: n.value,
        })),
        node_approver_open_id_list: options?.nodeApproverOpenIdList?.map((n) => ({
          key: n.key,
          value: n.value,
        })),
        node_cc_user_id_list: options?.nodeCcUserIdList?.map((n) => ({
          key: n.key,
          value: n.value,
        })),
        uuid: options?.uuid,
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: { instanceCode: result.data?.instance_code || "" },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取审批实例详情
 */
export async function getApprovalInstance(
  account: ResolvedFeishuAccount,
  instanceCode: string,
  locale?: "zh-CN" | "en-US" | "ja-JP"
): Promise<ApiResult<ApprovalInstance>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.approval.v4.instance.get({
      path: { instance_id: instanceCode },
      params: { locale: locale || "zh-CN", user_id_type: "open_id" },
    } as any);

    if (result.code === 0 && result.data) {
      const d = result.data as any;
      return {
        ok: true,
        data: {
          instanceCode: d.instance_code || instanceCode,
          approvalCode: d.approval_code || "",
          approvalName: d.approval_name,
          status: d.status,
          form: d.form,
          userId: d.user_id,
          openId: d.open_id,
          departmentId: d.department_id,
          startTime: d.start_time ? parseInt(d.start_time, 10) : undefined,
          endTime: d.end_time ? parseInt(d.end_time, 10) : undefined,
          serialNumber: d.serial_number,
          timeline: d.timeline?.map((t: any) => ({
            type: t.type,
            createTime: t.create_time ? parseInt(t.create_time, 10) : undefined,
            userId: t.user_id,
            openId: t.open_id,
            comment: t.comment,
            nodeKey: t.node_key,
          })),
          taskList: d.task_list?.map((t: any) => ({
            taskId: t.id || t.task_id,
            userId: t.user_id,
            openId: t.open_id,
            status: t.status,
            nodeId: t.node_id,
            nodeName: t.node_name,
            startTime: t.start_time ? parseInt(t.start_time, 10) : undefined,
            endTime: t.end_time ? parseInt(t.end_time, 10) : undefined,
          })),
          ccList: d.cc_list?.map((c: any) => ({
            userId: c.user_id,
            openId: c.open_id,
            readStatus: c.read_status,
          })),
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 查询审批实例列表
 */
export async function queryApprovalInstances(
  account: ResolvedFeishuAccount,
  approvalCode: string,
  options?: {
    startTime?: number;
    endTime?: number;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ instanceCodes: string[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const now = Math.floor(Date.now() / 1000);
    const result = await client.approval.v4.instance.query({
      data: {
        approval_code: approvalCode,
        start_time: String(options?.startTime || now - 30 * 24 * 60 * 60), // 默认30天内
        end_time: String(options?.endTime || now),
      },
      params: {
        page_size: options?.pageSize || 100,
        page_token: options?.pageToken,
      },
    } as any);

    if (result.code === 0) {
      const data = result.data as any;
      return {
        ok: true,
        data: {
          instanceCodes: data?.instance_code_list || data?.instance_list?.map((i: any) => i.instance?.code) || [],
          pageToken: data?.page_token,
          hasMore: data?.has_more,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 撤销审批实例
 */
export async function cancelApprovalInstance(
  account: ResolvedFeishuAccount,
  instanceCode: string,
  userId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.approval.v4.instance.cancel({
      data: {
        approval_code: "", // 不需要，但 SDK 可能要求
        instance_code: instanceCode,
        user_id: userId,
      },
      params: { user_id_type: "open_id" },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 抄送审批实例
 */
export async function ccApprovalInstance(
  account: ResolvedFeishuAccount,
  instanceCode: string,
  userId: string,
  ccUserIds: string[],
  comment?: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.approval.v4.instance.cc({
      data: {
        approval_code: "",
        instance_code: instanceCode,
        user_id: userId,
        cc_user_ids: ccUserIds,
        comment,
      },
      params: { user_id_type: "open_id" },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 审批实例加签
 */
export async function addSignToApproval(
  account: ResolvedFeishuAccount,
  instanceCode: string,
  userId: string,
  taskId: string,
  addSignUserIds: string[],
  addSignType: 1 | 2 | 3, // 1: 前加签, 2: 后加签, 3: 并加签
  reason?: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.approval.v4.instance.addSign({
      data: {
        approval_code: "",
        instance_code: instanceCode,
        user_id: userId,
        task_id: taskId,
        add_sign_user_ids: addSignUserIds,
        add_sign_type: addSignType,
        reason,
      },
      params: { user_id_type: "open_id" },
    } as any);

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 审批实例退回
 */
export async function rollbackApproval(
  account: ResolvedFeishuAccount,
  instanceCode: string,
  userId: string,
  taskId: string,
  targetNodeId: string,
  reason?: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.approval.v4.instance.specifiedRollback({
      data: {
        user_id: userId,
        task_id: taskId,
        reason,
        task_def_key_list: [targetNodeId],
      },
      params: { user_id_type: "open_id" },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 审批任务 ====================

/**
 * 同意审批任务
 */
export async function approveTask(
  account: ResolvedFeishuAccount,
  instanceCode: string,
  userId: string,
  taskId: string,
  comment?: string,
  form?: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.approval.v4.task.approve({
      data: {
        approval_code: "",
        instance_code: instanceCode,
        user_id: userId,
        task_id: taskId,
        comment,
        form,
      },
      params: { user_id_type: "open_id" },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 拒绝审批任务
 */
export async function rejectTask(
  account: ResolvedFeishuAccount,
  instanceCode: string,
  userId: string,
  taskId: string,
  comment?: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.approval.v4.task.reject({
      data: {
        approval_code: "",
        instance_code: instanceCode,
        user_id: userId,
        task_id: taskId,
        comment,
      },
      params: { user_id_type: "open_id" },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 转交审批任务
 */
export async function transferTask(
  account: ResolvedFeishuAccount,
  instanceCode: string,
  userId: string,
  taskId: string,
  transferUserId: string,
  comment?: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.approval.v4.task.transfer({
      data: {
        approval_code: "",
        instance_code: instanceCode,
        user_id: userId,
        task_id: taskId,
        transfer_user_id: transferUserId,
        comment,
      },
      params: { user_id_type: "open_id" },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 查询审批任务列表
 */
export async function queryTasks(
  account: ResolvedFeishuAccount,
  options?: {
    pageSize?: number;
    pageToken?: string;
    userId?: string;
    topic?: "1" | "2" | "3" | "17" | "18"; // 1:待审批 2:已审批 3:已发起 17:待阅 18:已阅
  }
): Promise<ApiResult<{ tasks: ApprovalTask[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const params: {
      page_size: number;
      page_token?: string;
      user_id?: string;
      topic: string;
      user_id_type: string;
    } = {
      page_size: options?.pageSize || 100,
      topic: options?.topic || "1",
      user_id_type: "open_id",
    };
    if (options?.pageToken) params.page_token = options.pageToken;
    if (options?.userId) params.user_id = options.userId;
    const result = await client.approval.v4.task.query({
      params: params as any,
    });

    if (result.code === 0) {
      const data = result.data as any;
      const tasks = (data?.tasks || data?.items || []).map((t: any) => ({
        taskId: t.task_id || t.id,
        userId: t.user_id,
        openId: t.open_id,
        status: t.status,
        nodeId: t.node_id,
        nodeName: t.node_name,
        startTime: t.start_time ? parseInt(t.start_time, 10) : undefined,
        endTime: t.end_time ? parseInt(t.end_time, 10) : undefined,
      }));

      return {
        ok: true,
        data: {
          tasks,
          pageToken: data?.page_token,
          hasMore: data?.has_more,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 搜索审批任务
 */
export async function searchTasks(
  account: ResolvedFeishuAccount,
  userId: string,
  options?: {
    approvalCode?: string;
    instanceCode?: string;
    instanceExternalId?: string;
    groupExternalId?: string;
    taskTitle?: string;
    taskStatus?: "PENDING" | "APPROVED" | "REJECTED" | "TRANSFERRED" | "DONE";
    taskStartTimeFrom?: number;
    taskStartTimeTo?: number;
    locale?: "zh-CN" | "en-US" | "ja-JP";
    pageSize?: number;
    pageToken?: string;
  }
): Promise<
  ApiResult<{
    tasks: Array<{
      taskId: string;
      instanceCode: string;
      approvalCode: string;
      approvalName?: string;
      taskTitle?: string;
      status: string;
    }>;
    pageToken?: string;
    hasMore?: boolean;
  }>
> {
  const client = getFeishuClient(account);

  try {
    const result = await client.approval.v4.task.search({
      data: {
        user_id: userId,
        approval_code: options?.approvalCode,
        instance_code: options?.instanceCode,
        instance_external_id: options?.instanceExternalId,
        group_external_id: options?.groupExternalId,
        task_title: options?.taskTitle,
        task_status: options?.taskStatus,
        task_start_time_from: options?.taskStartTimeFrom
          ? String(options.taskStartTimeFrom)
          : undefined,
        task_start_time_to: options?.taskStartTimeTo ? String(options.taskStartTimeTo) : undefined,
        locale: options?.locale || "zh-CN",
      },
      params: {
        page_size: options?.pageSize || 100,
        page_token: options?.pageToken,
        user_id_type: "open_id",
      },
    });

    if (result.code === 0) {
      const data = result.data as any;
      const tasks = (data?.task_list || data?.items || []).map((t: any) => ({
        taskId: t.task?.id || t.task_id,
        instanceCode: t.instance?.code || t.instance_code,
        approvalCode: t.approval?.code || t.approval_code,
        approvalName: t.approval?.name,
        taskTitle: t.title,
        status: t.task?.status || t.status,
      }));

      return {
        ok: true,
        data: {
          tasks,
          pageToken: data?.page_token,
          hasMore: data?.has_more,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 审批评论 ====================

/**
 * 添加审批评论
 */
export async function addApprovalComment(
  account: ResolvedFeishuAccount,
  instanceCode: string,
  userId: string,
  content: string
): Promise<ApiResult<{ commentId: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.approval.v4.instanceComment.create({
      path: { instance_id: instanceCode },
      params: { user_id_type: "open_id", user_id: userId },
      data: {
        content,
      },
    } as any);

    if (result.code === 0) {
      return {
        ok: true,
        data: { commentId: result.data?.comment_id || "" },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取审批评论列表
 */
export async function listApprovalComments(
  account: ResolvedFeishuAccount,
  instanceCode: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<
  ApiResult<{
    comments: ApprovalComment[];
    pageToken?: string;
    hasMore?: boolean;
  }>
> {
  const client = getFeishuClient(account);

  try {
    const result = await client.approval.v4.instanceComment.list({
      path: { instance_id: instanceCode },
      params: {
        user_id_type: "open_id",
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken || "",
      },
    } as any);

    if (result.code === 0) {
      const data = result.data as any;
      const comments = (data?.comments || data?.items || []).map((c: any) => ({
        commentId: c.id || c.comment_id,
        userId: c.user_id,
        openId: c.open_id,
        content: c.content,
        createTime: c.create_time ? parseInt(c.create_time, 10) : undefined,
      }));

      return {
        ok: true,
        data: {
          comments,
          pageToken: data?.page_token,
          hasMore: data?.has_more,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除审批评论
 */
export async function deleteApprovalComment(
  account: ResolvedFeishuAccount,
  instanceCode: string,
  commentId: string,
  userId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.approval.v4.instanceComment.delete({
      path: { instance_id: instanceCode, comment_id: commentId },
      params: { user_id_type: "open_id", user_id: userId },
    } as any);

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
