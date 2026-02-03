/**
 * 飞书多维表格 API
 *
 * 支持的操作：
 * - 创建/获取多维表格应用
 * - 创建/获取数据表
 * - 字段管理
 * - 记录 CRUD（增删改查）
 */

import type { ResolvedFeishuAccount, ApiResult } from "./types.js";
import { getFeishuClient } from "./client.js";

// ==================== 类型定义 ====================

/** 多维表格应用信息 */
export interface BitableApp {
  appToken: string;
  name: string;
  url: string;
  revision?: number;
}

/** 数据表信息 */
export interface BitableTable {
  tableId: string;
  name: string;
  revision?: number;
}

/** 字段信息 */
export interface BitableField {
  fieldId: string;
  fieldName: string;
  type: number;
  typeName: string;
  property?: Record<string, any>;
}

/** 记录信息 */
export interface BitableRecord {
  recordId: string;
  fields: Record<string, any>;
  createdTime?: number;
  modifiedTime?: number;
}

/** 字段类型映射 */
const FIELD_TYPE_MAP: Record<number, string> = {
  1: "text",
  2: "number",
  3: "singleSelect",
  4: "multiSelect",
  5: "dateTime",
  7: "checkbox",
  11: "user",
  13: "phone",
  15: "url",
  17: "attachment",
  18: "singleLink",
  19: "formula",
  20: "duplexLink",
  21: "location",
  22: "groupChat",
  23: "createdTime",
  24: "modifiedTime",
  25: "createdUser",
  26: "modifiedUser",
  1001: "autoNumber",
};

// ==================== 应用操作 ====================

/**
 * 创建多维表格应用
 */
