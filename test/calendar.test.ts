/**
 * 日历 API 测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAccount, createMockClient } from "./setup.js";

// Mock client module
const mockClient = createMockClient();
vi.mock("../src/client.js", () => ({
  getFeishuClient: () => mockClient,
}));

// 扩展 mockClient 添加日历相关方法
mockClient.calendar = {
  v4: {
    calendar: {
      list: vi.fn(),
      primary: vi.fn(),
      create: vi.fn(),
    },
    calendarEvent: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      search: vi.fn(),
    },
    calendarEventAttendee: {
      list: vi.fn(),
      create: vi.fn(),
      batchDelete: vi.fn(),
    },
    freebusy: {
      list: vi.fn(),
    },
  },
};

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
} from "../src/calendar.js";

describe("日历 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listCalendars", () => {
    it("应该成功列出日历", async () => {
      mockClient.calendar.v4.calendar.list.mockResolvedValueOnce({
        code: 0,
        data: {
          calendar_list: [
            { calendar_id: "cal_1", summary: "主日历", type: "primary", role: "owner" },
            { calendar_id: "cal_2", summary: "共享日历", type: "shared", role: "reader" },
          ],
        },
      });

      const result = await listCalendars(mockAccount);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].calendarId).toBe("cal_1");
      expect(result.data?.[0].type).toBe("primary");
    });
  });

  describe("getPrimaryCalendar", () => {
    it("应该成功获取主日历", async () => {
      mockClient.calendar.v4.calendar.primary.mockResolvedValueOnce({
        code: 0,
        data: {
          calendars: [
            {
              calendar: {
                calendar_id: "primary_cal",
                summary: "我的日历",
              },
            },
          ],
        },
      });

      const result = await getPrimaryCalendar(mockAccount);

      expect(result.ok).toBe(true);
      expect(result.data?.calendarId).toBe("primary_cal");
      expect(result.data?.type).toBe("primary");
    });
  });

  describe("createCalendar", () => {
    it("应该成功创建日历", async () => {
      mockClient.calendar.v4.calendar.create.mockResolvedValueOnce({
        code: 0,
        data: {
          calendar: {
            calendar_id: "new_cal",
            summary: "新日历",
          },
        },
      });

      const result = await createCalendar(mockAccount, "新日历", "描述");

      expect(result.ok).toBe(true);
      expect(result.data?.calendarId).toBe("new_cal");
    });
  });

  describe("listEvents", () => {
    it("应该成功列出日程", async () => {
      mockClient.calendar.v4.calendarEvent.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            {
              event_id: "event_1",
              summary: "会议",
              start_time: { timestamp: "1704067200" },
              end_time: { timestamp: "1704070800" },
            },
          ],
        },
      });

      const result = await listEvents(mockAccount, "cal_1");

      expect(result.ok).toBe(true);
      expect(result.data?.events).toHaveLength(1);
      expect(result.data?.events[0].summary).toBe("会议");
    });

    it("应该支持时间范围过滤", async () => {
      mockClient.calendar.v4.calendarEvent.list.mockResolvedValueOnce({
        code: 0,
        data: { items: [] },
      });

      await listEvents(mockAccount, "cal_1", {
        startTime: 1704067200,
        endTime: 1704153600,
      });

      expect(mockClient.calendar.v4.calendarEvent.list).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            start_time: "1704067200",
            end_time: "1704153600",
          }),
        })
      );
    });
  });

  describe("getEvent", () => {
    it("应该成功获取日程详情", async () => {
      mockClient.calendar.v4.calendarEvent.get.mockResolvedValueOnce({
        code: 0,
        data: {
          event: {
            event_id: "event_1",
            summary: "重要会议",
            description: "项目讨论",
            start_time: { timestamp: "1704067200" },
            end_time: { timestamp: "1704070800" },
            location: { name: "会议室A" },
          },
        },
      });

      const result = await getEvent(mockAccount, "cal_1", "event_1");

      expect(result.ok).toBe(true);
      expect(result.data?.summary).toBe("重要会议");
      expect(result.data?.location).toBe("会议室A");
    });
  });

  describe("createEvent", () => {
    it("应该成功创建日程", async () => {
      mockClient.calendar.v4.calendarEvent.create.mockResolvedValueOnce({
        code: 0,
        data: {
          event: {
            event_id: "new_event",
            summary: "新会议",
            start_time: { timestamp: "1704067200" },
            end_time: { timestamp: "1704070800" },
          },
        },
      });

      const result = await createEvent(mockAccount, "cal_1", {
        summary: "新会议",
        startTime: 1704067200,
        endTime: 1704070800,
      });

      expect(result.ok).toBe(true);
      expect(result.data?.eventId).toBe("new_event");
    });

    it("应该支持 Date 对象", async () => {
      mockClient.calendar.v4.calendarEvent.create.mockResolvedValueOnce({
        code: 0,
        data: {
          event: {
            event_id: "new_event",
            summary: "日期测试",
            start_time: { timestamp: "1704067200" },
            end_time: { timestamp: "1704070800" },
          },
        },
      });

      const startDate = new Date("2024-01-01T10:00:00Z");
      const endDate = new Date("2024-01-01T11:00:00Z");

      const result = await createEvent(mockAccount, "cal_1", {
        summary: "日期测试",
        startTime: startDate,
        endTime: endDate,
      });

      expect(result.ok).toBe(true);
    });
  });

  describe("updateEvent", () => {
    it("应该成功更新日程", async () => {
      mockClient.calendar.v4.calendarEvent.patch.mockResolvedValueOnce({
        code: 0,
        data: {
          event: {
            event_id: "event_1",
            summary: "更新后的会议",
            start_time: { timestamp: "1704067200" },
            end_time: { timestamp: "1704070800" },
          },
        },
      });

      const result = await updateEvent(mockAccount, "cal_1", "event_1", {
        summary: "更新后的会议",
      });

      expect(result.ok).toBe(true);
      expect(result.data?.summary).toBe("更新后的会议");
    });
  });

  describe("deleteEvent", () => {
    it("应该成功删除日程", async () => {
      mockClient.calendar.v4.calendarEvent.delete.mockResolvedValueOnce({
        code: 0,
      });

      const result = await deleteEvent(mockAccount, "cal_1", "event_1");

      expect(result.ok).toBe(true);
    });
  });

  describe("searchEvents", () => {
    it("应该成功搜索日程", async () => {
      mockClient.calendar.v4.calendarEvent.search.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            {
              event_id: "event_1",
              summary: "项目会议",
              start_time: { timestamp: "1704067200" },
              end_time: { timestamp: "1704070800" },
            },
          ],
        },
      });

      const result = await searchEvents(mockAccount, "cal_1", "项目");

      expect(result.ok).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("listAttendees", () => {
    it("应该成功获取参与者列表", async () => {
      mockClient.calendar.v4.calendarEventAttendee.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            { user_id: "user_1", display_name: "张三", rsvp_status: "accepted" },
            { user_id: "user_2", display_name: "李四", rsvp_status: "tentative" },
          ],
        },
      });

      const result = await listAttendees(mockAccount, "cal_1", "event_1");

      expect(result.ok).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].displayName).toBe("张三");
    });
  });

  describe("addAttendees", () => {
    it("应该成功添加参与者", async () => {
      mockClient.calendar.v4.calendarEventAttendee.create.mockResolvedValueOnce({
        code: 0,
      });

      const result = await addAttendees(mockAccount, "cal_1", "event_1", [
        { userId: "user_1" },
        { email: "test@example.com" },
      ]);

      expect(result.ok).toBe(true);
    });
  });

  describe("queryFreeBusy", () => {
    it("应该成功查询忙闲状态", async () => {
      mockClient.calendar.v4.freebusy.list.mockResolvedValueOnce({
        code: 0,
        data: {
          freebusy_list: [
            { start_time: "1704067200", end_time: "1704070800" },
            { start_time: "1704081600", end_time: "1704085200" },
          ],
        },
      });

      const result = await queryFreeBusy(mockAccount, ["user_1"], 1704067200, 1704153600);

      expect(result.ok).toBe(true);
      expect(result.data?.[0].busyPeriods).toHaveLength(2);
    });
  });
});

describe("parseTimeString", () => {
  it("应该解析标准日期格式", () => {
    const result = parseTimeString("2024-01-15 14:30");
    expect(result).not.toBeNull();
  });

  it("应该解析'今天'", () => {
    const result = parseTimeString("今天 14:30");
    expect(result).not.toBeNull();

    const date = new Date(result! * 1000);
    const today = new Date();
    expect(date.getDate()).toBe(today.getDate());
    expect(date.getHours()).toBe(14);
    expect(date.getMinutes()).toBe(30);
  });

  it("应该解析'明天'", () => {
    const result = parseTimeString("明天 10:00");
    expect(result).not.toBeNull();

    const date = new Date(result! * 1000);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(date.getDate()).toBe(tomorrow.getDate());
  });

  it("应该解析'后天'", () => {
    const result = parseTimeString("后天 09:00");
    expect(result).not.toBeNull();

    const date = new Date(result! * 1000);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    expect(date.getDate()).toBe(dayAfterTomorrow.getDate());
  });

  it("应该返回 null 对于无法解析的字符串", () => {
    const result = parseTimeString("无效时间");
    expect(result).toBeNull();
  });
});
