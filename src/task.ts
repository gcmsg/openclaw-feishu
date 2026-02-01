/**
 * 飞书任务 API
 *
 * 支持的操作：
 * - 任务 CRUD
 * - 任务列表管理
 * - 任务提醒
 * - 任务关注者
 */

import type { ResolvedFeishuAccount, ApiResult } from "./types.js";
import { getFeishuClient } from "./client.js";

// ==================== 类型定义 ====================

/** 任务信息 */
export interface Task {
  taskId: string;
  summary: string;
  description?: string;
  due?: {
    timestamp?: number;
    isAllDay?: boolean;
  };
  completed?: boolean;
  completedAt?: number;
  creator?: {
    userId?: string;
    name?: string;
  };
  origin?: {
    platform?: string;
    href?: string;
  };
  extra?: string;
  createdAt?: number;
  updatedAt?: number;
  priority?: "none" | "low" | "medium" | "high";
}

/** 任务列表（清单） */
export interface TaskList {
  tasklistId: string;
  name: string;
  creator?: {
    userId?: string;
    name?: string;
  };
  memberCount?: number;
}

/** 创建任务参数 */
export interface CreateTaskParams {
  summary: string;
  description?: string;
  due?: number | Date;
  isAllDay?: boolean;
  priority?: "none" | "low" | "medium" | "high";
  origin?: {
    platform?: string;
    href?: string;
  };
  extra?: string;
}

// ==================== 任务操作 ====================

/**
 * 创建任务
 */
