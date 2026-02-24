/**
 * 飞书搜索 API
 *
 * 支持的操作：
 * - 消息搜索
 * - 云文档搜索
 * - 应用数据搜索
 */

import type { ResolvedFeishuAccount, ApiResult } from "./types.js";
import { getFeishuClient } from "./client.js";

// ==================== 类型定义 ====================

/** 搜索结果项 - 消息 */
export interface MessageSearchResult {
  messageId: string;
  chatId: string;
  chatType: "p2p" | "group";
  senderId: string;
  senderName?: string;
  content: string;
  messageType: string;
  createTime: number;
  highlights?: string[];
}

/** 搜索结果项 - 文档 */
export interface DocSearchResult {
  docToken: string;
  docType: "doc" | "docx" | "sheet" | "bitable" | "mindnote" | "slides" | "wiki" | "file";
  title: string;
  url: string;
  owner?: {
    userId?: string;
    name?: string;
  };
  createTime?: number;
  updateTime?: number;
  highlights?: string[];
}

/** 搜索结果项 - 应用数据 */
export interface AppDataSearchResult {
  itemId: string;
  title: string;
  url?: string;
  summary?: string;
  highlights?: string[];
}

/** 搜索过滤器 */
export interface SearchFilter {
  /** 时间范围 - 开始 */
  startTime?: number | Date;
  /** 时间范围 - 结束 */
  endTime?: number | Date;
  /** 发送者/创建者 ID */
  userIds?: string[];
  /** 聊天 ID（消息搜索） */
  chatIds?: string[];
  /** 文档类型（文档搜索） */
  docTypes?: Array<"doc" | "docx" | "sheet" | "bitable" | "mindnote" | "slides" | "wiki" | "file">;
  /** 所有者类型 */
  ownerType?: "anyone" | "me" | "shared_with_me";
}

// ==================== 消息搜索 ====================

/**
 * 搜索消息
 */
