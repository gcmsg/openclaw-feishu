/**
 * 飞书电子表格 API
 *
 * 支持的操作：
 * - 创建/获取电子表格
 * - 工作表管理
 * - 单元格读写
 * - 批量操作
 */

import type { ResolvedFeishuAccount, ApiResult } from "./types.js";
import { getFeishuClient } from "./client.js";

// ==================== 类型定义 ====================

/** 电子表格信息 */
export interface Spreadsheet {
  spreadsheetToken: string;
  title: string;
  url: string;
  ownerUser?: string;
}

/** 工作表信息 */
export interface Sheet {
  sheetId: string;
  title: string;
  index: number;
  rowCount: number;
  columnCount: number;
}

/** 单元格值类型 */
export type CellValue = string | number | boolean | null;

/** 单元格范围数据 */
export interface RangeData {
  range: string;
  values: CellValue[][];
}

// ==================== 电子表格操作 ====================

/**
 * 创建电子表格
 */
export async function createSpreadsheet(
  account: ResolvedFeishuAccount,
  title: string,
  folderId?: string
): Promise<ApiResult<Spreadsheet>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.sheets.v3.spreadsheet.create({
      data: {
        title,
        folder_token: folderId,
      },
    });

    if (result.code === 0 && result.data?.spreadsheet) {
      const ss = result.data.spreadsheet;
      return {
        ok: true,
        data: {
          spreadsheetToken: ss.spreadsheet_token!,
          title: ss.title || title,
          url: `https://feishu.cn/sheets/${ss.spreadsheet_token}`,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取电子表格信息
 */
export async function getSpreadsheet(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string
): Promise<ApiResult<Spreadsheet>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.sheets.v3.spreadsheet.get({
      path: { spreadsheet_token: spreadsheetToken },
    });

    if (result.code === 0 && result.data?.spreadsheet) {
      const ss = result.data.spreadsheet;
      return {
        ok: true,
        data: {
          spreadsheetToken: ss.spreadsheet_token!,
          title: ss.title || "",
          url: `https://feishu.cn/sheets/${ss.spreadsheet_token}`,
          ownerUser: ss.owner_user,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 工作表操作 ====================

/**
 * 获取工作表列表
 */
export async function listSheets(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string
): Promise<ApiResult<Sheet[]>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.sheets.v3.spreadsheetSheet.query({
      path: { spreadsheet_token: spreadsheetToken },
    });

    if (result.code === 0) {
      const sheets = (result.data?.sheets || []).map((s: any) => ({
        sheetId: s.sheet_id,
        title: s.title,
        index: s.index,
        rowCount: s.grid_properties?.row_count || 0,
        columnCount: s.grid_properties?.column_count || 0,
      }));
      return { ok: true, data: sheets };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取单个工作表信息
 */
export async function getSheet(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string
): Promise<ApiResult<Sheet>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.sheets.v3.spreadsheetSheet.get({
      path: { spreadsheet_token: spreadsheetToken, sheet_id: sheetId },
    });

    if (result.code === 0 && result.data?.sheet) {
      const s = result.data.sheet;
      return {
        ok: true,
        data: {
          sheetId: s.sheet_id!,
          title: s.title || "",
          index: s.index || 0,
          rowCount: s.grid_properties?.row_count || 0,
          columnCount: s.grid_properties?.column_count || 0,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 单元格操作 ====================

/**
 * 读取单元格范围
 * @param range 范围，如 "Sheet1!A1:C3" 或 "sheetId!A1:C3"
 */
export async function readRange(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  range: string
): Promise<ApiResult<RangeData>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.sheets.v2.spreadsheetSheetFilterView.query({
      path: { spreadsheet_token: spreadsheetToken },
      params: { range },
    } as any);

    // 使用 v2 API 读取值
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values/${encodeURIComponent(range)}`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
        },
      }
    );

    const data = await response.json();
    if (data.code === 0) {
      return {
        ok: true,
        data: {
          range: data.data?.valueRange?.range || range,
          values: data.data?.valueRange?.values || [],
        },
      };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 写入单元格范围
 * @param range 范围，如 "Sheet1!A1:C3"
 * @param values 二维数组
 */
export async function writeRange(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  range: string,
  values: CellValue[][]
): Promise<ApiResult<{ updatedCells: number }>> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valueRange: {
            range,
            values,
          },
        }),
      }
    );

    const data = await response.json();
    if (data.code === 0) {
      return {
        ok: true,
        data: {
          updatedCells: data.data?.updatedCells || 0,
        },
      };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 追加数据到工作表末尾
 */
export async function appendRows(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  range: string,
  values: CellValue[][]
): Promise<ApiResult<{ updatedCells: number; updatedRows: number }>> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values_append`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valueRange: {
            range,
            values,
          },
        }),
      }
    );

    const data = await response.json();
    if (data.code === 0) {
      return {
        ok: true,
        data: {
          updatedCells: data.data?.updates?.updatedCells || 0,
          updatedRows: data.data?.updates?.updatedRows || 0,
        },
      };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 批量读取多个范围
 */
export async function batchReadRanges(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  ranges: string[]
): Promise<ApiResult<RangeData[]>> {
  try {
    const rangesParam = ranges.map((r) => encodeURIComponent(r)).join(",");
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values_batch_get?ranges=${rangesParam}`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
        },
      }
    );

    const data = await response.json();
    if (data.code === 0) {
      const results = (data.data?.valueRanges || []).map((vr: any) => ({
        range: vr.range,
        values: vr.values || [],
      }));
      return { ok: true, data: results };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 批量写入多个范围
 */
export async function batchWriteRanges(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  data: RangeData[]
): Promise<ApiResult<{ totalUpdatedCells: number }>> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values_batch_update`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valueRanges: data.map((d) => ({
            range: d.range,
            values: d.values,
          })),
        }),
      }
    );

    const result = await response.json();
    if (result.code === 0) {
      return {
        ok: true,
        data: {
          totalUpdatedCells: result.data?.totalUpdatedCells || 0,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 插入行
 */
export async function insertRows(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string,
  startIndex: number,
  count: number
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/insert_dimension_range`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dimension: {
            sheetId,
            majorDimension: "ROWS",
            startIndex,
            endIndex: startIndex + count,
          },
          inheritStyle: "BEFORE",
        }),
      }
    );

    const data = await response.json();
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除行
 */
export async function deleteRows(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string,
  startIndex: number,
  count: number
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/dimension_range`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dimension: {
            sheetId,
            majorDimension: "ROWS",
            startIndex,
            endIndex: startIndex + count,
          },
        }),
      }
    );

    const data = await response.json();
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 插入列
 */
export async function insertColumns(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string,
  startIndex: number,
  count: number
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/insert_dimension_range`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dimension: {
            sheetId,
            majorDimension: "COLUMNS",
            startIndex,
            endIndex: startIndex + count,
          },
          inheritStyle: "BEFORE",
        }),
      }
    );

    const data = await response.json();
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除列
 */
export async function deleteColumns(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string,
  startIndex: number,
  count: number
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/dimension_range`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dimension: {
            sheetId,
            majorDimension: "COLUMNS",
            startIndex,
            endIndex: startIndex + count,
          },
        }),
      }
    );

    const data = await response.json();
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 辅助函数 ====================

/**
 * 获取访问令牌
 */
async function getAccessToken(account: ResolvedFeishuAccount): Promise<string> {
  const response = await fetch(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: account.appId,
        app_secret: account.appSecret,
      }),
    }
  );

  const data = await response.json();
  if (data.code === 0) {
    return data.tenant_access_token;
  }
  throw new Error(data.msg || "Failed to get access token");
}

/**
 * 将列号转换为字母（1 -> A, 26 -> Z, 27 -> AA）
 */
export function columnToLetter(column: number): string {
  let letter = "";
  while (column > 0) {
    const remainder = (column - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    column = Math.floor((column - 1) / 26);
  }
  return letter;
}

/**
 * 将字母转换为列号（A -> 1, Z -> 26, AA -> 27）
 */
export function letterToColumn(letter: string): number {
  let column = 0;
  for (let i = 0; i < letter.length; i++) {
    column = column * 26 + (letter.charCodeAt(i) - 64);
  }
  return column;
}

/**
 * 构建范围字符串
 */
export function buildRange(
  sheetId: string,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): string {
  return `${sheetId}!${columnToLetter(startCol)}${startRow}:${columnToLetter(endCol)}${endRow}`;
}
