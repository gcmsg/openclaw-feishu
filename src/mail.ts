/**
 * 飞书邮件 API
 *
 * 支持的操作：
 * - 发送/获取/列出邮件
 * - 邮件组管理
 * - 公共邮箱管理
 * - 邮件文件夹管理
 */

import type { ResolvedFeishuAccount, ApiResult } from "./types.js";
import { getFeishuClient } from "./client.js";

// ==================== 类型定义 ====================

/** 邮件信息 */
export interface MailMessage {
  messageId: string;
  subject?: string;
  from?: { email: string; name?: string };
  to?: Array<{ email: string; name?: string }>;
  cc?: Array<{ email: string; name?: string }>;
  bcc?: Array<{ email: string; name?: string }>;
  body?: {
    html?: string;
    plainText?: string;
  };
  attachments?: Array<{
    attachmentId: string;
    name: string;
    size?: number;
    mimeType?: string;
  }>;
  sentTime?: number;
  receivedTime?: number;
  isRead?: boolean;
  folderId?: string;
}

/** 邮件组 */
export interface MailGroup {
  mailGroupId: string;
  email: string;
  name?: string;
  description?: string;
  memberCount?: number;
  permissionType?: "anyone" | "member" | "custom";
}

/** 公共邮箱 */
export interface PublicMailbox {
  publicMailboxId: string;
  email: string;
  name?: string;
  memberCount?: number;
}

/** 邮件文件夹 */
export interface MailFolder {
  folderId: string;
  name: string;
  parentFolderId?: string;
  folderType?: "inbox" | "sent" | "drafts" | "trash" | "spam" | "custom";
  unreadCount?: number;
  totalCount?: number;
}

/** 邮件组/公共邮箱成员 */
export interface MailMember {
  memberId: string;
  email?: string;
  userId?: string;
  departmentId?: string;
  type?: "user" | "department" | "company" | "external_user" | "mailgroup";
}

// ==================== 邮件消息 ====================

/**
 * 发送邮件
 */