export async function createTask(
  account: ResolvedFeishuAccount,
  params: CreateTaskParams
): Promise<ApiResult<Task>> {
  const client = getFeishuClient(account);

  try {
    const taskData: any = {
      summary: params.summary,
      description: params.description,
    };

    if (params.due) {
      const dueTs =
        typeof params.due === "number" ? params.due : Math.floor(params.due.getTime() / 1000);
      taskData.due = {
        timestamp: dueTs.toString(),
        is_all_day: params.isAllDay ?? false,
      };
    }

    if (params.priority) {
      taskData.custom_fields = [
        {
          guid: "priority",
          text_value: params.priority,
        },
      ];
    }

    if (params.origin) {
      taskData.origin = params.origin;
    }

    if (params.extra) {
      taskData.extra = params.extra;
    }

    const result = await client.task.v2.task.create({
      data: taskData,
      params: { user_id_type: "open_id" },
    });

    if (result.code === 0 && result.data?.task) {
      return { ok: true, data: parseTask(result.data.task) };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取任务详情
 */
export async function getTask(
  account: ResolvedFeishuAccount,
  taskId: string
): Promise<ApiResult<Task>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.task.v2.task.get({
      path: { task_guid: taskId },
      params: { user_id_type: "open_id" },
    });

    if (result.code === 0 && result.data?.task) {
      return { ok: true, data: parseTask(result.data.task) };
    }
    return { ok: false, error: result.msg || "任务不存在" };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 更新任务
 */
export async function updateTask(
  account: ResolvedFeishuAccount,
  taskId: string,
  params: Partial<CreateTaskParams>
): Promise<ApiResult<Task>> {
  const client = getFeishuClient(account);

  try {
    const taskData: any = {};
    const updateFields: string[] = [];

    if (params.summary !== undefined) {
      taskData.summary = params.summary;
      updateFields.push("summary");
    }
    if (params.description !== undefined) {
      taskData.description = params.description;
      updateFields.push("description");
    }
    if (params.due !== undefined) {
      const dueTs =
        typeof params.due === "number" ? params.due : Math.floor(params.due.getTime() / 1000);
      taskData.due = {
        timestamp: dueTs.toString(),
        is_all_day: params.isAllDay ?? false,
      };
      updateFields.push("due");
    }
    if (params.extra !== undefined) {
      taskData.extra = params.extra;
      updateFields.push("extra");
    }

    const result = await client.task.v2.task.patch({
      path: { task_guid: taskId },
      data: {
        task: taskData,
        update_fields: updateFields,
      },
      params: { user_id_type: "open_id" },
    });

    if (result.code === 0 && result.data?.task) {
      return { ok: true, data: parseTask(result.data.task) };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除任务
 */
export async function deleteTask(
  account: ResolvedFeishuAccount,
  taskId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.task.v2.task.delete({
      path: { task_guid: taskId },
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
 * 完成任务
 */
export async function completeTask(
  account: ResolvedFeishuAccount,
  taskId: string
): Promise<ApiResult<Task>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.task.v2.task.complete({
      path: { task_guid: taskId },
    });

    if (result.code === 0 && result.data?.task) {
      return { ok: true, data: parseTask(result.data.task) };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 取消完成任务
 */
export async function uncompleteTask(
  account: ResolvedFeishuAccount,
  taskId: string
): Promise<ApiResult<Task>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.task.v2.task.uncomplete({
      path: { task_guid: taskId },
    });

    if (result.code === 0 && result.data?.task) {
      return { ok: true, data: parseTask(result.data.task) };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 列出任务（使用任务列表）
 */
export async function listTasks(
  account: ResolvedFeishuAccount,
  options?: {
    tasklistId?: string;
    completed?: boolean;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ tasks: Task[]; pageToken?: string }>> {
  const client = getFeishuClient(account);

  try {
    // 如果指定了任务列表，从任务列表获取
    if (options?.tasklistId) {
      const result = await client.task.v2.tasklistTask.list({
        path: { tasklist_guid: options.tasklistId },
        params: {
          page_size: options?.pageSize || 50,
          page_token: options?.pageToken,
          completed: options?.completed?.toString(),
        },
      });

      if (result.code === 0) {
        const tasks = (result.data?.items || []).map((t: any) => parseTask(t));
        return {
          ok: true,
          data: {
            tasks,
            pageToken: result.data?.page_token,
          },
        };
      }
      return { ok: false, error: result.msg };
    }

    // 否则列出所有任务
    const result = await client.task.v2.task.list({
      params: {
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
        completed: options?.completed?.toString(),
        user_id_type: "open_id",
      },
    });

    if (result.code === 0) {
      const tasks = (result.data?.items || []).map((t: any) => parseTask(t));
      return {
        ok: true,
        data: {
          tasks,
          pageToken: result.data?.page_token,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 任务列表操作 ====================

/**
 * 创建任务列表
 */
export async function createTaskList(
  account: ResolvedFeishuAccount,
  name: string
): Promise<ApiResult<TaskList>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.task.v2.tasklist.create({
      data: { name },
      params: { user_id_type: "open_id" },
    });

    if (result.code === 0 && result.data?.tasklist) {
      const tl = result.data.tasklist;
      return {
        ok: true,
        data: {
          tasklistId: tl.guid!,
          name: tl.name || name,
          creator: tl.creator
            ? {
                userId: tl.creator.id,
                name: tl.creator.name,
              }
            : undefined,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取任务列表详情
 */
export async function getTaskList(
  account: ResolvedFeishuAccount,
  tasklistId: string
): Promise<ApiResult<TaskList>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.task.v2.tasklist.get({
      path: { tasklist_guid: tasklistId },
      params: { user_id_type: "open_id" },
    });

    if (result.code === 0 && result.data?.tasklist) {
      const tl = result.data.tasklist;
      return {
        ok: true,
        data: {
          tasklistId: tl.guid!,
          name: tl.name || "",
          creator: tl.creator
            ? {
                userId: tl.creator.id,
                name: tl.creator.name,
              }
            : undefined,
          memberCount: tl.members?.length,
        },
      };
    }
    return { ok: false, error: result.msg || "任务列表不存在" };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 列出任务列表
 */
export async function listTaskLists(
  account: ResolvedFeishuAccount,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ tasklists: TaskList[]; pageToken?: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.task.v2.tasklist.list({
      params: {
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
        user_id_type: "open_id",
      },
    });

    if (result.code === 0) {
      const tasklists = (result.data?.items || []).map((tl: any) => ({
        tasklistId: tl.guid,
        name: tl.name || "",
        creator: tl.creator
          ? {
              userId: tl.creator.id,
              name: tl.creator.name,
            }
          : undefined,
      }));
      return {
        ok: true,
        data: {
          tasklists,
          pageToken: result.data?.page_token,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除任务列表
 */
export async function deleteTaskList(
  account: ResolvedFeishuAccount,
  tasklistId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.task.v2.tasklist.delete({
      path: { tasklist_guid: tasklistId },
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
 * 将任务添加到任务列表
 */
export async function addTaskToList(
  account: ResolvedFeishuAccount,
  tasklistId: string,
  taskId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.task.v2.tasklistTask.create({
      path: { tasklist_guid: tasklistId },
      data: { task_guid: taskId },
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
 * 从任务列表移除任务
 */
export async function removeTaskFromList(
  account: ResolvedFeishuAccount,
  tasklistId: string,
  taskId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.task.v2.tasklistTask.delete({
      path: { tasklist_guid: tasklistId, task_guid: taskId },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 提醒操作 ====================

/**
 * 添加任务提醒
 */
export async function addTaskReminder(
  account: ResolvedFeishuAccount,
  taskId: string,
  relativeFireMinutes: number
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.task.v2.taskReminder.create({
      path: { task_guid: taskId },
      data: {
        relative_fire_minute: relativeFireMinutes,
      },
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
 * 获取任务提醒列表
 */
export async function listTaskReminders(
  account: ResolvedFeishuAccount,
  taskId: string
): Promise<ApiResult<Array<{ reminderId: string; relativeFireMinutes: number }>>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.task.v2.taskReminder.list({
      path: { task_guid: taskId },
      params: { page_size: 50 },
    });

    if (result.code === 0) {
      const reminders = (result.data?.items || []).map((r: any) => ({
        reminderId: r.id,
        relativeFireMinutes: r.relative_fire_minute,
      }));
      return { ok: true, data: reminders };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除任务提醒
 */
export async function deleteTaskReminder(
  account: ResolvedFeishuAccount,
  taskId: string,
  reminderId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.task.v2.taskReminder.delete({
      path: { task_guid: taskId, reminder_id: reminderId },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 辅助函数 ====================

/**
 * 解析任务对象
 */
function parseTask(t: any): Task {
  return {
    taskId: t.guid,
    summary: t.summary || "",
    description: t.description,
    due: t.due
      ? {
          timestamp: t.due.timestamp ? parseInt(t.due.timestamp, 10) : undefined,
          isAllDay: t.due.is_all_day,
        }
      : undefined,
    completed: t.completed_at ? true : false,
    completedAt: t.completed_at ? parseInt(t.completed_at, 10) : undefined,
    creator: t.creator
      ? {
          userId: t.creator.id,
          name: t.creator.name,
        }
      : undefined,
    origin: t.origin,
    extra: t.extra,
    createdAt: t.created_at ? parseInt(t.created_at, 10) : undefined,
    updatedAt: t.updated_at ? parseInt(t.updated_at, 10) : undefined,
  };
}

/**
 * 解析时间字符串为时间戳
 */
export function parseDueString(dueStr: string): number | null {
  // 尝试直接解析
  const directParse = new Date(dueStr);
  if (!isNaN(directParse.getTime())) {
    return Math.floor(directParse.getTime() / 1000);
  }

  const now = new Date();
  const timeMatch = dueStr.match(/(\d{1,2}):(\d{2})/);
  let hours = 23,
    minutes = 59;
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
  }

  if (dueStr.includes("今天")) {
    now.setHours(hours, minutes, 59, 0);
    return Math.floor(now.getTime() / 1000);
  }

  if (dueStr.includes("明天")) {
    now.setDate(now.getDate() + 1);
    now.setHours(hours, minutes, 59, 0);
    return Math.floor(now.getTime() / 1000);
  }

  if (dueStr.includes("后天")) {
    now.setDate(now.getDate() + 2);
    now.setHours(hours, minutes, 59, 0);
    return Math.floor(now.getTime() / 1000);
  }

  // 匹配 "X天后"
  const daysMatch = dueStr.match(/(\d+)\s*天后/);
  if (daysMatch) {
    now.setDate(now.getDate() + parseInt(daysMatch[1], 10));
    now.setHours(hours, minutes, 59, 0);
    return Math.floor(now.getTime() / 1000);
  }

  // 匹配 "下周X"
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  for (let i = 0; i < weekdays.length; i++) {
    if (dueStr.includes(`周${weekdays[i]}`) || dueStr.includes(`星期${weekdays[i]}`)) {
      const currentDay = now.getDay();
      let daysUntil = i - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      if (dueStr.includes("下周") || dueStr.includes("下星期")) {
        daysUntil += 7;
      }
      now.setDate(now.getDate() + daysUntil);
      now.setHours(hours, minutes, 59, 0);
      return Math.floor(now.getTime() / 1000);
    }
  }

  return null;
}