export async function createBitableApp(
  account: ResolvedFeishuAccount,
  name: string,
  folderId?: string
): Promise<ApiResult<BitableApp>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.app.create({
      data: {
        name,
        folder_token: folderId,
      },
    });

    if (result.code === 0 && result.data?.app) {
      const app = result.data.app;
      return {
        ok: true,
        data: {
          appToken: app.app_token!,
          name: app.name || name,
          url: `https://feishu.cn/base/${app.app_token}`,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取多维表格应用信息
 */
export async function getBitableApp(
  account: ResolvedFeishuAccount,
  appToken: string
): Promise<ApiResult<BitableApp>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.app.get({
      path: { app_token: appToken },
    });

    if (result.code === 0 && result.data?.app) {
      const app = result.data.app;
      return {
        ok: true,
        data: {
          appToken: app.app_token!,
          name: app.name || "",
          url: `https://feishu.cn/base/${app.app_token}`,
          revision: app.revision,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 数据表操作 ====================

/**
 * 列出多维表格中的数据表
 */
export async function listBitableTables(
  account: ResolvedFeishuAccount,
  appToken: string
): Promise<ApiResult<BitableTable[]>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTable.list({
      path: { app_token: appToken },
    });

    if (result.code === 0) {
      const tables = (result.data?.items || []).map((t: any) => ({
        tableId: t.table_id,
        name: t.name,
        revision: t.revision,
      }));
      return { ok: true, data: tables };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 创建数据表
 */
export async function createBitableTable(
  account: ResolvedFeishuAccount,
  appToken: string,
  name: string,
  defaultViewName?: string
): Promise<ApiResult<BitableTable>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTable.create({
      path: { app_token: appToken },
      data: {
        table: {
          name,
          default_view_name: defaultViewName,
        },
      },
    });

    if (result.code === 0 && result.data) {
      return {
        ok: true,
        data: {
          tableId: result.data.table_id!,
          name,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 字段操作 ====================

/**
 * 列出数据表的字段
 */
export async function listBitableFields(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string
): Promise<ApiResult<BitableField[]>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableField.list({
      path: { app_token: appToken, table_id: tableId },
    });

    if (result.code === 0) {
      const fields = (result.data?.items || []).map((f: any) => ({
        fieldId: f.field_id,
        fieldName: f.field_name,
        type: f.type,
        typeName: FIELD_TYPE_MAP[f.type] || "unknown",
        property: f.property,
      }));
      return { ok: true, data: fields };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 创建字段
 */
export async function createBitableField(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  fieldName: string,
  fieldType: number,
  property?: Record<string, any>
): Promise<ApiResult<BitableField>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableField.create({
      path: { app_token: appToken, table_id: tableId },
      data: {
        field_name: fieldName,
        type: fieldType,
        property,
      },
    });

    if (result.code === 0 && result.data?.field) {
      const f = result.data.field;
      return {
        ok: true,
        data: {
          fieldId: f.field_id!,
          fieldName: f.field_name!,
          type: f.type!,
          typeName: FIELD_TYPE_MAP[f.type!] || "unknown",
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 记录操作 ====================

/**
 * 查询记录
 */
export async function searchBitableRecords(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  options?: {
    filter?: string;
    sort?: string[];
    fieldNames?: string[];
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ records: BitableRecord[]; pageToken?: string; total?: number }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableRecord.search({
      path: { app_token: appToken, table_id: tableId },
      data: {
        filter: options?.filter ? { conditions: [], conjunction: "and" } : undefined,
        sort: options?.sort?.map((s) => {
          const [field, order] = s.split(":");
          return { field_name: field, desc: order === "desc" };
        }),
        field_names: options?.fieldNames,
        page_size: options?.pageSize || 100,
        page_token: options?.pageToken,
      } as any,
    });

    if (result.code === 0) {
      const records = (result.data?.items || []).map((r: any) => ({
        recordId: r.record_id,
        fields: r.fields || {},
        createdTime: r.created_time,
        modifiedTime: r.last_modified_time,
      }));
      return {
        ok: true,
        data: {
          records,
          pageToken: result.data?.page_token,
          total: result.data?.total,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取记录列表（简单查询）
 */
export async function listBitableRecords(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  options?: {
    viewId?: string;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ records: BitableRecord[]; pageToken?: string; total?: number }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableRecord.list({
      path: { app_token: appToken, table_id: tableId },
      params: {
        view_id: options?.viewId,
        page_size: options?.pageSize || 100,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const records = (result.data?.items || []).map((r: any) => ({
        recordId: r.record_id,
        fields: r.fields || {},
      }));
      return {
        ok: true,
        data: {
          records,
          pageToken: result.data?.page_token,
          total: result.data?.total,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取单条记录
 */
export async function getBitableRecord(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  recordId: string
): Promise<ApiResult<BitableRecord>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableRecord.get({
      path: { app_token: appToken, table_id: tableId, record_id: recordId },
    });

    if (result.code === 0 && result.data?.record) {
      const r = result.data.record;
      return {
        ok: true,
        data: {
          recordId: r.record_id!,
          fields: r.fields || {},
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 创建记录
 */
export async function createBitableRecord(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  fields: Record<string, any>
): Promise<ApiResult<BitableRecord>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableRecord.create({
      path: { app_token: appToken, table_id: tableId },
      data: { fields },
    });

    if (result.code === 0 && result.data?.record) {
      const r = result.data.record;
      return {
        ok: true,
        data: {
          recordId: r.record_id!,
          fields: r.fields || fields,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 批量创建记录
 */
export async function createBitableRecords(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  records: Array<{ fields: Record<string, any> }>
): Promise<ApiResult<{ records: BitableRecord[] }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableRecord.batchCreate({
      path: { app_token: appToken, table_id: tableId },
      data: { records },
    });

    if (result.code === 0) {
      const created = (result.data?.records || []).map((r: any) => ({
        recordId: r.record_id,
        fields: r.fields || {},
      }));
      return { ok: true, data: { records: created } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 更新记录
 */
export async function updateBitableRecord(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  recordId: string,
  fields: Record<string, any>
): Promise<ApiResult<BitableRecord>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableRecord.update({
      path: { app_token: appToken, table_id: tableId, record_id: recordId },
      data: { fields },
    });

    if (result.code === 0 && result.data?.record) {
      const r = result.data.record;
      return {
        ok: true,
        data: {
          recordId: r.record_id!,
          fields: r.fields || fields,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 批量更新记录
 */
export async function updateBitableRecords(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  records: Array<{ record_id: string; fields: Record<string, any> }>
): Promise<ApiResult<{ records: BitableRecord[] }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableRecord.batchUpdate({
      path: { app_token: appToken, table_id: tableId },
      data: { records },
    });

    if (result.code === 0) {
      const updated = (result.data?.records || []).map((r: any) => ({
        recordId: r.record_id,
        fields: r.fields || {},
      }));
      return { ok: true, data: { records: updated } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除记录
 */
export async function deleteBitableRecord(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  recordId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableRecord.delete({
      path: { app_token: appToken, table_id: tableId, record_id: recordId },
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
 * 批量删除记录
 */
export async function deleteBitableRecords(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  recordIds: string[]
): Promise<ApiResult<{ deleted: string[] }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableRecord.batchDelete({
      path: { app_token: appToken, table_id: tableId },
      data: { records: recordIds },
    });

    if (result.code === 0) {
      const deletedIds = (result.data?.records || [])
        .filter((r: any) => r.deleted)
        .map((r: any) => r.record_id as string);
      return {
        ok: true,
        data: { deleted: deletedIds },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 视图管理 ====================

/** 视图信息 */
export interface BitableView {
  viewId: string;
  viewName: string;
  viewType: "grid" | "kanban" | "gallery" | "form" | "gantt";
}

/**
 * 获取视图列表
 */
export async function listBitableViews(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ views: BitableView[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableView.list({
      path: { app_token: appToken, table_id: tableId },
      params: {
        page_size: options?.pageSize || 100,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const views = (result.data?.items || []).map((v: any) => ({
        viewId: v.view_id,
        viewName: v.view_name || "",
        viewType: v.view_type,
      }));

      return {
        ok: true,
        data: {
          views,
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
 * 获取视图详情
 */
export async function getBitableView(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  viewId: string
): Promise<ApiResult<BitableView>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableView.get({
      path: { app_token: appToken, table_id: tableId, view_id: viewId },
    });

    if (result.code === 0 && result.data?.view) {
      const v = result.data.view;
      return {
        ok: true,
        data: {
          viewId: v.view_id!,
          viewName: v.view_name || "",
          viewType: v.view_type as any,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 创建视图
 */
export async function createBitableView(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  viewName: string,
  viewType: "grid" | "kanban" | "gallery" | "form" | "gantt" = "grid"
): Promise<ApiResult<BitableView>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableView.create({
      path: { app_token: appToken, table_id: tableId },
      data: {
        view_name: viewName,
        view_type: viewType,
      },
    });

    if (result.code === 0 && result.data?.view) {
      const v = result.data.view;
      return {
        ok: true,
        data: {
          viewId: v.view_id!,
          viewName: v.view_name || viewName,
          viewType: v.view_type as any,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除视图
 */
export async function deleteBitableView(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  viewId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appTableView.delete({
      path: { app_token: appToken, table_id: tableId, view_id: viewId },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 角色管理 ====================

/** 角色信息 */
export interface BitableRole {
  roleId: string;
  roleName: string;
  tablePerm?: number;
  recPerm?: number;
  fieldPerm?: Record<string, number>;
}

/**
 * 获取角色列表
 */
export async function listBitableRoles(
  account: ResolvedFeishuAccount,
  appToken: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ roles: BitableRole[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appRole.list({
      path: { app_token: appToken },
      params: {
        page_size: options?.pageSize || 100,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const roles = (result.data?.items || []).map((r: any) => ({
        roleId: r.role_id,
        roleName: r.role_name || "",
        tablePerm: r.table_perm,
        recPerm: r.rec_perm,
      }));

      return {
        ok: true,
        data: {
          roles,
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
 * 创建角色
 */
export async function createBitableRole(
  account: ResolvedFeishuAccount,
  appToken: string,
  roleName: string,
  options?: {
    tablePerm?: number; // 1: 可读, 2: 可编辑, 4: 可管理
    recPerm?: number;
  }
): Promise<ApiResult<BitableRole>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appRole.create({
      path: { app_token: appToken },
      data: {
        role_name: roleName,
        table_perm: options?.tablePerm,
        rec_perm: options?.recPerm,
      } as any,
    });

    if (result.code === 0 && result.data?.role) {
      const r = result.data.role as any;
      return {
        ok: true,
        data: {
          roleId: r.role_id!,
          roleName: r.role_name || roleName,
          tablePerm: r.table_perm,
          recPerm: r.rec_perm,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 更新角色
 */
export async function updateBitableRole(
  account: ResolvedFeishuAccount,
  appToken: string,
  roleId: string,
  updates: {
    roleName?: string;
    tablePerm?: number;
    recPerm?: number;
  }
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appRole.update({
      path: { app_token: appToken, role_id: roleId },
      data: {
        role_name: updates.roleName,
        table_perm: updates.tablePerm,
        rec_perm: updates.recPerm,
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

/**
 * 删除角色
 */
export async function deleteBitableRole(
  account: ResolvedFeishuAccount,
  appToken: string,
  roleId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appRole.delete({
      path: { app_token: appToken, role_id: roleId },
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
 * 获取角色成员列表
 */
export async function listBitableRoleMembers(
  account: ResolvedFeishuAccount,
  appToken: string,
  roleId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<
  ApiResult<{ members: Array<{ memberId: string; memberType: string }>; pageToken?: string }>
> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appRoleMember.list({
      path: { app_token: appToken, role_id: roleId },
      params: {
        page_size: options?.pageSize || 100,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const members = (result.data?.items || []).map((m: any) => ({
        memberId: m.member_id,
        memberType: m.member_type,
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
 * 添加角色成员
 */
export async function addBitableRoleMember(
  account: ResolvedFeishuAccount,
  appToken: string,
  roleId: string,
  memberId: string,
  memberType: "user" | "chat" | "department" = "user"
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appRoleMember.create({
      path: { app_token: appToken, role_id: roleId },
      data: {
        member_id: memberId,
        member_type: memberType,
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

/**
 * 移除角色成员
 */
export async function removeBitableRoleMember(
  account: ResolvedFeishuAccount,
  appToken: string,
  roleId: string,
  memberId: string,
  memberType: "user" | "chat" | "department" = "user"
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appRoleMember.delete({
      path: { app_token: appToken, role_id: roleId, member_id: memberId },
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

// ==================== 自动化 ====================

/** 自动化规则信息 */
export interface BitableWorkflow {
  workflowId: string;
  workflowName: string;
  enabled: boolean;
}

/**
 * 获取自动化规则列表
 */
export async function listBitableWorkflows(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ workflows: BitableWorkflow[]; pageToken?: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appWorkflow.list({
      path: { app_token: appToken, table_id: tableId },
      params: {
        page_size: options?.pageSize || 100,
        page_token: options?.pageToken,
      },
    } as any);

    if (result.code === 0) {
      const data = result.data as any;
      const workflows = (data?.workflows || data?.items || []).map((w: any) => ({
        workflowId: w.workflow_id,
        workflowName: w.title || w.workflow_name || "",
        enabled: w.status === "active" || w.enabled || false,
      }));

      return {
        ok: true,
        data: {
          workflows,
          pageToken: data?.page_token,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 启用/禁用自动化规则
 */
export async function toggleBitableWorkflow(
  account: ResolvedFeishuAccount,
  appToken: string,
  tableId: string,
  workflowId: string,
  enabled: boolean
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.bitable.v1.appWorkflow.update({
      path: { app_token: appToken, table_id: tableId, workflow_id: workflowId },
      data: { enabled },
    } as any);

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