export async function sendMail(
  account: ResolvedFeishuAccount,
  userMailboxId: string,
  options: {
    subject: string;
    to: Array<{ email: string; name?: string }>;
    cc?: Array<{ email: string; name?: string }>;
    bcc?: Array<{ email: string; name?: string }>;
    bodyHtml?: string;
    bodyPlainText?: string;
    replyTo?: string;
  }
): Promise<ApiResult<{ messageId: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.userMailboxMessage.send({
      path: { user_mailbox_id: userMailboxId },
      data: {
        subject: options.subject,
        to: options.to.map((t) => ({ mail_address: t.email, name: t.name })),
        cc: options.cc?.map((t) => ({ mail_address: t.email, name: t.name })),
        bcc: options.bcc?.map((t) => ({ mail_address: t.email, name: t.name })),
        body_html: options.bodyHtml,
        body_plain_text: options.bodyPlainText,
        head_from: options.replyTo ? ({ mail_address: options.replyTo } as any) : undefined,
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: { messageId: result.data?.message_id || "" },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取邮件详情
 */
export async function getMail(
  account: ResolvedFeishuAccount,
  userMailboxId: string,
  messageId: string
): Promise<ApiResult<MailMessage>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.userMailboxMessage.get({
      path: { user_mailbox_id: userMailboxId, message_id: messageId },
    });

    if (result.code === 0 && result.data?.message) {
      const m = result.data.message as any;
      return {
        ok: true,
        data: {
          messageId: m.message_id || messageId,
          subject: m.subject,
          from: m.head_from
            ? { email: m.head_from.mail_address || "", name: m.head_from.name }
            : undefined,
          to: m.to?.map((t: any) => ({ email: t.mail_address, name: t.name })),
          cc: m.cc?.map((t: any) => ({ email: t.mail_address, name: t.name })),
          body: {
            html: m.body_html,
            plainText: m.body_plain_text,
          },
          attachments: m.attachments?.map((a: any) => ({
            attachmentId: a.attachment_id,
            name: a.file_name,
            size: a.size ? parseInt(a.size, 10) : undefined,
            mimeType: a.mime_type,
          })),
          isRead: m.is_read,
          folderId: m.folder_id,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取邮件列表
 */
export async function listMails(
  account: ResolvedFeishuAccount,
  userMailboxId: string,
  options?: {
    folderId?: string;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ messages: MailMessage[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const params: { page_size: number; folder_id?: string; page_token?: string } = {
      page_size: options?.pageSize || 50,
    };
    if (options?.folderId) params.folder_id = options.folderId;
    if (options?.pageToken) params.page_token = options.pageToken;
    const result = await client.mail.v1.userMailboxMessage.list({
      path: { user_mailbox_id: userMailboxId },
      params: params as any,
    });

    if (result.code === 0) {
      const messages = (result.data?.items || []).map((m: any) => ({
        messageId: m.message_id,
        subject: m.subject,
        from: m.from ? { email: m.from.mail_address, name: m.from.name } : undefined,
        to: m.to?.map((t: any) => ({ email: t.mail_address, name: t.name })),
        isRead: m.is_read,
        folderId: m.folder_id,
        sentTime: m.sent_time ? parseInt(m.sent_time, 10) : undefined,
        receivedTime: m.received_time ? parseInt(m.received_time, 10) : undefined,
      }));

      return {
        ok: true,
        data: {
          messages,
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
 * 获取邮件附件下载链接
 */
export async function getMailAttachmentUrl(
  account: ResolvedFeishuAccount,
  userMailboxId: string,
  messageId: string,
  attachmentId: string
): Promise<ApiResult<{ url: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.userMailboxMessageAttachment.downloadUrl({
      path: {
        user_mailbox_id: userMailboxId,
        message_id: messageId,
        attachment_id: attachmentId,
      },
    } as any);

    if (result.code === 0) {
      const data = result.data as any;
      const url = data?.download_url || data?.download_urls?.[0]?.download_url || "";
      return {
        ok: true,
        data: { url },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 邮件文件夹 ====================

/**
 * 获取邮件文件夹列表
 */
export async function listMailFolders(
  account: ResolvedFeishuAccount,
  userMailboxId: string
): Promise<ApiResult<{ folders: MailFolder[] }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.userMailboxFolder.list({
      path: { user_mailbox_id: userMailboxId },
    });

    if (result.code === 0) {
      const folders = (result.data?.items || []).map((f: any) => ({
        folderId: f.folder_id,
        name: f.name || "",
        parentFolderId: f.parent_folder_id,
        folderType: f.folder_type,
        unreadCount: f.unread_count ? parseInt(f.unread_count, 10) : undefined,
        totalCount: f.total_count ? parseInt(f.total_count, 10) : undefined,
      }));

      return { ok: true, data: { folders } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 创建邮件文件夹
 */
export async function createMailFolder(
  account: ResolvedFeishuAccount,
  userMailboxId: string,
  name: string,
  parentFolderId?: string
): Promise<ApiResult<MailFolder>> {
  const client = getFeishuClient(account);

  try {
    const data: { name: string; parent_folder_id?: string } = { name };
    if (parentFolderId) data.parent_folder_id = parentFolderId;
    const result = await client.mail.v1.userMailboxFolder.create({
      path: { user_mailbox_id: userMailboxId },
      data: data as any,
    });

    if (result.code === 0) {
      const data = result.data as any;
      return {
        ok: true,
        data: {
          folderId: data?.folder_id || data?.folder?.id || "",
          name,
          parentFolderId,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除邮件文件夹
 */
export async function deleteMailFolder(
  account: ResolvedFeishuAccount,
  userMailboxId: string,
  folderId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.userMailboxFolder.delete({
      path: { user_mailbox_id: userMailboxId, folder_id: folderId },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 邮件组管理 ====================

/**
 * 创建邮件组
 */
export async function createMailGroup(
  account: ResolvedFeishuAccount,
  email: string,
  name?: string,
  description?: string
): Promise<ApiResult<MailGroup>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.mailgroup.create({
      data: {
        email,
        name,
        description,
      },
    });

    if (result.code === 0 && result.data) {
      return {
        ok: true,
        data: {
          mailGroupId: result.data.mailgroup_id || "",
          email: result.data.email || email,
          name: result.data.name,
          description: result.data.description,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取邮件组信息
 */
export async function getMailGroup(
  account: ResolvedFeishuAccount,
  mailGroupId: string
): Promise<ApiResult<MailGroup>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.mailgroup.get({
      path: { mailgroup_id: mailGroupId },
    });

    if (result.code === 0 && result.data) {
      const g = result.data as any;
      return {
        ok: true,
        data: {
          mailGroupId: g.mailgroup_id || mailGroupId,
          email: g.email || "",
          name: g.name,
          description: g.description,
          memberCount:
            g.members_count || g.direct_members_count
              ? parseInt(String(g.members_count || g.direct_members_count), 10)
              : undefined,
          permissionType: g.permission_type || g.who_can_send_mail,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取邮件组列表
 */
export async function listMailGroups(
  account: ResolvedFeishuAccount,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ mailGroups: MailGroup[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.mailgroup.list({
      params: {
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const mailGroups = (result.data?.items || []).map((g: any) => ({
        mailGroupId: g.mailgroup_id,
        email: g.email || "",
        name: g.name,
        description: g.description,
        memberCount: g.members_count ? parseInt(String(g.members_count), 10) : undefined,
      }));

      return {
        ok: true,
        data: {
          mailGroups,
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
 * 更新邮件组
 */
export async function updateMailGroup(
  account: ResolvedFeishuAccount,
  mailGroupId: string,
  updates: {
    name?: string;
    description?: string;
  }
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.mailgroup.patch({
      path: { mailgroup_id: mailGroupId },
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
 * 删除邮件组
 */
export async function deleteMailGroup(
  account: ResolvedFeishuAccount,
  mailGroupId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.mailgroup.delete({
      path: { mailgroup_id: mailGroupId },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 邮件组成员 ====================

/**
 * 获取邮件组成员列表
 */
export async function listMailGroupMembers(
  account: ResolvedFeishuAccount,
  mailGroupId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ members: MailMember[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.mailgroupMember.list({
      path: { mailgroup_id: mailGroupId },
      params: {
        user_id_type: "open_id",
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const members = (result.data?.items || []).map((m: any) => ({
        memberId: m.member_id,
        email: m.email,
        userId: m.user_id,
        departmentId: m.department_id,
        type: m.type,
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
 * 添加邮件组成员
 */
export async function addMailGroupMember(
  account: ResolvedFeishuAccount,
  mailGroupId: string,
  member: {
    email?: string;
    userId?: string;
    departmentId?: string;
    type?: "user" | "department" | "company" | "external_user" | "mailgroup";
  }
): Promise<ApiResult<{ memberId: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.mailgroupMember.create({
      path: { mailgroup_id: mailGroupId },
      params: { user_id_type: "open_id" },
      data: {
        email: member.email,
        user_id: member.userId,
        department_id: member.departmentId,
        type: member.type?.toUpperCase().replace("MAILGROUP", "MAIL_GROUP") as any,
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: { memberId: result.data?.member_id || "" },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 移除邮件组成员
 */
export async function removeMailGroupMember(
  account: ResolvedFeishuAccount,
  mailGroupId: string,
  memberId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.mailgroupMember.delete({
      path: { mailgroup_id: mailGroupId, member_id: memberId },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 公共邮箱管理 ====================

/**
 * 创建公共邮箱
 */
export async function createPublicMailbox(
  account: ResolvedFeishuAccount,
  email: string,
  name?: string
): Promise<ApiResult<PublicMailbox>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.publicMailbox.create({
      data: {
        email,
        name,
      },
    });

    if (result.code === 0 && result.data) {
      return {
        ok: true,
        data: {
          publicMailboxId: result.data.public_mailbox_id || "",
          email: result.data.email || email,
          name: result.data.name,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取公共邮箱信息
 */
export async function getPublicMailbox(
  account: ResolvedFeishuAccount,
  publicMailboxId: string
): Promise<ApiResult<PublicMailbox>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.publicMailbox.get({
      path: { public_mailbox_id: publicMailboxId },
    });

    if (result.code === 0 && result.data) {
      const p = result.data as any;
      return {
        ok: true,
        data: {
          publicMailboxId: p.public_mailbox_id || publicMailboxId,
          email: p.email || "",
          name: p.name,
          memberCount: p.members_count ? parseInt(String(p.members_count), 10) : undefined,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取公共邮箱列表
 */
export async function listPublicMailboxes(
  account: ResolvedFeishuAccount,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ publicMailboxes: PublicMailbox[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.publicMailbox.list({
      params: {
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const publicMailboxes = (result.data?.items || []).map((p: any) => ({
        publicMailboxId: p.public_mailbox_id,
        email: p.email || "",
        name: p.name,
        memberCount: p.members_count ? parseInt(String(p.members_count), 10) : undefined,
      }));

      return {
        ok: true,
        data: {
          publicMailboxes,
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
 * 更新公共邮箱
 */
export async function updatePublicMailbox(
  account: ResolvedFeishuAccount,
  publicMailboxId: string,
  name: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.publicMailbox.patch({
      path: { public_mailbox_id: publicMailboxId },
      data: { name },
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
 * 删除公共邮箱
 */
export async function deletePublicMailbox(
  account: ResolvedFeishuAccount,
  publicMailboxId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.publicMailbox.delete({
      path: { public_mailbox_id: publicMailboxId },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 公共邮箱成员 ====================

/**
 * 获取公共邮箱成员列表
 */
export async function listPublicMailboxMembers(
  account: ResolvedFeishuAccount,
  publicMailboxId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<ApiResult<{ members: MailMember[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.publicMailboxMember.list({
      path: { public_mailbox_id: publicMailboxId },
      params: {
        user_id_type: "open_id",
        page_size: options?.pageSize || 50,
        page_token: options?.pageToken,
      },
    });

    if (result.code === 0) {
      const members = (result.data?.items || []).map((m: any) => ({
        memberId: m.member_id,
        email: m.email,
        userId: m.user_id,
        type: m.type,
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
 * 添加公共邮箱成员
 */
export async function addPublicMailboxMember(
  account: ResolvedFeishuAccount,
  publicMailboxId: string,
  member: {
    userId?: string;
    type?: "user";
  }
): Promise<ApiResult<{ memberId: string }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.publicMailboxMember.create({
      path: { public_mailbox_id: publicMailboxId },
      params: { user_id_type: "open_id" },
      data: {
        user_id: member.userId,
        type: (member.type || "user").toUpperCase() as "USER",
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: { memberId: result.data?.member_id || "" },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 移除公共邮箱成员
 */
export async function removePublicMailboxMember(
  account: ResolvedFeishuAccount,
  publicMailboxId: string,
  memberId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.publicMailboxMember.delete({
      path: { public_mailbox_id: publicMailboxId, member_id: memberId },
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
 * 清空公共邮箱成员
 */
export async function clearPublicMailboxMembers(
  account: ResolvedFeishuAccount,
  publicMailboxId: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.mail.v1.publicMailboxMember.clear({
      path: { public_mailbox_id: publicMailboxId },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
