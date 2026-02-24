/**
 * 飞书日历 API
 *
 * 支持的操作：
 * - 日历管理
 * - 日程 CRUD
 * - 参与者管理
 * - 忙闲查询
 */

import type { ResolvedFeishuAccount, ApiResult } from "./types.js";
import { getFeishuClient } from "./client.js";

// ==================== 类型定义 ====================

/** 日历信息 */
export interface Calendar {
  calendarId: string;
  summary: string;
  description?: string;
  type: "primary" | "shared" | "google" | "resource" | "exchange";
  role: "owner" | "writer" | "reader" | "free_busy_reader";
  color?: number;
}

/** 日程信息 */
export interface CalendarEvent {
  eventId: string;
  summary: string;
  description?: string;
  startTime: number; // Unix 时间戳（秒）
  endTime: number;
  isAllDay?: boolean;
  location?: string;
  color?: number;
  status?: "tentative" | "confirmed" | "cancelled";
  visibility?: "default" | "public" | "private";
  attendees?: EventAttendee[];
  organizer?: {
    userId?: string;
    displayName?: string;
  };
  recurrence?: string; // RRULE 格式
  meetingUrl?: string;
}

/** 日程参与者 */
export interface EventAttendee {
  userId?: string;
  displayName?: string;
  email?: string;
  status?: "needs_action" | "accepted" | "declined" | "tentative";
  isOptional?: boolean;
  isOrganizer?: boolean;
}

/** 忙闲信息 */
export interface FreeBusyInfo {
  userId: string;
  busyPeriods: Array<{
    startTime: number;
    endTime: number;
  }>;
}

/** 创建日程参数 */
export interface CreateEventParams {
  summary: string;
  description?: string;
  startTime: number | Date;
  endTime: number | Date;
  isAllDay?: boolean;
  location?: string;
  attendees?: Array<{ userId?: string; email?: string }>;
  visibility?: "default" | "public" | "private";
  reminders?: Array<{ minutes: number }>;
  recurrence?: string;
  color?: number;
}

// ==================== 日历操作 ====================

/**
 * 获取日历列表
 */
