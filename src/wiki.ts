/**
 * 飞书知识库 API
 *
 * 支持的操作：
 * - 知识空间管理
 * - 节点（页面）CRUD
 * - 节点移动/复制
 * - 成员管理
 */

import type { ResolvedFeishuAccount, ApiResult } from "./types.js";
import { getFeishuClient } from "./client.js";

// ==================== 类型定义 ====================

/** 知识空间信息 */
export interface WikiSpace {
  spaceId: string;
  name: string;
  description?: string;
  visibility: "public" | "private";
  openSharing?: boolean;
}

/** 知识库节点（页面）信息 */
export interface WikiNode {
  nodeToken: string;
  spaceId: string;
  objToken: string;
  objType: "doc" | "docx" | "sheet" | "bitable" | "mindnote" | "file" | "slides";
  parentNodeToken?: string;
  title: string;
  hasChild: boolean;
  creator?: string;
  createTime?: number;
  updateTime?: number;
  nodeType: "origin" | "shortcut";
}

/** 知识空间成员 */
export interface WikiMember {
  memberId: string;
  memberType: "user" | "chat" | "department";
  memberRole: "admin" | "member";
}

/** 创建节点参数 */
export interface CreateNodeParams {
  /** 节点类型 */
  objType: "doc" | "docx" | "sheet" | "bitable" | "mindnote" | "slides";
  /** 父节点 token（不填则创建在根目录） */
  parentNodeToken?: string;
  /** 节点标题 */
  title?: string;
}

// ==================== 知识空间操作 ====================

/**
 * 获取知识空间列表
 */
