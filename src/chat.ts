/**
 * 飞书聊天管理 API
 *
 * 支持的操作：
 * - 群聊 CRUD
 * - 成员管理
 * - 管理员管理
 * - Tab 管理
 * - 置顶消息
 * - 群公告
 */

import type { ResolvedFeishuAccount, ApiResult } from "./types.js";
import { getFeishuClient } from "./client.js";

// ==================== 类型定义 ====================

/** 群聊信息 */
export interface ChatInfo {
  chatId: string;
  name: string;
  avatar?: string;
  description?: string;
  ownerId?: string;
  chatMode?: "group" | "topic" | "p2p";
  chatType?: "private" | "public";
  external?: boolean;
  memberCount?: number;
}

/** 群成员信息 */
export interface ChatMember {
  memberId: string;
  memberIdType: "open_id" | "user_id" | "union_id";
  name?: string;
  tenantKey?: string;
}

/** Tab 信息 */
export interface ChatTab {
  tabId: string;
  tabName: string;
  tabType:
    | "message"
    | "doc_list"
    | "doc"
    | "pin"
    | "meeting_minute"
    | "chat_announcement"
    | "url"
    | "file";
  tabContent?: {
    url?: string;
    doc?: string;
    meetingMinute?: string;
  };
}

// ==================== 群聊管理 ====================

/**
 * 创建群聊
 */
