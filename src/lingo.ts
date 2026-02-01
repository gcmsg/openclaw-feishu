/**
 * 飞书词典/百科 API
 *
 * 支持的操作：
 * - 词条 CRUD、搜索、匹配、高亮
 * - 分类管理
 * - 词库管理
 * - 草稿管理
 */

import type { ResolvedFeishuAccount, ApiResult } from "./types.js";
import { getFeishuClient } from "./client.js";

// ==================== 类型定义 ====================

/** 词条信息 */
export interface LingoEntity {
  entityId: string;
  mainKeys: Array<{ key: string; displayStatus?: number }>;
  aliases?: Array<{ key: string; displayStatus?: number }>;
  description?: string;
  richText?: string;
  relatedMeta?: {
    users?: Array<{ userId: string; title?: string }>;
    chats?: Array<{ chatId: string }>;
    docs?: Array<{ title?: string; url?: string }>;
    links?: Array<{ title?: string; url?: string }>;
    abbreviations?: Array<{ id?: string }>;
    classifications?: Array<{ id: string; name?: string; fatherId?: string }>;
    images?: Array<{ token: string }>;
  };
  statistics?: {
    likeCount?: number;
    dislikeCount?: number;
  };
  createTime?: number;
  updateTime?: number;
  creator?: string;
  updater?: string;
}

/** 分类信息 */
export interface LingoClassification {
  classificationId: string;
  name: string;
  fatherId?: string;
}

/** 词库信息 */
export interface LingoRepo {
  repoId: string;
  name: string;
}

/** 高亮结果 */
export interface HighlightResult {
  text: string;
  phrases: Array<{
    name: string;
    entityIds: string[];
    start: number;
    end: number;
  }>;
}

// ==================== 词条管理 ====================

/**
 * 创建词条
 */
