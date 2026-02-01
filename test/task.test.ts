/**
 * 任务 API 测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAccount, createMockClient } from "./setup.js";

// Mock client module
const mockClient = createMockClient();
vi.mock("../src/client.js", () => ({
  getFeishuClient: () => mockClient,
}));

// 扩展 mockClient 添加任务相关方法
mockClient.task = {
  v2: {
    task: {
      create: vi.fn(),
      get: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      complete: vi.fn(),
      uncomplete: vi.fn(),
      list: vi.fn(),
    },
    tasklist: {
      create: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
      delete: vi.fn(),
    },
    tasklistTask: {
      create: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    },
    taskReminder: {
      create: vi.fn(),
      list: vi.fn(),
      delete: vi.fn(),
    },
  },
};

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
  listTaskReminders,
  deleteTaskReminder,
  parseDueString,
} from "../src/task.js";

describe("任务 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTask", () => {
    it("应该成功创建任务", async () => {
      mockClient.task.v2.task.create.mockResolvedValueOnce({
        code: 0,
        data: {
          task: {
            guid: "task_12345",
            summary: "测试任务",
          },
        },
      });

      const result = await createTask(mockAccount, {
        summary: "测试任务",
      });

      expect(result.ok).toBe(true);
      expect(result.data?.taskId).toBe("task_12345");
      expect(result.data?.summary).toBe("测试任务");
    });

    it("应该支持截止时间", async () => {
      mockClient.task.v2.task.create.mockResolvedValueOnce({
        code: 0,
        data: {
          task: {
            guid: "task_12345",
            summary: "带截止时间的任务",
            due: { timestamp: "1704153600" },
          },
        },
      });

      const result = await createTask(mockAccount, {
        summary: "带截止时间的任务",
        due: 1704153600,
      });

      expect(result.ok).toBe(true);
      expect(mockClient.task.v2.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            due: expect.objectContaining({
              timestamp: "1704153600",
            }),
          }),
        })
      );
    });

    it("应该支持 Date 对象作为截止时间", async () => {
      mockClient.task.v2.task.create.mockResolvedValueOnce({
        code: 0,
        data: {
          task: {
            guid: "task_12345",
            summary: "日期测试",
          },
        },
      });

      const dueDate = new Date("2024-01-15T23:59:59Z");

      const result = await createTask(mockAccount, {
        summary: "日期测试",
        due: dueDate,
      });

      expect(result.ok).toBe(true);
    });
  });

  describe("getTask", () => {
    it("应该成功获取任务详情", async () => {
      mockClient.task.v2.task.get.mockResolvedValueOnce({
        code: 0,
        data: {
          task: {
            guid: "task_12345",
            summary: "我的任务",
            description: "任务描述",
            due: { timestamp: "1704153600", is_all_day: false },
            creator: { id: "user_1", name: "张三" },
          },
        },
      });

      const result = await getTask(mockAccount, "task_12345");

      expect(result.ok).toBe(true);
      expect(result.data?.summary).toBe("我的任务");
      expect(result.data?.description).toBe("任务描述");
      expect(result.data?.creator?.name).toBe("张三");
    });
  });

  describe("updateTask", () => {
    it("应该成功更新任务", async () => {
      mockClient.task.v2.task.patch.mockResolvedValueOnce({
        code: 0,
        data: {
          task: {
            guid: "task_12345",
            summary: "更新后的任务",
          },
        },
      });

      const result = await updateTask(mockAccount, "task_12345", {
        summary: "更新后的任务",
      });

      expect(result.ok).toBe(true);
      expect(result.data?.summary).toBe("更新后的任务");
    });

    it("应该只更新指定字段", async () => {
      mockClient.task.v2.task.patch.mockResolvedValueOnce({
        code: 0,
        data: {
          task: {
            guid: "task_12345",
            summary: "原标题",
            description: "新描述",
          },
        },
      });

      await updateTask(mockAccount, "task_12345", {
        description: "新描述",
      });

      expect(mockClient.task.v2.task.patch).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            update_fields: ["description"],
          }),
        })
      );
    });
  });

  describe("deleteTask", () => {
    it("应该成功删除任务", async () => {
      mockClient.task.v2.task.delete.mockResolvedValueOnce({
        code: 0,
      });

      const result = await deleteTask(mockAccount, "task_12345");

      expect(result.ok).toBe(true);
    });
  });

  describe("completeTask", () => {
    it("应该成功完成任务", async () => {
      mockClient.task.v2.task.complete.mockResolvedValueOnce({
        code: 0,
        data: {
          task: {
            guid: "task_12345",
            summary: "已完成任务",
            completed_at: "1704153600",
          },
        },
      });

      const result = await completeTask(mockAccount, "task_12345");

      expect(result.ok).toBe(true);
      expect(result.data?.completed).toBe(true);
    });
  });

  describe("uncompleteTask", () => {
    it("应该成功取消完成任务", async () => {
      mockClient.task.v2.task.uncomplete.mockResolvedValueOnce({
        code: 0,
        data: {
          task: {
            guid: "task_12345",
            summary: "未完成任务",
          },
        },
      });

      const result = await uncompleteTask(mockAccount, "task_12345");

      expect(result.ok).toBe(true);
      expect(result.data?.completed).toBe(false);
    });
  });

  describe("listTasks", () => {
    it("应该成功列出所有任务", async () => {
      mockClient.task.v2.task.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            { guid: "task_1", summary: "任务1" },
            { guid: "task_2", summary: "任务2" },
          ],
        },
      });

      const result = await listTasks(mockAccount);

      expect(result.ok).toBe(true);
      expect(result.data?.tasks).toHaveLength(2);
    });

    it("应该支持按任务列表过滤", async () => {
      mockClient.task.v2.tasklistTask.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [{ guid: "task_1", summary: "列表任务" }],
        },
      });

      const result = await listTasks(mockAccount, { tasklistId: "list_1" });

      expect(result.ok).toBe(true);
      expect(mockClient.task.v2.tasklistTask.list).toHaveBeenCalled();
    });

    it("应该支持完成状态过滤", async () => {
      mockClient.task.v2.task.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [],
        },
      });

      await listTasks(mockAccount, { completed: true });

      expect(mockClient.task.v2.task.list).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            completed: "true",
          }),
        })
      );
    });
  });

  describe("createTaskList", () => {
    it("应该成功创建任务列表", async () => {
      mockClient.task.v2.tasklist.create.mockResolvedValueOnce({
        code: 0,
        data: {
          tasklist: {
            guid: "list_12345",
            name: "我的清单",
          },
        },
      });

      const result = await createTaskList(mockAccount, "我的清单");

      expect(result.ok).toBe(true);
      expect(result.data?.tasklistId).toBe("list_12345");
      expect(result.data?.name).toBe("我的清单");
    });
  });

  describe("getTaskList", () => {
    it("应该成功获取任务列表详情", async () => {
      mockClient.task.v2.tasklist.get.mockResolvedValueOnce({
        code: 0,
        data: {
          tasklist: {
            guid: "list_12345",
            name: "工作清单",
            creator: { id: "user_1", name: "张三" },
            members: [{ id: "user_1" }, { id: "user_2" }],
          },
        },
      });

      const result = await getTaskList(mockAccount, "list_12345");

      expect(result.ok).toBe(true);
      expect(result.data?.name).toBe("工作清单");
      expect(result.data?.memberCount).toBe(2);
    });
  });

  describe("listTaskLists", () => {
    it("应该成功列出所有任务列表", async () => {
      mockClient.task.v2.tasklist.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            { guid: "list_1", name: "清单1" },
            { guid: "list_2", name: "清单2" },
          ],
        },
      });

      const result = await listTaskLists(mockAccount);

      expect(result.ok).toBe(true);
      expect(result.data?.tasklists).toHaveLength(2);
    });
  });

  describe("deleteTaskList", () => {
    it("应该成功删除任务列表", async () => {
      mockClient.task.v2.tasklist.delete.mockResolvedValueOnce({
        code: 0,
      });

      const result = await deleteTaskList(mockAccount, "list_12345");

      expect(result.ok).toBe(true);
    });
  });

  describe("addTaskToList", () => {
    it("应该成功将任务添加到列表", async () => {
      mockClient.task.v2.tasklistTask.create.mockResolvedValueOnce({
        code: 0,
      });

      const result = await addTaskToList(mockAccount, "list_1", "task_1");

      expect(result.ok).toBe(true);
    });
  });

  describe("removeTaskFromList", () => {
    it("应该成功从列表移除任务", async () => {
      mockClient.task.v2.tasklistTask.delete.mockResolvedValueOnce({
        code: 0,
      });

      const result = await removeTaskFromList(mockAccount, "list_1", "task_1");

      expect(result.ok).toBe(true);
    });
  });

  describe("addTaskReminder", () => {
    it("应该成功添加任务提醒", async () => {
      mockClient.task.v2.taskReminder.create.mockResolvedValueOnce({
        code: 0,
      });

      const result = await addTaskReminder(mockAccount, "task_1", 30);

      expect(result.ok).toBe(true);
      expect(mockClient.task.v2.taskReminder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { relative_fire_minute: 30 },
        })
      );
    });
  });

  describe("listTaskReminders", () => {
    it("应该成功列出任务提醒", async () => {
      mockClient.task.v2.taskReminder.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            { id: "reminder_1", relative_fire_minute: 30 },
            { id: "reminder_2", relative_fire_minute: 60 },
          ],
        },
      });

      const result = await listTaskReminders(mockAccount, "task_1");

      expect(result.ok).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe("deleteTaskReminder", () => {
    it("应该成功删除任务提醒", async () => {
      mockClient.task.v2.taskReminder.delete.mockResolvedValueOnce({
        code: 0,
      });

      const result = await deleteTaskReminder(mockAccount, "task_1", "reminder_1");

      expect(result.ok).toBe(true);
    });
  });
});

describe("parseDueString", () => {
  it("应该解析标准日期格式", () => {
    const result = parseDueString("2024-01-15");
    expect(result).not.toBeNull();
  });

  it("应该解析'今天'", () => {
    const result = parseDueString("今天");
    expect(result).not.toBeNull();

    const date = new Date(result! * 1000);
    const today = new Date();
    expect(date.getDate()).toBe(today.getDate());
  });

  it("应该解析'明天'", () => {
    const result = parseDueString("明天");
    expect(result).not.toBeNull();

    const date = new Date(result! * 1000);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(date.getDate()).toBe(tomorrow.getDate());
  });

  it("应该解析'X天后'格式", () => {
    const result = parseDueString("3天后");
    expect(result).not.toBeNull();

    const date = new Date(result! * 1000);
    const expected = new Date();
    expected.setDate(expected.getDate() + 3);
    expect(date.getDate()).toBe(expected.getDate());
  });

  it("应该返回 null 对于无法解析的字符串", () => {
    const result = parseDueString("无效日期");
    expect(result).toBeNull();
  });
});
