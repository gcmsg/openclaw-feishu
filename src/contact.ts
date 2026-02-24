/**
 * 飞书通讯录 API
 *
 * 支持的操作：
 * - 用户查询/管理
 * - 部门查询/管理
 * - 用户组管理
 */

import type { ResolvedFeishuAccount, ApiResult } from "./types.js";
import { getFeishuClient } from "./client.js";

// ==================== 类型定义 ====================

/** 用户信息 */
export interface ContactUser {
  userId: string;
  openId?: string;
  unionId?: string;
  name: string;
  enName?: string;
  nickname?: string;
  email?: string;
  mobile?: string;
  mobileVisible?: boolean;
  avatar?: {
    avatar72?: string;
    avatar240?: string;
    avatar640?: string;
    avatarOrigin?: string;
  };
  status?: {
    isFrozen?: boolean;
    isResigned?: boolean;
    isActivated?: boolean;
    isExited?: boolean;
    isUnjoin?: boolean;
  };
  departmentIds?: string[];
  leaderUserId?: string;
  city?: string;
  country?: string;
  workStation?: string;
  joinTime?: number;
  employeeNo?: string;
  employeeType?: number;
  jobTitle?: string;
  isTenantManager?: boolean;
}

/** 部门信息 */
export interface Department {
  departmentId: string;
  openDepartmentId?: string;
  name: string;
  i18nName?: { zhCn?: string; enUs?: string; jaJp?: string };
  parentDepartmentId?: string;
  status?: { isDeleted?: boolean };
  leaderUserId?: string;
  chatId?: string;
  order?: number;
  memberCount?: number;
  primaryMemberCount?: number;
}

/** 用户组 */
export interface ContactGroup {
  groupId: string;
  name: string;
  description?: string;
  memberCount?: number;
  memberUserCount?: number;
  memberDepartmentCount?: number;
  type?: number;
}

// ==================== 用户管理 ====================

/**
 * 获取用户信息
 */