export async function createChat(
  account: ResolvedFeishuAccount,
  name: string,
  options?: {
    description?: string;
    userIds?: string[];
    chatMode?: "group" | "topic";
    chatType?: "private" | "public";
    external?: boolean;
  }
): Promise<ApiResult<ChatInfo>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chat.create({
      params: { user_id_type: "open_id" },
      data: {
        name,
        description: options?.description,
        user_id_list: options?.userIds,
        chat_mode: options?.chatMode,
        chat_type: options?.chatType,
        external: options?.external,
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: {
          chatId: result.data?.chat_id || "",
          name,
          description: options?.description,
          chatMode: options?.chatMode,
          chatType: options?.chatType,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取群聊信息
 */
export async function getChat(
  account: ResolvedFeishuAccount,
  chatId: string
): Promise<ApiResult<ChatInfo>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chat.get({
      path: { chat_id: chatId },
      params: { user_id_type: "open_id" },
    });

    if (result.code === 0 && result.data) {
      const d = result.data as any;
      return {
        ok: true,
        data: {
          chatId: d.chat_id || chatId,
          name: d.name || "",
          avatar: d.avatar,
          description: d.description,
          ownerId: d.owner_id,
          chatMode: d.chat_mode,
          chatType: d.chat_type,
          external: d.external,
          memberCount: typeof d.user_count === 'string' ? parseInt(d.user_count, 10) : d.user_count,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 更新群聊信息
 */
export async function updateChat(
  account: ResolvedFeishuAccount,
  chatId: string,
  updates: {
    name?: string;
    description?: string;
    avatar?: string;
  }
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chat.update({
      path: { chat_id: chatId },
      data: updates,
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
 * 解散群聊
 */
export async function deleteChat(
  account: ResolvedFeishuAccount,
  chatId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chat.delete({
      path: { chat_id: chatId },
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
 * 获取群聊列表
 */
export async function listChats(
  account: ResolvedFeishuAccount,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ chats: ChatInfo[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chat.list({
      params: {
        user_id_type: "open_id",
        page_size: options?.pageSize || 100,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const chats = (result.data?.items || []).map((c: any) => ({
        chatId: c.chat_id,
        name: c.name || "",
        avatar: c.avatar,
        description: c.description,
        ownerId: c.owner_id,
        external: c.external,
      }));

      return {
        ok: true,
        data: {
          chats,
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
 * 搜索群聊
 */
export async function searchChats(
  account: ResolvedFeishuAccount,
  query: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ chats: ChatInfo[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chat.search({
      params: {
        user_id_type: "open_id",
        query,
        page_size: options?.pageSize || 20,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const chats = (result.data?.items || []).map((c: any) => ({
        chatId: c.chat_id,
        name: c.name || "",
        avatar: c.avatar,
        description: c.description,
        ownerId: c.owner_id,
      }));

      return {
        ok: true,
        data: {
          chats,
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

// ==================== 成员管理 ====================

/**
 * 添加群成员
 */
export async function addChatMembers(
  account: ResolvedFeishuAccount,
  chatId: string,
  userIds: string[]
): Promise<ApiResult<{ invalidUserIds?: string[] }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chatMembers.create({
      path: { chat_id: chatId },
      params: { member_id_type: "open_id" },
      data: {
        id_list: userIds,
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: { invalidUserIds: result.data?.invalid_id_list },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 移除群成员
 */
export async function removeChatMembers(
  account: ResolvedFeishuAccount,
  chatId: string,
  userIds: string[]
): Promise<ApiResult<{ invalidUserIds?: string[] }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chatMembers.delete({
      path: { chat_id: chatId },
      params: { member_id_type: "open_id" },
      data: {
        id_list: userIds,
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: { invalidUserIds: result.data?.invalid_id_list },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取群成员列表
 */
export async function getChatMembers(
  account: ResolvedFeishuAccount,
  chatId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<
  ApiResult<{ members: ChatMember[]; pageToken?: string; hasMore?: boolean; memberCount?: number }>
> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chatMembers.get({
      path: { chat_id: chatId },
      params: {
        member_id_type: "open_id",
        page_size: options?.pageSize || 100,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const members = (result.data?.items || []).map((m: any) => ({
        memberId: m.member_id,
        memberIdType: m.member_id_type,
        name: m.name,
        tenantKey: m.tenant_key,
      }));

      return {
        ok: true,
        data: {
          members,
          pageToken: result.data?.page_token,
          hasMore: result.data?.has_more,
          memberCount: result.data?.member_total,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 判断当前用户是否在群中
 * 注意: 飞书 API 只能检查当前 Bot/用户是否在群中
 */
export async function isUserInChat(
  account: ResolvedFeishuAccount,
  chatId: string,
  _userId?: string // 保留参数用于接口兼容，实际检查的是当前用户
): Promise<ApiResult<boolean>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chatMembers.isInChat({
      path: { chat_id: chatId },
      params: { member_id_type: "open_id" },
    } as any);

    if (result.code === 0) {
      return { ok: true, data: result.data?.is_in_chat || false };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 管理员管理 ====================

/**
 * 添加群管理员
 */
export async function addChatManagers(
  account: ResolvedFeishuAccount,
  chatId: string,
  managerIds: string[]
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chatManagers.addManagers({
      path: { chat_id: chatId },
      params: { member_id_type: "open_id" },
      data: {
        manager_ids: managerIds,
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
 * 移除群管理员
 */
export async function removeChatManagers(
  account: ResolvedFeishuAccount,
  chatId: string,
  managerIds: string[]
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chatManagers.deleteManagers({
      path: { chat_id: chatId },
      params: { member_id_type: "open_id" },
      data: {
        manager_ids: managerIds,
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

// ==================== Tab 管理 ====================

/**
 * 创建会话标签页
 */
export async function createChatTab(
  account: ResolvedFeishuAccount,
  chatId: string,
  tabName: string,
  tabType: "doc" | "url" | "file",
  tabContent: { url?: string; doc?: string }
): Promise<ApiResult<ChatTab>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chatTab.create({
      path: { chat_id: chatId },
      data: {
        chat_tabs: [
          {
            tab_name: tabName,
            tab_type: tabType,
            tab_content: {
              url: tabContent.url,
              doc: tabContent.doc,
            },
          },
        ],
      },
    });

    if (result.code === 0 && result.data?.chat_tabs?.[0]) {
      const tab = result.data.chat_tabs[0];
      return {
        ok: true,
        data: {
          tabId: tab.tab_id || "",
          tabName: tab.tab_name || tabName,
          tabType: tab.tab_type as any,
          tabContent: tab.tab_content,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取会话标签页列表
 */
export async function listChatTabs(
  account: ResolvedFeishuAccount,
  chatId: string
): Promise<ApiResult<{ tabs: ChatTab[] }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chatTab.listTabs({
      path: { chat_id: chatId },
    });

    if (result.code === 0) {
      const tabs = (result.data?.chat_tabs || []).map((t: any) => ({
        tabId: t.tab_id,
        tabName: t.tab_name || "",
        tabType: t.tab_type,
        tabContent: t.tab_content,
      }));

      return { ok: true, data: { tabs } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 更新会话标签页
 */
export async function updateChatTab(
  account: ResolvedFeishuAccount,
  chatId: string,
  tabId: string,
  tabName: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chatTab.updateTabs({
      path: { chat_id: chatId },
      data: {
        chat_tabs: [
          {
            tab_id: tabId,
            tab_name: tabName,
          } as any,
        ],
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
 * 删除会话标签页
 */
export async function deleteChatTabs(
  account: ResolvedFeishuAccount,
  chatId: string,
  tabIds: string[]
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chatTab.deleteTabs({
      path: { chat_id: chatId },
      data: {
        tab_ids: tabIds,
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

// ==================== 置顶消息 ====================

/**
 * 置顶消息
 */
export async function putTopNotice(
  account: ResolvedFeishuAccount,
  chatId: string,
  messageId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chatTopNotice.putTopNotice({
      path: { chat_id: chatId },
      data: {
        chat_top_notice: [
          {
            action_type: "1",
            message_id: messageId,
          },
        ],
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
 * 取消置顶消息
 */
export async function deleteTopNotice(
  account: ResolvedFeishuAccount,
  chatId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chatTopNotice.deleteTopNotice({
      path: { chat_id: chatId },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 群公告 ====================

/**
 * 获取群公告
 */
export async function getChatAnnouncement(
  account: ResolvedFeishuAccount,
  chatId: string
): Promise<
  ApiResult<{ content: string; revision: string; createTime?: number; updateTime?: number }>
> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chatAnnouncement.get({
      path: { chat_id: chatId },
      params: { user_id_type: "open_id" },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: {
          content: result.data?.content || "",
          revision: result.data?.revision || "",
          createTime: result.data?.create_time ? parseInt(result.data.create_time) : undefined,
          updateTime: result.data?.update_time ? parseInt(result.data.update_time) : undefined,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 更新群公告
 */
export async function updateChatAnnouncement(
  account: ResolvedFeishuAccount,
  chatId: string,
  content: string,
  revision: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.im.v1.chatAnnouncement.patch({
      path: { chat_id: chatId },
      data: {
        revision,
        requests: [
          {
            request_type: "1", // 更新
            update_content_request: {
              content,
            },
          },
        ],
      } as any,
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