export async function createEntity(
  account: ResolvedFeishuAccount,
  mainKey: string,
  description: string,
  options?: {
    aliases?: string[];
    richText?: string;
    repoId?: string;
    relatedMeta?: {
      userIds?: string[];
      chatIds?: string[];
      docUrls?: Array<{ title: string; url: string }>;
      links?: Array<{ title: string; url: string }>;
      classificationIds?: string[];
    };
  }
): Promise<ApiResult<LingoEntity>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.lingo.v1.entity.create({
      params: { repo_id: options?.repoId, user_id_type: "open_id" },
      data: {
        main_keys: [{ key: mainKey, display_status: 1 }],
        aliases: options?.aliases?.map((a) => ({ key: a, display_status: 1 })),
        description,
        rich_text: options?.richText,
        related_meta: options?.relatedMeta
          ? {
              users: options.relatedMeta.userIds?.map((id) => ({ id })),
              chats: options.relatedMeta.chatIds?.map((id) => ({ id })),
              docs: options.relatedMeta.docUrls?.map((d) => ({
                title: d.title,
                url: d.url,
              })),
              links: options.relatedMeta.links?.map((l) => ({
                title: l.title,
                url: l.url,
              })),
              classifications: options.relatedMeta.classificationIds?.map((id) => ({ id })),
            }
          : undefined,
      },
    });

    if (result.code === 0 && result.data?.entity) {
      return {
        ok: true,
        data: mapEntity(result.data.entity),
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取词条详情
 */
export async function getEntity(
  account: ResolvedFeishuAccount,
  entityId: string,
  options?: {
    repoId?: string;
  }
): Promise<ApiResult<LingoEntity>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.lingo.v1.entity.get({
      path: { entity_id: entityId },
      params: { repo_id: options?.repoId, user_id_type: "open_id" },
    });

    if (result.code === 0 && result.data?.entity) {
      return {
        ok: true,
        data: mapEntity(result.data.entity),
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 更新词条
 */
export async function updateEntity(
  account: ResolvedFeishuAccount,
  entityId: string,
  updates: {
    mainKey?: string;
    aliases?: string[];
    description?: string;
    richText?: string;
    repoId?: string;
  }
): Promise<ApiResult<LingoEntity>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.lingo.v1.entity.update({
      path: { entity_id: entityId },
      params: { repo_id: updates.repoId, user_id_type: "open_id" },
      data: {
        main_keys: updates.mainKey ? [{ key: updates.mainKey, display_status: 1 }] : undefined,
        aliases: updates.aliases?.map((a) => ({ key: a, display_status: 1 })),
        description: updates.description,
        rich_text: updates.richText,
      },
    });

    if (result.code === 0 && result.data?.entity) {
      return {
        ok: true,
        data: mapEntity(result.data.entity),
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除词条
 */
export async function deleteEntity(
  account: ResolvedFeishuAccount,
  entityId: string,
  options?: {
    repoId?: string;
  }
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.lingo.v1.entity.delete({
      path: { entity_id: entityId },
      params: { repo_id: options?.repoId },
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
 * 获取词条列表
 */
export async function listEntities(
  account: ResolvedFeishuAccount,
  options?: {
    repoId?: string;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ entities: LingoEntity[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.lingo.v1.entity.list({
      params: {
        repo_id: options?.repoId,
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
        user_id_type: "open_id",
      },
    });

    if (result.code === 0) {
      const entities = (result.data?.entities || []).map(mapEntity);
      return {
        ok: true,
        data: {
          entities,
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
 * 搜索词条
 */
export async function searchEntities(
  account: ResolvedFeishuAccount,
  query: string,
  options?: {
    repoId?: string;
    classificationFilter?: {
      include?: string[];
      exclude?: string[];
    };
    creatorFilter?: string[];
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ entities: LingoEntity[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.lingo.v1.entity.search({
      params: {
        repo_id: options?.repoId,
        page_size: options?.pageSize || 20,
        page_token: options?.pageToken,
        user_id_type: "open_id",
      },
      data: {
        query,
        classification_filter: options?.classificationFilter
          ? {
              include: options.classificationFilter.include,
              exclude: options.classificationFilter.exclude,
            }
          : undefined,
        creators: options?.creatorFilter,
      },
    });

    if (result.code === 0) {
      const entities = (result.data?.entities || []).map(mapEntity);
      return {
        ok: true,
        data: {
          entities,
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
 * 精准匹配词条
 */
export async function matchEntity(
  account: ResolvedFeishuAccount,
  word: string,
  options?: {
    repoId?: string;
  }
): Promise<ApiResult<LingoEntity | null>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.lingo.v1.entity.match({
      params: { repo_id: options?.repoId, user_id_type: "open_id" },
      data: { word },
    });

    if (result.code === 0) {
      if (result.data?.entity) {
        return { ok: true, data: mapEntity(result.data.entity) };
      }
      return { ok: true, data: null };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 高亮标记词条
 * 识别文本中的词条并返回高亮位置
 */
export async function highlightEntities(
  account: ResolvedFeishuAccount,
  text: string,
  options?: {
    repoId?: string;
  }
): Promise<ApiResult<HighlightResult>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.lingo.v1.entity.highlight({
      params: { repo_id: options?.repoId },
      data: { text },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: {
          text: result.data?.text || text,
          phrases:
            result.data?.phrases?.map((p: any) => ({
              name: p.name,
              entityIds: p.entity_ids || [],
              start: p.start,
              end: p.end,
            })) || [],
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 分类管理 ====================

/**
 * 获取分类列表
 */
export async function listClassifications(
  account: ResolvedFeishuAccount,
  options?: {
    repoId?: string;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<
  ApiResult<{
    classifications: LingoClassification[];
    pageToken?: string;
    hasMore?: boolean;
  }>
> {
  const client = getFeishuClient(account);

  try {
    const result = await client.lingo.v1.classification.list({
      params: {
        repo_id: options?.repoId,
        page_size: options?.pageSize || 100,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const classifications = (result.data?.items || []).map((c: any) => ({
        classificationId: c.id,
        name: c.name || "",
        fatherId: c.father_id,
      }));

      return {
        ok: true,
        data: {
          classifications,
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

// ==================== 词库管理 ====================

/**
 * 获取词库列表
 */
export async function listRepos(
  account: ResolvedFeishuAccount
): Promise<ApiResult<{ repos: LingoRepo[] }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.lingo.v1.repo.list({});

    if (result.code === 0) {
      const repos = (result.data?.items || []).map((r: any) => ({
        repoId: r.id,
        name: r.name || "",
      }));

      return { ok: true, data: { repos } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 草稿管理 ====================

/**
 * 创建词条草稿
 */
export async function createDraft(
  account: ResolvedFeishuAccount,
  entityId: string | null,
  mainKey: string,
  description: string,
  options?: {
    aliases?: string[];
    richText?: string;
    repoId?: string;
  }
): Promise<ApiResult<{ draftId: string; entity: LingoEntity }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.lingo.v1.draft.create({
      params: { repo_id: options?.repoId, user_id_type: "open_id" },
      data: {
        id: entityId || undefined,
        main_keys: [{ key: mainKey, display_status: 1 }],
        aliases: options?.aliases?.map((a) => ({ key: a, display_status: 1 })),
        description,
        rich_text: options?.richText,
      },
    });

    if (result.code === 0 && result.data?.draft) {
      return {
        ok: true,
        data: {
          draftId: result.data.draft.id || "",
          entity: mapEntity(result.data.draft),
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 更新词条草稿
 */
export async function updateDraft(
  account: ResolvedFeishuAccount,
  draftId: string,
  updates: {
    mainKey?: string;
    aliases?: string[];
    description?: string;
    richText?: string;
    repoId?: string;
  }
): Promise<ApiResult<{ entity: LingoEntity }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.lingo.v1.draft.update({
      path: { draft_id: draftId },
      params: { repo_id: updates.repoId, user_id_type: "open_id" },
      data: {
        main_keys: updates.mainKey ? [{ key: updates.mainKey, display_status: 1 }] : undefined,
        aliases: updates.aliases?.map((a) => ({ key: a, display_status: 1 })),
        description: updates.description,
        rich_text: updates.richText,
      },
    });

    if (result.code === 0 && result.data?.draft) {
      return {
        ok: true,
        data: {
          entity: mapEntity(result.data.draft),
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 辅助函数 ====================

function mapEntity(e: any): LingoEntity {
  return {
    entityId: e.id || "",
    mainKeys:
      e.main_keys?.map((k: any) => ({
        key: k.key,
        displayStatus: k.display_status,
      })) || [],
    aliases:
      e.aliases?.map((a: any) => ({
        key: a.key,
        displayStatus: a.display_status,
      })) || [],
    description: e.description,
    richText: e.rich_text,
    relatedMeta: e.related_meta
      ? {
          users: e.related_meta.users?.map((u: any) => ({
            userId: u.id,
            title: u.title,
          })),
          chats: e.related_meta.chats?.map((c: any) => ({
            chatId: c.id,
          })),
          docs: e.related_meta.docs?.map((d: any) => ({
            title: d.title,
            url: d.url,
          })),
          links: e.related_meta.links?.map((l: any) => ({
            title: l.title,
            url: l.url,
          })),
          abbreviations: e.related_meta.abbreviations,
          classifications: e.related_meta.classifications?.map((c: any) => ({
            id: c.id,
            name: c.name,
            fatherId: c.father_id,
          })),
          images: e.related_meta.images?.map((i: any) => ({
            token: i.token,
          })),
        }
      : undefined,
    statistics: e.statistics
      ? {
          likeCount: e.statistics.like_count,
          dislikeCount: e.statistics.dislike_count,
        }
      : undefined,
    createTime: e.create_time ? parseInt(e.create_time, 10) : undefined,
    updateTime: e.update_time ? parseInt(e.update_time, 10) : undefined,
    creator: e.creator,
    updater: e.updater,
  };
}