export async function getUser(
  account: ResolvedFeishuAccount,
  userId: string,
  userIdType: "open_id" | "user_id" | "union_id" = "open_id"
): Promise<ApiResult<ContactUser>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.user.get({
      path: { user_id: userId },
      params: { user_id_type: userIdType },
    });

    if (result.code === 0 && result.data?.user) {
      const u = result.data.user;
      return {
        ok: true,
        data: mapUser(u),
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取用户列表
 */
export async function listUsers(
  account: ResolvedFeishuAccount,
  options?: {
    departmentId?: string;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ users: ContactUser[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = options?.departmentId
      ? await client.contact.v3.user.findByDepartment({
          params: {
            user_id_type: "open_id",
            department_id_type: "open_department_id",
            department_id: options.departmentId,
            page_size: options?.pageSize || 50,
            page_token: options?.pageToken,
          },
        })
      : await client.contact.v3.user.list({
          params: {
            user_id_type: "open_id",
            department_id_type: "open_department_id",
            page_size: options?.pageSize || 50,
            page_token: options?.pageToken,
          },
        });

    if (result.code === 0) {
      const users = (result.data?.items || []).map(mapUser);
      return {
        ok: true,
        data: {
          users,
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
 * 批量获取用户信息
 */
export async function batchGetUsers(
  account: ResolvedFeishuAccount,
  userIds: string[],
  userIdType: "open_id" | "user_id" | "union_id" = "open_id"
): Promise<ApiResult<{ users: ContactUser[] }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.user.batch({
      params: {
        user_ids: userIds,
        user_id_type: userIdType,
      },
    });

    if (result.code === 0) {
      const users = (result.data?.items || []).map(mapUser);
      return { ok: true, data: { users } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 批量获取用户 ID
 * 通过邮箱或手机号获取用户 ID
 */
export async function batchGetUserIds(
  account: ResolvedFeishuAccount,
  options: {
    emails?: string[];
    mobiles?: string[];
  }
): Promise<
  ApiResult<{
    userList: Array<{
      userId?: string;
      openId?: string;
      unionId?: string;
      email?: string;
      mobile?: string;
    }>;
  }>
> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.user.batchGetId({
      params: { user_id_type: "open_id" },
      data: {
        emails: options.emails,
        mobiles: options.mobiles,
      },
    });

    if (result.code === 0) {
      const userList = (result.data?.user_list || []).map((u: any) => ({
        userId: u.user_id,
        openId: u.open_id,
        unionId: u.union_id,
        email: u.email,
        mobile: u.mobile,
      }));
      return { ok: true, data: { userList } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 搜索用户（按部门）
 */
export async function searchUsersByDepartment(
  account: ResolvedFeishuAccount,
  departmentId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ users: ContactUser[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.user.findByDepartment({
      params: {
        user_id_type: "open_id",
        department_id_type: "open_department_id",
        department_id: departmentId,
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const users = (result.data?.items || []).map(mapUser);
      return {
        ok: true,
        data: {
          users,
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

// ==================== 部门管理 ====================

/**
 * 获取部门信息
 */
export async function getDepartment(
  account: ResolvedFeishuAccount,
  departmentId: string
): Promise<ApiResult<Department>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.department.get({
      path: { department_id: departmentId },
      params: {
        user_id_type: "open_id",
        department_id_type: "open_department_id",
      },
    });

    if (result.code === 0 && result.data?.department) {
      return {
        ok: true,
        data: mapDepartment(result.data.department),
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取部门列表
 */
export async function listDepartments(
  account: ResolvedFeishuAccount,
  options?: {
    parentDepartmentId?: string;
    fetchChild?: boolean;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ departments: Department[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.department.list({
      params: {
        user_id_type: "open_id",
        department_id_type: "open_department_id",
        parent_department_id: options?.parentDepartmentId || "0",
        fetch_child: options?.fetchChild,
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const departments = (result.data?.items || []).map(mapDepartment);
      return {
        ok: true,
        data: {
          departments,
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
 * 获取子部门列表
 */
export async function getChildDepartments(
  account: ResolvedFeishuAccount,
  departmentId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ departments: Department[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.department.children({
      path: { department_id: departmentId },
      params: {
        user_id_type: "open_id",
        department_id_type: "open_department_id",
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const departments = (result.data?.items || []).map(mapDepartment);
      return {
        ok: true,
        data: {
          departments,
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
 * 获取父部门列表
 */
export async function getParentDepartments(
  account: ResolvedFeishuAccount,
  departmentId: string
): Promise<ApiResult<{ departments: Department[] }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.department.parent({
      path: { department_id: departmentId },
      params: {
        user_id_type: "open_id",
        department_id_type: "open_department_id",
        department_id: departmentId,
      },
    } as any);

    if (result.code === 0) {
      const departments = (result.data?.items || []).map(mapDepartment);
      return { ok: true, data: { departments } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 搜索部门
 */
export async function searchDepartments(
  account: ResolvedFeishuAccount,
  query: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ departments: Department[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.department.search({
      params: {
        user_id_type: "open_id",
        department_id_type: "open_department_id",
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
      data: { query },
    });

    if (result.code === 0) {
      const departments = (result.data?.items || []).map(mapDepartment);
      return {
        ok: true,
        data: {
          departments,
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
 * 批量获取部门信息
 */
export async function batchGetDepartments(
  account: ResolvedFeishuAccount,
  departmentIds: string[]
): Promise<ApiResult<{ departments: Department[] }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.department.batch({
      params: {
        department_ids: departmentIds,
        user_id_type: "open_id",
        department_id_type: "open_department_id",
      },
    });

    if (result.code === 0) {
      const departments = (result.data?.items || []).map(mapDepartment);
      return { ok: true, data: { departments } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 用户组管理 ====================

/**
 * 获取用户组信息
 */
export async function getGroup(
  account: ResolvedFeishuAccount,
  groupId: string
): Promise<ApiResult<ContactGroup>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.group.get({
      path: { group_id: groupId },
    });

    if (result.code === 0 && result.data?.group) {
      const g = result.data.group;
      return {
        ok: true,
        data: {
          groupId: g.id || groupId,
          name: g.name || "",
          description: g.description,
          memberCount: (g.member_user_count || 0) + (g.member_department_count || 0),
          memberUserCount: g.member_user_count,
          memberDepartmentCount: g.member_department_count,
          type: g.type,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取用户组列表
 */
export async function listGroups(
  account: ResolvedFeishuAccount,
  options?: {
    pageSize?: number;
    pageToken?: string;
    type?: number;
  }
): Promise<ApiResult<{ groups: ContactGroup[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.group.simplelist({
      params: {
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
        type: options?.type,
      },
    });

    if (result.code === 0) {
      const groups = (result.data?.grouplist || []).map((g: any) => ({
        groupId: g.id,
        name: g.name || "",
        description: g.description,
        memberCount: g.member_count,
        memberUserCount: g.member_user_count,
        memberDepartmentCount: g.member_department_count,
        type: g.type,
      }));

      return {
        ok: true,
        data: {
          groups,
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
 * 查询用户所属用户组
 */
export async function getUserGroups(
  account: ResolvedFeishuAccount,
  userId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ groupIds: string[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.group.memberBelong({
      params: {
        member_id: userId,
        member_id_type: "open_id",
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: {
          groupIds: result.data?.group_list || [],
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
 * 创建用户组
 */
export async function createGroup(
  account: ResolvedFeishuAccount,
  name: string,
  options?: {
    description?: string;
    type?: number;
  }
): Promise<ApiResult<ContactGroup>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.group.create({
      data: {
        name,
        description: options?.description,
        type: options?.type,
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: {
          groupId: result.data?.group_id || "",
          name,
          description: options?.description,
          type: options?.type,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 更新用户组
 */
export async function updateGroup(
  account: ResolvedFeishuAccount,
  groupId: string,
  updates: {
    name?: string;
    description?: string;
  }
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.group.patch({
      path: { group_id: groupId },
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
 * 删除用户组
 */
export async function deleteGroup(
  account: ResolvedFeishuAccount,
  groupId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.group.delete({
      path: { group_id: groupId },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 用户组成员管理 ====================

/** 用户组成员 */
export interface GroupMember {
  memberId: string;
  memberType: "user" | "department";
  memberIdType?: string;
}

/**
 * 获取用户组成员列表
 */
export async function listGroupMembers(
  account: ResolvedFeishuAccount,
  groupId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ members: GroupMember[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.groupMember.simplelist({
      path: { group_id: groupId },
      params: {
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
        member_id_type: "open_id",
      },
    });

    if (result.code === 0) {
      const members = (result.data?.memberlist || []).map((m: any) => ({
        memberId: m.member_id,
        memberType: m.member_type,
        memberIdType: m.member_id_type,
      }));

      return {
        ok: true,
        data: {
          members,
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
 * 添加用户组成员
 */
export async function addGroupMember(
  account: ResolvedFeishuAccount,
  groupId: string,
  memberId: string,
  memberType: "user" | "department" = "user"
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.groupMember.add({
      path: { group_id: groupId },
      params: { member_id_type: "open_id" },
      data: {
        member_id: memberId,
        member_type: memberType as "user",
        member_id_type: "open_id",
      },
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
 * 批量添加用户组成员
 */
export async function batchAddGroupMembers(
  account: ResolvedFeishuAccount,
  groupId: string,
  members: Array<{ memberId: string; memberType: "user" | "department" }>
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.groupMember.batchAdd({
      path: { group_id: groupId },
      params: { member_id_type: "open_id" },
      data: {
        members: members.map((m) => ({
          member_id: m.memberId,
          member_type: m.memberType as "user",
        })),
      },
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
 * 移除用户组成员
 */
export async function removeGroupMember(
  account: ResolvedFeishuAccount,
  groupId: string,
  memberId: string,
  memberType: "user" | "department" = "user"
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.groupMember.remove({
      path: { group_id: groupId },
      params: { member_id_type: "open_id" },
      data: {
        member_id: memberId,
        member_type: memberType as "user",
        member_id_type: "open_id",
      },
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
 * 批量移除用户组成员
 */
export async function batchRemoveGroupMembers(
  account: ResolvedFeishuAccount,
  groupId: string,
  members: Array<{ memberId: string; memberType: "user" | "department" }>
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.contact.v3.groupMember.batchRemove({
      path: { group_id: groupId },
      params: { member_id_type: "open_id" },
      data: {
        members: members.map((m) => ({
          member_id: m.memberId,
          member_type: m.memberType as "user",
        })),
      },
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

function mapUser(u: any): ContactUser {
  return {
    userId: u.user_id || "",
    openId: u.open_id,
    unionId: u.union_id,
    name: u.name || "",
    enName: u.en_name,
    nickname: u.nickname,
    email: u.email,
    mobile: u.mobile,
    mobileVisible: u.mobile_visible,
    avatar: u.avatar
      ? {
          avatar72: u.avatar.avatar_72,
          avatar240: u.avatar.avatar_240,
          avatar640: u.avatar.avatar_640,
          avatarOrigin: u.avatar.avatar_origin,
        }
      : undefined,
    status: u.status
      ? {
          isFrozen: u.status.is_frozen,
          isResigned: u.status.is_resigned,
          isActivated: u.status.is_activated,
          isExited: u.status.is_exited,
          isUnjoin: u.status.is_unjoin,
        }
      : undefined,
    departmentIds: u.department_ids,
    leaderUserId: u.leader_user_id,
    city: u.city,
    country: u.country,
    workStation: u.work_station,
    joinTime: u.join_time ? parseInt(u.join_time, 10) : undefined,
    employeeNo: u.employee_no,
    employeeType: u.employee_type,
    jobTitle: u.job_title,
    isTenantManager: u.is_tenant_manager,
  };
}

function mapDepartment(d: any): Department {
  return {
    departmentId: d.department_id || d.open_department_id || "",
    openDepartmentId: d.open_department_id,
    name: d.name || "",
    i18nName: d.i18n_name
      ? {
          zhCn: d.i18n_name.zh_cn,
          enUs: d.i18n_name.en_us,
          jaJp: d.i18n_name.ja_jp,
        }
      : undefined,
    parentDepartmentId: d.parent_department_id,
    status: d.status ? { isDeleted: d.status.is_deleted } : undefined,
    leaderUserId: d.leader_user_id,
    chatId: d.chat_id,
    order: d.order ? parseInt(d.order, 10) : undefined,
    memberCount: d.member_count,
    primaryMemberCount: d.primary_member_count,
  };
}
