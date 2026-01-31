/**
 * 飞书云空间 API
 */

import * as fs from "fs";
import * as path from "path";
import type { ResolvedFeishuAccount, ApiResult, FileInfo, FolderInfo } from "./types.js";
import { getFeishuClient } from "./client.js";

/**
 * 创建文件夹
 */
export async function createFolder(
  account: ResolvedFeishuAccount,
  name: string,
  parentToken?: string
): Promise<ApiResult<FolderInfo>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.drive.v1.file.createFolder({
      data: {
        name,
        folder_token: parentToken,
      },
    });

    if (result.code === 0 && result.data) {
      return {
        ok: true,
        data: {
          token: result.data.token!,
          name,
          url: result.data.url,
          parentToken,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 列出文件夹内容
 */
export async function listFiles(
  account: ResolvedFeishuAccount,
  folderToken: string,
  pageToken?: string
): Promise<ApiResult<{ files: FileInfo[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.drive.v1.file.list({
      params: {
        folder_token: folderToken,
        page_size: 200,
        page_token: pageToken,
      },
    });

    if (result.code === 0) {
      const files: FileInfo[] = (result.data?.files || []).map((f: any) => ({
        token: f.token,
        name: f.name,
        type: f.type,
        url: f.url,
        parentToken: f.parent_token,
        createdTime: f.created_time ? parseInt(f.created_time) * 1000 : undefined,
        modifiedTime: f.modified_time ? parseInt(f.modified_time) * 1000 : undefined,
      }));

      return {
        ok: true,
        data: {
          files,
          pageToken: result.data?.next_page_token,
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
 * 上传文件到云空间
 */
export async function uploadFile(
  account: ResolvedFeishuAccount,
  filePath: string,
  parentToken: string,
  fileName?: string
): Promise<ApiResult<FileInfo>> {
  const client = getFeishuClient(account);

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const actualFileName = fileName || path.basename(filePath);
    const fileSize = fileBuffer.length;

    // 准备上传
    const prepareResult = await client.drive.v1.media.uploadPrepare({
      data: {
        file_name: actualFileName,
        parent_type: "explorer",
        parent_node: parentToken,
        size: fileSize,
      },
    });

    if (prepareResult.code !== 0) {
      return { ok: false, error: prepareResult.msg };
    }

    const uploadId = prepareResult.data?.upload_id;
    const blockSize = prepareResult.data?.block_size || 4 * 1024 * 1024;
    const blockNum = prepareResult.data?.block_num || 1;

    // 分片上传
    for (let i = 0; i < blockNum; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, fileSize);
      const chunk = fileBuffer.subarray(start, end);

      const partResult = await client.drive.v1.media.uploadPart({
        data: {
          upload_id: uploadId!,
          seq: i,
          size: chunk.length,
          file: new Blob([chunk]),
        },
      });

      if (partResult.code !== 0) {
        return { ok: false, error: `Upload part ${i} failed: ${partResult.msg}` };
      }
    }

    // 完成上传
    const finishResult = await client.drive.v1.media.uploadFinish({
      data: {
        upload_id: uploadId!,
        block_num: blockNum,
      },
    });

    if (finishResult.code === 0) {
      return {
        ok: true,
        data: {
          token: finishResult.data?.file_token || "",
          name: actualFileName,
          type: "file",
          parentToken,
        },
      };
    }
    return { ok: false, error: finishResult.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 下载文件
 */
export async function downloadFile(
  account: ResolvedFeishuAccount,
  fileToken: string,
  savePath: string
): Promise<ApiResult<string>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.drive.v1.media.download({
      path: { file_token: fileToken },
    });

    if (result instanceof Buffer || result instanceof ArrayBuffer) {
      const buffer = Buffer.from(result);
      fs.writeFileSync(savePath, buffer);
      return { ok: true, data: savePath };
    }
    return { ok: false, error: "Invalid response" };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 移动文件
 */
export async function moveFile(
  account: ResolvedFeishuAccount,
  fileToken: string,
  targetFolderToken: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.drive.v1.file.move({
      path: { file_token: fileToken },
      data: { folder_token: targetFolderToken },
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
 * 复制文件
 */
export async function copyFile(
  account: ResolvedFeishuAccount,
  fileToken: string,
  targetFolderToken: string,
  newName?: string
): Promise<ApiResult<FileInfo>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.drive.v1.file.copy({
      path: { file_token: fileToken },
      data: {
        folder_token: targetFolderToken,
        name: newName,
      },
    });

    if (result.code === 0 && result.data?.file) {
      return {
        ok: true,
        data: {
          token: result.data.file.token!,
          name: result.data.file.name!,
          type: result.data.file.type!,
          url: result.data.file.url,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除文件
 */
export async function deleteFile(
  account: ResolvedFeishuAccount,
  fileToken: string
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    const result = await client.drive.v1.file.delete({
      path: { file_token: fileToken },
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
 * 搜索文件
 */
export async function searchFiles(
  account: ResolvedFeishuAccount,
  query: string,
  pageToken?: string
): Promise<ApiResult<{ files: FileInfo[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.suite.docsApi.search.object({
      data: {
        search_key: query,
        count: 50,
        page_token: pageToken,
      },
    });

    if (result.code === 0) {
      const files: FileInfo[] = (result.data?.docs_entities || []).map((d: any) => ({
        token: d.docs_token,
        name: d.title,
        type: d.docs_type,
        url: d.url,
      }));

      return {
        ok: true,
        data: {
          files,
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