export async function searchMessages(
  account: ResolvedFeishuAccount,
  query: string,
  options?: {
    filter?: SearchFilter;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ results: MessageSearchResult[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const searchData: any = {
      query,
      page_size: options?.pageSize || 20,
      page_token: options?.pageToken,
    };

    // 添加过滤器
    if (options?.filter) {
      const filter = options.filter;

      if (filter.startTime) {
        searchData.start_time =
          typeof filter.startTime === "number"
            ? filter.startTime.toString()
            : Math.floor(filter.startTime.getTime() / 1000).toString();
      }

      if (filter.endTime) {
        searchData.end_time =
          typeof filter.endTime === "number"
            ? filter.endTime.toString()
            : Math.floor(filter.endTime.getTime() / 1000).toString();
      }

      if (filter.userIds?.length) {
        searchData.from_user_ids = filter.userIds;
      }

      if (filter.chatIds?.length) {
        searchData.chat_ids = filter.chatIds;
      }
    }

    const result = await client.search.v2.message.create({
      params: { user_id_type: "open_id" },
      data: searchData,
    });

    if (result.code === 0) {
      const results: MessageSearchResult[] = (result.data?.items || []).map((item: any) => ({
        messageId: item.message_id,
        chatId: item.chat_id,
        chatType: (item.chat_type === "p2p" ? "p2p" : "group") as "p2p" | "group",
        senderId: item.sender?.sender_id?.open_id || "",
        senderName: item.sender?.sender_id?.name,
        content: extractMessageContent(item),
        messageType: item.message_type || "text",
        createTime: parseInt(item.create_time, 10) || 0,
        highlights: item.hit_fields,
      }));

      return {
        ok: true,
        data: {
          results,
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

// ==================== 文档搜索 ====================

/**
 * 搜索云文档
 */
export async function searchDocs(
  account: ResolvedFeishuAccount,
  query: string,
  options?: {
    filter?: SearchFilter;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ results: DocSearchResult[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const searchData: any = {
      search_key: query,
      count: options?.pageSize || 20,
      offset: options?.pageToken ? parseInt(options.pageToken, 10) : 0,
    };

    // 添加过滤器
    if (options?.filter) {
      const filter = options.filter;

      if (filter.docTypes?.length) {
        searchData.docs_types = filter.docTypes;
      }

      if (filter.ownerType) {
        searchData.owner_ids_type = filter.ownerType;
      }
    }

    const result = (await (client as any).suite?.v1?.docsSearch?.create({
      data: searchData,
    })) || { code: -1, msg: "Suite API not available" };

    if (result.code === 0) {
      const results = (result.data?.docs_entities || []).map((doc: any) => ({
        docToken: doc.docs_token,
        docType: doc.docs_type,
        title: doc.title || "",
        url: doc.url || "",
        owner: doc.owner
          ? {
              userId: doc.owner.member_open_id,
              name: doc.owner.member_name,
            }
          : undefined,
        createTime: doc.create_time ? parseInt(doc.create_time, 10) : undefined,
        updateTime: doc.edit_time ? parseInt(doc.edit_time, 10) : undefined,
      }));

      const nextOffset =
        (options?.pageToken ? parseInt(options.pageToken, 10) : 0) + results.length;

      return {
        ok: true,
        data: {
          results,
          pageToken: result.data?.has_more ? nextOffset.toString() : undefined,
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
 * 搜索云空间文件（使用 Drive API）
 */
export async function searchDriveFiles(
  account: ResolvedFeishuAccount,
  query: string,
  options?: {
    folderToken?: string;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ results: DocSearchResult[]; pageToken?: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.drive.v1.file.list({
      params: {
        folder_token: options?.folderToken,
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      // 过滤匹配查询的文件
      const allFiles = result.data?.files || [];
      const queryLower = query.toLowerCase();

      const matchedFiles = allFiles.filter((f: any) => f.name?.toLowerCase().includes(queryLower));

      const results = matchedFiles.map((f: any) => ({
        docToken: f.token,
        docType: f.type as any,
        title: f.name || "",
        url: f.url || "",
        owner: f.owner_id ? { userId: f.owner_id } : undefined,
        createTime: f.created_time ? parseInt(f.created_time, 10) : undefined,
        updateTime: f.modified_time ? parseInt(f.modified_time, 10) : undefined,
      }));

      return {
        ok: true,
        data: {
          results,
          pageToken: result.data?.next_page_token,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 应用数据搜索 ====================

/**
 * 搜索应用数据
 */
export async function searchAppData(
  account: ResolvedFeishuAccount,
  query: string,
  options?: {
    dataSourceIds?: string[];
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ results: AppDataSearchResult[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.search.v2.app.create({
      params: { user_id_type: "open_id" },
      data: {
        query,
        page_size: options?.pageSize || 20,
        page_token: options?.pageToken,
        data_source_ids: options?.dataSourceIds,
      } as any,
    });

    if (result.code === 0) {
      const results = (result.data?.items || []).map((item: any) => ({
        itemId: item.data_source_id + ":" + item.id,
        title: item.title || "",
        url: item.url,
        summary: item.summary,
        highlights: item.hit_fields,
      }));

      return {
        ok: true,
        data: {
          results,
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

// ==================== 综合搜索 ====================

/** 综合搜索结果 */
export interface UniversalSearchResult {
  type: "message" | "doc" | "app";
  data: MessageSearchResult | DocSearchResult | AppDataSearchResult;
}

/**
 * 综合搜索（同时搜索消息和文档）
 */
export async function universalSearch(
  account: ResolvedFeishuAccount,
  query: string,
  options?: {
    searchTypes?: Array<"message" | "doc" | "app">;
    filter?: SearchFilter;
    pageSize?: number;
  }
): Promise<ApiResult<{ results: UniversalSearchResult[] }>> {
  const searchTypes = options?.searchTypes || ["message", "doc"];
  const pageSize = Math.floor((options?.pageSize || 20) / searchTypes.length);

  const results: UniversalSearchResult[] = [];

  // 并行执行搜索
  const promises: Promise<void>[] = [];

  if (searchTypes.includes("message")) {
    promises.push(
      searchMessages(account, query, { filter: options?.filter, pageSize }).then((res) => {
        if (res.ok && res.data) {
          for (const item of res.data.results) {
            results.push({ type: "message", data: item });
          }
        }
      })
    );
  }

  if (searchTypes.includes("doc")) {
    promises.push(
      searchDocs(account, query, { filter: options?.filter, pageSize }).then((res) => {
        if (res.ok && res.data) {
          for (const item of res.data.results) {
            results.push({ type: "doc", data: item });
          }
        }
      })
    );
  }

  if (searchTypes.includes("app")) {
    promises.push(
      searchAppData(account, query, { pageSize }).then((res) => {
        if (res.ok && res.data) {
          for (const item of res.data.results) {
            results.push({ type: "app", data: item });
          }
        }
      })
    );
  }

  try {
    await Promise.all(promises);
    return { ok: true, data: { results } };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 辅助函数 ====================

/**
 * 从搜索结果中提取消息内容
 */
function extractMessageContent(item: any): string {
  try {
    const body = item.body;
    if (!body?.content) return "";

    const content = JSON.parse(body.content);

    if (item.message_type === "text") {
      return content.text || "";
    }

    if (item.message_type === "post") {
      // 富文本消息，提取纯文本
      const extractText = (node: any): string => {
        if (typeof node === "string") return node;
        if (node.text) return node.text;
        if (Array.isArray(node)) return node.map(extractText).join("");
        if (node.content) return extractText(node.content);
        if (node.zh_cn?.content) return extractText(node.zh_cn.content);
        return "";
      };
      return extractText(content);
    }

    // 其他类型返回类型标识
    return `[${item.message_type}]`;
  } catch {
    return "";
  }
}

/**
 * 高亮搜索关键词
 */
export function highlightKeywords(text: string, query: string): string {
  if (!query) return text;

  const keywords = query.split(/\s+/).filter(Boolean);
  let result = text;

  for (const keyword of keywords) {
    const regex = new RegExp(`(${escapeRegex(keyword)})`, "gi");
    result = result.replace(regex, "**$1**");
  }

  return result;
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