export async function listCalendars(
  account: ResolvedFeishuAccount
): Promise<ApiResult<Calendar[]>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.calendar.v4.calendar.list({
      params: { page_size: 50 },
    });

    if (result.code === 0) {
      const calendars = (result.data?.calendar_list || []).map((c: any) => ({
        calendarId: c.calendar_id,
        summary: c.summary || "",
        description: c.description,
        type: c.type || "primary",
        role: c.role || "reader",
        color: c.color,
      }));
      return { ok: true, data: calendars };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取主日历
 */
export async function getPrimaryCalendar(
  account: ResolvedFeishuAccount
): Promise<ApiResult<Calendar>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.calendar.v4.calendar.primary({});

    if (result.code === 0 && result.data?.calendars?.[0]) {
      const c = result.data.calendars[0].calendar;
      return {
        ok: true,
        data: {
          calendarId: c?.calendar_id || "",
          summary: c?.summary || "主日历",
          description: c?.description,
          type: "primary",
          role: "owner",
          color: c?.color,
        },
      };
    }
    return { ok: false, error: result.msg || "未找到主日历" };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 创建日历
 */
export async function createCalendar(
  account: ResolvedFeishuAccount,
  summary: string,
  description?: string
): Promise<ApiResult<Calendar>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.calendar.v4.calendar.create({
      data: {
        summary,
        description,
      },
    });

    if (result.code === 0 && result.data?.calendar) {
      const c = result.data.calendar;
      return {
        ok: true,
        data: {
          calendarId: c.calendar_id!,
          summary: c.summary || summary,
          description: c.description,
          type: "shared",
          role: "owner",
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 日程操作 ====================

/**
 * 获取日程列表
 */
export async function listEvents(
  account: ResolvedFeishuAccount,
  calendarId: string,
  options?: {
    startTime?: number | Date;
    endTime?: number | Date;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ events: CalendarEvent[]; pageToken?: string }>> {
  const client = getFeishuClient(account);

  const startTs = options?.startTime
    ? typeof options.startTime === "number"
      ? options.startTime
      : Math.floor(options.startTime.getTime() / 1000)
    : undefined;
  const endTs = options?.endTime
    ? typeof options.endTime === "number"
      ? options.endTime
      : Math.floor(options.endTime.getTime() / 1000)
    : undefined;

  try {
    const result = await client.calendar.v4.calendarEvent.list({
      path: { calendar_id: calendarId },
      params: {
        start_time: startTs?.toString(),
        end_time: endTs?.toString(),
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const events = (result.data?.items || []).map((e: any) => parseEvent(e));
      return {
        ok: true,
        data: {
          events,
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
 * 获取日程详情
 */
export async function getEvent(
  account: ResolvedFeishuAccount,
  calendarId: string,
  eventId: string
): Promise<ApiResult<CalendarEvent>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.calendar.v4.calendarEvent.get({
      path: { calendar_id: calendarId, event_id: eventId },
    });

    if (result.code === 0 && result.data?.event) {
      return { ok: true, data: parseEvent(result.data.event) };
    }
    return { ok: false, error: result.msg || "日程不存在" };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 创建日程
 */
export async function createEvent(
  account: ResolvedFeishuAccount,
  calendarId: string,
  params: CreateEventParams
): Promise<ApiResult<CalendarEvent>> {
  const client = getFeishuClient(account);

  const startTs =
    typeof params.startTime === "number"
      ? params.startTime
      : Math.floor(params.startTime.getTime() / 1000);
  const endTs =
    typeof params.endTime === "number"
      ? params.endTime
      : Math.floor(params.endTime.getTime() / 1000);

  try {
    const eventData: any = {
      summary: params.summary,
      description: params.description,
      start_time: {
        timestamp: startTs.toString(),
      },
      end_time: {
        timestamp: endTs.toString(),
      },
      visibility: params.visibility,
      color: params.color,
    };

    if (params.isAllDay) {
      // 全天日程使用日期格式
      eventData.start_time = {
        date: formatDate(startTs),
      };
      eventData.end_time = {
        date: formatDate(endTs),
      };
    }

    if (params.location) {
      eventData.location = { name: params.location };
    }

    if (params.attendees?.length) {
      eventData.attendee_ability = "can_modify_event";
    }

    if (params.reminders?.length) {
      eventData.reminders = params.reminders.map((r) => ({
        minutes: r.minutes,
      }));
    }

    if (params.recurrence) {
      eventData.recurrence = params.recurrence;
    }

    const result = await client.calendar.v4.calendarEvent.create({
      path: { calendar_id: calendarId },
      data: eventData,
    });

    if (result.code === 0 && result.data?.event) {
      const event = parseEvent(result.data.event);

      // 如果有参与者，单独添加
      if (params.attendees?.length) {
        await addAttendees(account, calendarId, event.eventId, params.attendees);
      }

      return { ok: true, data: event };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 更新日程
 */
export async function updateEvent(
  account: ResolvedFeishuAccount,
  calendarId: string,
  eventId: string,
  params: Partial<CreateEventParams>
): Promise<ApiResult<CalendarEvent>> {
  const client = getFeishuClient(account);

  try {
    const eventData: any = {};

    if (params.summary !== undefined) {
      eventData.summary = params.summary;
    }
    if (params.description !== undefined) {
      eventData.description = params.description;
    }
    if (params.startTime !== undefined) {
      const startTs =
        typeof params.startTime === "number"
          ? params.startTime
          : Math.floor(params.startTime.getTime() / 1000);
      eventData.start_time = params.isAllDay
        ? { date: formatDate(startTs) }
        : { timestamp: startTs.toString() };
    }
    if (params.endTime !== undefined) {
      const endTs =
        typeof params.endTime === "number"
          ? params.endTime
          : Math.floor(params.endTime.getTime() / 1000);
      eventData.end_time = params.isAllDay
        ? { date: formatDate(endTs) }
        : { timestamp: endTs.toString() };
    }
    if (params.location !== undefined) {
      eventData.location = params.location ? { name: params.location } : null;
    }
    if (params.visibility !== undefined) {
      eventData.visibility = params.visibility;
    }
    if (params.color !== undefined) {
      eventData.color = params.color;
    }

    const result = await client.calendar.v4.calendarEvent.patch({
      path: { calendar_id: calendarId, event_id: eventId },
      data: eventData,
    });

    if (result.code === 0 && result.data?.event) {
      return { ok: true, data: parseEvent(result.data.event) };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除日程
 */
export async function deleteEvent(
  account: ResolvedFeishuAccount,
  calendarId: string,
  eventId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.calendar.v4.calendarEvent.delete({
      path: { calendar_id: calendarId, event_id: eventId },
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
 * 搜索日程
 */
export async function searchEvents(
  account: ResolvedFeishuAccount,
  calendarId: string,
  query: string,
  options?: {
    startTime?: number | Date;
    endTime?: number | Date;
  }
): Promise<ApiResult<CalendarEvent[]>> {
  const client = getFeishuClient(account);

  const startTs = options?.startTime
    ? typeof options.startTime === "number"
      ? options.startTime
      : Math.floor(options.startTime.getTime() / 1000)
    : undefined;
  const endTs = options?.endTime
    ? typeof options.endTime === "number"
      ? options.endTime
      : Math.floor(options.endTime.getTime() / 1000)
    : undefined;

  try {
    const result = await client.calendar.v4.calendarEvent.search({
      path: { calendar_id: calendarId },
      data: {
        query,
        filter: {
          start_time: startTs ? { timestamp: startTs.toString() } : undefined,
          end_time: endTs ? { timestamp: endTs.toString() } : undefined,
        },
      },
    });

    if (result.code === 0) {
      const events = (result.data?.items || []).map((e: any) => parseEvent(e));
      return { ok: true, data: events };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 参与者操作 ====================

/**
 * 获取日程参与者列表
 */
export async function listAttendees(
  account: ResolvedFeishuAccount,
  calendarId: string,
  eventId: string
): Promise<ApiResult<EventAttendee[]>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.calendar.v4.calendarEventAttendee.list({
      path: { calendar_id: calendarId, event_id: eventId },
      params: { page_size: 100 },
    });

    if (result.code === 0) {
      const attendees = (result.data?.items || []).map((a: any) => ({
        userId: a.user_id,
        displayName: a.display_name,
        email: a.email,
        status: a.rsvp_status,
        isOptional: a.is_optional,
        isOrganizer: a.is_organizer,
      }));
      return { ok: true, data: attendees };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 添加参与者
 */
export async function addAttendees(
  account: ResolvedFeishuAccount,
  calendarId: string,
  eventId: string,
  attendees: Array<{ userId?: string; email?: string; isOptional?: boolean }>
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const attendeeList = attendees.map((a) => ({
      type: (a.userId ? "user" : "third_party") as "user" | "third_party",
      user_id: a.userId,
      third_party_email: a.email,
      is_optional: a.isOptional,
    }));

    const result = await client.calendar.v4.calendarEventAttendee.create({
      path: { calendar_id: calendarId, event_id: eventId },
      params: { user_id_type: "open_id" },
      data: { attendees: attendeeList as any },
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
 * 移除参与者
 */
export async function removeAttendees(
  account: ResolvedFeishuAccount,
  calendarId: string,
  eventId: string,
  attendeeIds: string[]
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.calendar.v4.calendarEventAttendee.batchDelete({
      path: { calendar_id: calendarId, event_id: eventId },
      data: { attendee_ids: attendeeIds },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 忙闲查询 ====================

/**
 * 查询忙闲状态
 */
export async function queryFreeBusy(
  account: ResolvedFeishuAccount,
  userIds: string[],
  startTime: number | Date,
  endTime: number | Date
): Promise<ApiResult<FreeBusyInfo[]>> {
  const client = getFeishuClient(account);

  const startTs =
    typeof startTime === "number" ? startTime : Math.floor(startTime.getTime() / 1000);
  const endTs = typeof endTime === "number" ? endTime : Math.floor(endTime.getTime() / 1000);

  try {
    const result = await client.calendar.v4.freebusy.list({
      data: {
        time_min: startTs.toString(),
        time_max: endTs.toString(),
        user_id: userIds[0], // API 只支持单个用户
      },
      params: { user_id_type: "open_id" },
    });

    if (result.code === 0) {
      const freeBusyList: FreeBusyInfo[] = [];

      const busyPeriods = (result.data?.freebusy_list || []).map((fb: any) => ({
        startTime: parseInt(fb.start_time, 10),
        endTime: parseInt(fb.end_time, 10),
      }));

      freeBusyList.push({
        userId: userIds[0],
        busyPeriods,
      });

      return { ok: true, data: freeBusyList };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 辅助函数 ====================

/**
 * 解析日程对象
 */
function parseEvent(e: any): CalendarEvent {
  const startTime = e.start_time?.timestamp
    ? parseInt(e.start_time.timestamp, 10)
    : e.start_time?.date
      ? new Date(e.start_time.date).getTime() / 1000
      : 0;

  const endTime = e.end_time?.timestamp
    ? parseInt(e.end_time.timestamp, 10)
    : e.end_time?.date
      ? new Date(e.end_time.date).getTime() / 1000
      : 0;

  return {
    eventId: e.event_id,
    summary: e.summary || "",
    description: e.description,
    startTime,
    endTime,
    isAllDay: !!e.start_time?.date,
    location: e.location?.name,
    color: e.color,
    status: e.status,
    visibility: e.visibility,
    organizer: e.organizer
      ? {
          userId: e.organizer.user_id,
          displayName: e.organizer.display_name,
        }
      : undefined,
    recurrence: e.recurrence,
    meetingUrl: e.vchat?.meeting_url,
  };
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toISOString().split("T")[0];
}

/**
 * 解析时间字符串为时间戳
 * 支持格式：
 * - "2024-01-15 14:30"
 * - "明天 15:00"
 * - "下周一 10:00"
 */
export function parseTimeString(timeStr: string): number | null {
  // 尝试直接解析
  const directParse = new Date(timeStr);
  if (!isNaN(directParse.getTime())) {
    return Math.floor(directParse.getTime() / 1000);
  }

  const now = new Date();
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
  let hours = 0,
    minutes = 0;
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
  }

  if (timeStr.includes("今天")) {
    now.setHours(hours, minutes, 0, 0);
    return Math.floor(now.getTime() / 1000);
  }

  if (timeStr.includes("明天")) {
    now.setDate(now.getDate() + 1);
    now.setHours(hours, minutes, 0, 0);
    return Math.floor(now.getTime() / 1000);
  }

  if (timeStr.includes("后天")) {
    now.setDate(now.getDate() + 2);
    now.setHours(hours, minutes, 0, 0);
    return Math.floor(now.getTime() / 1000);
  }

  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  for (let i = 0; i < weekdays.length; i++) {
    if (timeStr.includes(`周${weekdays[i]}`) || timeStr.includes(`星期${weekdays[i]}`)) {
      const currentDay = now.getDay();
      let daysUntil = i - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      if (timeStr.includes("下周") || timeStr.includes("下星期")) {
        daysUntil += 7;
      }
      now.setDate(now.getDate() + daysUntil);
      now.setHours(hours, minutes, 0, 0);
      return Math.floor(now.getTime() / 1000);
    }
  }

  return null;
}

// ==================== 日历订阅 ====================

/**
 * 订阅日历
 */
export async function subscribeCalendar(
  account: ResolvedFeishuAccount,
  calendarId: string
): Promise<ApiResult<{ calendar: Calendar }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.calendar.v4.calendar.subscribe({
      path: { calendar_id: calendarId },
    });

    if (result.code === 0 && result.data?.calendar) {
      const c = result.data.calendar;
      return {
        ok: true,
        data: {
          calendar: {
            calendarId: c.calendar_id!,
            summary: c.summary || "",
            description: c.description,
            color: c.color
              ? typeof c.color === "string"
                ? parseInt(c.color, 10)
                : c.color
              : undefined,
            type: c.type as any,
            role: c.role as any,
          },
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 取消订阅日历
 */
export async function unsubscribeCalendar(
  account: ResolvedFeishuAccount,
  calendarId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.calendar.v4.calendar.unsubscribe({
      path: { calendar_id: calendarId },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 日历权限 (ACL) ====================

/** 日历访问控制 */
export interface CalendarAcl {
  aclId: string;
  userId?: string;
  role: "unknown" | "free_busy_reader" | "reader" | "writer" | "owner";
  scope: {
    type: "user" | "group" | "domain" | "public";
    userId?: string;
  };
}

/**
 * 获取日历访问控制列表
 */
export async function listCalendarAcls(
  account: ResolvedFeishuAccount,
  calendarId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ acls: CalendarAcl[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.calendar.v4.calendarAcl.list({
      path: { calendar_id: calendarId },
      params: {
        user_id_type: "open_id",
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const acls = (result.data?.acls || []).map((a: any) => ({
        aclId: a.acl_id,
        userId: a.user_id,
        role: a.role,
        scope: {
          type: a.scope?.type,
          userId: a.scope?.user_id,
        },
      }));

      return {
        ok: true,
        data: {
          acls,
          pageToken: result.data?.page_token,
          hasMore: result.data?.has_more,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 添加日历访问控制
 */
export async function addCalendarAcl(
  account: ResolvedFeishuAccount,
  calendarId: string,
  userId: string,
  role: "free_busy_reader" | "reader" | "writer"
): Promise<ApiResult<CalendarAcl>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.calendar.v4.calendarAcl.create({
      path: { calendar_id: calendarId },
      params: { user_id_type: "open_id" },
      data: {
        role,
        scope: {
          type: "user",
          user_id: userId,
        },
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: {
          aclId: result.data?.acl_id || "",
          userId,
          role,
          scope: { type: "user", userId },
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除日历访问控制
 */
export async function removeCalendarAcl(
  account: ResolvedFeishuAccount,
  calendarId: string,
  aclId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.calendar.v4.calendarAcl.delete({
      path: { calendar_id: calendarId, acl_id: aclId },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