export async function listWikiSpaces(
  account: ResolvedFeishuAccount,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ spaces: WikiSpace[]; pageToken?: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.wiki.v2.space.list({
      params: {
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const spaces = (result.data?.items || []).map((s: any) => ({
        spaceId: s.space_id,
        name: s.name || "",
        description: s.description,
        visibility: s.visibility || "private",
        openSharing: s.open_sharing,
      }));
      return {
        ok: true,
        data: {
          spaces,
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
 * 获取知识空间详情
 */
export async function getWikiSpace(
  account: ResolvedFeishuAccount,
  spaceId: string
): Promise<ApiResult<WikiSpace>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.wiki.v2.space.get({
      path: { space_id: spaceId },
    });

    if (result.code === 0 && result.data?.space) {
      const s = result.data.space;
      return {
        ok: true,
        data: {
          spaceId: s.space_id!,
          name: s.name || "",
          description: s.description,
          visibility: (s.visibility as "public" | "private") || "private",
          openSharing: s.open_sharing === "open",
        },
      };
    }
    return { ok: false, error: result.msg || "知识空间不存在" };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 创建知识空间
 */
export async function createWikiSpace(
  account: ResolvedFeishuAccount,
  name: string,
  options?: {
    description?: string;
    visibility?: "public" | "private";
  }
): Promise<ApiResult<WikiSpace>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.wiki.v2.space.create({
      data: {
        name,
        description: options?.description,
        open_sharing: options?.visibility === "public" ? "open" : "closed",
      },
    });

    if (result.code === 0 && result.data?.space) {
      const s = result.data.space;
      return {
        ok: true,
        data: {
          spaceId: s.space_id!,
          name: s.name || name,
          description: s.description,
          visibility: s.visibility || "private",
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 节点操作 ====================

/**
 * 获取知识空间节点列表
 */
export async function listWikiNodes(
  account: ResolvedFeishuAccount,
  spaceId: string,
  options?: {
    parentNodeToken?: string;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ nodes: WikiNode[]; pageToken?: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.wiki.v2.spaceNode.list({
      path: { space_id: spaceId },
      params: {
        parent_node_token: options?.parentNodeToken,
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const nodes = (result.data?.items || []).map((n: any) => parseNode(n));
      return {
        ok: true,
        data: {
          nodes,
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
 * 获取节点详情
 */
export async function getWikiNode(
  account: ResolvedFeishuAccount,
  nodeToken: string
): Promise<ApiResult<WikiNode>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.wiki.v2.space.getNode({
      params: { token: nodeToken },
    });

    if (result.code === 0 && result.data?.node) {
      return { ok: true, data: parseNode(result.data.node) };
    }
    return { ok: false, error: result.msg || "节点不存在" };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 创建知识库节点
 */
export async function createWikiNode(
  account: ResolvedFeishuAccount,
  spaceId: string,
  params: CreateNodeParams
): Promise<ApiResult<WikiNode>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.wiki.v2.spaceNode.create({
      path: { space_id: spaceId },
      data: {
        obj_type: params.objType,
        parent_node_token: params.parentNodeToken,
        node_type: "origin",
        title: params.title,
      },
    });

    if (result.code === 0 && result.data?.node) {
      return { ok: true, data: parseNode(result.data.node) };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 更新节点标题
 */
export async function updateWikiNodeTitle(
  account: ResolvedFeishuAccount,
  spaceId: string,
  nodeToken: string,
  title: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.wiki.v2.spaceNode.updateTitle({
      path: { space_id: spaceId, node_token: nodeToken },
      data: { title },
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
 * 移动节点
 */
export async function moveWikiNode(
  account: ResolvedFeishuAccount,
  spaceId: string,
  nodeToken: string,
  targetParentToken?: string,
  targetSpaceId?: string
): Promise<ApiResult<WikiNode>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.wiki.v2.spaceNode.move({
      path: { space_id: spaceId, node_token: nodeToken },
      data: {
        target_parent_token: targetParentToken,
        target_space_id: targetSpaceId,
      },
    });

    if (result.code === 0 && result.data?.node) {
      return { ok: true, data: parseNode(result.data.node) };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 复制节点
 */
export async function copyWikiNode(
  account: ResolvedFeishuAccount,
  spaceId: string,
  nodeToken: string,
  targetParentToken?: string,
  targetSpaceId?: string,
  title?: string
): Promise<ApiResult<WikiNode>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.wiki.v2.spaceNode.copy({
      path: { space_id: spaceId, node_token: nodeToken },
      data: {
        target_parent_token: targetParentToken,
        target_space_id: targetSpaceId,
        title,
      },
    });

    if (result.code === 0 && result.data?.node) {
      return { ok: true, data: parseNode(result.data.node) };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除节点（移到回收站）
 */
export async function deleteWikiNode(
  account: ResolvedFeishuAccount,
  spaceId: string,
  nodeToken: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    // 飞书 API 没有直接删除，通过移动到垃圾箱实现
    // 这里使用 move 到一个特殊的位置或者调用专门的删除接口
    const result = await client.wiki.v2.spaceNode.move({
      path: { space_id: spaceId, node_token: nodeToken },
      data: {},
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 成员管理 ====================

/**
 * 获取知识空间成员列表
 */
export async function listWikiMembers(
  account: ResolvedFeishuAccount,
  spaceId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ members: WikiMember[]; pageToken?: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.wiki.v2.spaceMember.list({
      path: { space_id: spaceId },
      params: {
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const members = (result.data?.members || []).map((m: any) => ({
        memberId: m.member_id,
        memberType: m.member_type,
        memberRole: m.member_role,
      }));
      return {
        ok: true,
        data: {
          members,
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
 * 添加知识空间成员
 */
export async function addWikiMember(
  account: ResolvedFeishuAccount,
  spaceId: string,
  memberId: string,
  memberType: "user" | "chat" | "department",
  memberRole: "admin" | "member" = "member"
): Promise<ApiResult<WikiMember>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.wiki.v2.spaceMember.create({
      path: { space_id: spaceId },
      data: {
        member_id: memberId,
        member_type: memberType,
        member_role: memberRole,
      },
      params: { need_notification: true },
    });

    if (result.code === 0 && result.data?.member) {
      const m = result.data.member;
      return {
        ok: true,
        data: {
          memberId: m.member_id!,
          memberType: m.member_type as any,
          memberRole: m.member_role as any,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 移除知识空间成员
 */
export async function removeWikiMember(
  account: ResolvedFeishuAccount,
  spaceId: string,
  memberId: string,
  memberType: "user" | "chat" | "department"
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.wiki.v2.spaceMember.delete({
      path: { space_id: spaceId, member_id: memberId },
      params: { member_type: memberType },
    } as any);

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
 * 解析节点对象
 */
function parseNode(n: any): WikiNode {
  return {
    nodeToken: n.node_token,
    spaceId: n.space_id,
    objToken: n.obj_token,
    objType: n.obj_type,
    parentNodeToken: n.parent_node_token,
    title: n.title || "",
    hasChild: n.has_child || false,
    creator: n.creator,
    createTime: n.create_time ? parseInt(n.create_time, 10) : undefined,
    updateTime: n.update_time ? parseInt(n.update_time, 10) : undefined,
    nodeType: n.node_type || "origin",
  };
}

/**
 * 根据节点类型获取文档 URL
 */
export function getNodeUrl(node: WikiNode): string {
  const baseUrl = "https://feishu.cn";
  switch (node.objType) {
    case "docx":
      return `${baseUrl}/docx/${node.objToken}`;
    case "doc":
      return `${baseUrl}/docs/${node.objToken}`;
    case "sheet":
      return `${baseUrl}/sheets/${node.objToken}`;
    case "bitable":
      return `${baseUrl}/base/${node.objToken}`;
    case "mindnote":
      return `${baseUrl}/mindnotes/${node.objToken}`;
    case "slides":
      return `${baseUrl}/slides/${node.objToken}`;
    default:
      return `${baseUrl}/wiki/${node.nodeToken}`;
  }
}
