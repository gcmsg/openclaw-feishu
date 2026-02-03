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

// ==================== 通用 API 响应类型 ====================

/** 飞书 API 标准响应 */
interface FeishuApiResponse<T = any> {
  code: number;
  msg?: string;
  data?: T;
}

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
      const token = ss.token || spreadsheetToken;
      return {
        ok: true,
        data: {
          spreadsheetToken: token,
          title: ss.title || "",
          url: ss.url || `https://feishu.cn/sheets/${token}`,
          ownerUser: ss.owner_id,
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
  try {
    // 使用 v2 API 读取值
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values/${encodeURIComponent(range)}`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
        },
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
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

    const data = (await response.json()) as FeishuApiResponse;
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

    const data = (await response.json()) as FeishuApiResponse;
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

    const data = (await response.json()) as FeishuApiResponse;
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

    const result = (await response.json()) as FeishuApiResponse;
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

    const data = (await response.json()) as FeishuApiResponse;
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

    const data = (await response.json()) as FeishuApiResponse;
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

    const data = (await response.json()) as FeishuApiResponse;
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

    const data = (await response.json()) as FeishuApiResponse;
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

  const data = (await response.json()) as FeishuApiResponse & { tenant_access_token?: string };
  if (data.code === 0 && data.tenant_access_token) {
    return data.tenant_access_token;
  }
  throw new Error(data.msg || "Failed to get access token");
}

// ==================== 高级操作 ====================

/** 单元格样式 */
export interface CellStyle {
  /** 字体加粗 */
  bold?: boolean;
  /** 字体斜体 */
  italic?: boolean;
  /** 字体大小 */
  fontSize?: number;
  /** 字体颜色 (hex, 如 "#FF0000") */
  textColor?: string;
  /** 背景颜色 (hex) */
  backgroundColor?: string;
  /** 水平对齐: left, center, right */
  hAlign?: "left" | "center" | "right";
  /** 垂直对齐: top, middle, bottom */
  vAlign?: "top" | "middle" | "bottom";
  /** 文本换行 */
  wrapText?: boolean;
}

/**
 * 设置单元格样式
 */
export async function setCellStyle(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  range: string,
  style: CellStyle
): Promise<ApiResult> {
  try {
    const styleObj: any = {};

    if (style.bold !== undefined) {
      styleObj.bold = style.bold;
    }
    if (style.italic !== undefined) {
      styleObj.italic = style.italic;
    }
    if (style.fontSize !== undefined) {
      styleObj.fontSize = `${style.fontSize}pt`;
    }
    if (style.textColor) {
      styleObj.foreColor = style.textColor;
    }
    if (style.backgroundColor) {
      styleObj.backColor = style.backgroundColor;
    }
    if (style.hAlign) {
      const hAlignMap = { left: 0, center: 1, right: 2 };
      styleObj.hAlign = hAlignMap[style.hAlign];
    }
    if (style.vAlign) {
      const vAlignMap = { top: 0, middle: 1, bottom: 2 };
      styleObj.vAlign = vAlignMap[style.vAlign];
    }
    if (style.wrapText !== undefined) {
      styleObj.textOverflow = style.wrapText ? 1 : 0;
    }

    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/style`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appendStyle: {
            range,
            style: styleObj,
          },
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 批量设置单元格样式
 */
export async function batchSetCellStyle(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  styles: Array<{ range: string; style: CellStyle }>
): Promise<ApiResult> {
  try {
    const data = styles.map(({ range, style }) => {
      const styleObj: any = {};
      if (style.bold !== undefined) styleObj.bold = style.bold;
      if (style.italic !== undefined) styleObj.italic = style.italic;
      if (style.fontSize !== undefined) styleObj.fontSize = `${style.fontSize}pt`;
      if (style.textColor) styleObj.foreColor = style.textColor;
      if (style.backgroundColor) styleObj.backColor = style.backgroundColor;
      if (style.hAlign) {
        const hAlignMap = { left: 0, center: 1, right: 2 };
        styleObj.hAlign = hAlignMap[style.hAlign];
      }
      if (style.vAlign) {
        const vAlignMap = { top: 0, middle: 1, bottom: 2 };
        styleObj.vAlign = vAlignMap[style.vAlign];
      }
      if (style.wrapText !== undefined) styleObj.textOverflow = style.wrapText ? 1 : 0;
      return { range, style: styleObj };
    });

    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/styles_batch_update`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      }
    );

    const result = (await response.json()) as FeishuApiResponse;
    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 合并单元格
 */
export async function mergeCells(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  range: string,
  mergeType: "MERGE_ALL" | "MERGE_ROWS" | "MERGE_COLUMNS" = "MERGE_ALL"
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/merge_cells`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          range,
          mergeType,
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 拆分单元格
 */
export async function unmergeCells(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  range: string
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/unmerge_cells`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ range }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 设置数据验证
 */
export async function setDataValidation(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string,
  range: string,
  options: {
    /** 验证类型 */
    type: "list" | "number" | "text" | "date" | "checkbox";
    /** 下拉选项（type=list 时使用） */
    values?: string[];
    /** 数值范围（type=number 时使用） */
    min?: number;
    max?: number;
    /** 是否严格验证 */
    strict?: boolean;
    /** 提示信息 */
    inputMessage?: string;
  }
): Promise<ApiResult> {
  try {
    const conditionType = {
      list: "list",
      number: "number",
      text: "textLength",
      date: "date",
      checkbox: "checkbox",
    }[options.type];

    const rule: any = {
      conditionType,
      strict: options.strict ?? true,
    };

    if (options.type === "list" && options.values) {
      rule.conditionValues = options.values;
      rule.options = { multipleValues: false, highlightValidData: false };
    }
    if (options.type === "number") {
      if (options.min !== undefined) rule.conditionValues = [String(options.min)];
      if (options.max !== undefined) {
        rule.conditionValues = rule.conditionValues || [];
        rule.conditionValues.push(String(options.max));
      }
    }
    if (options.inputMessage) {
      rule.inputMessage = options.inputMessage;
    }

    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/dataValidation`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetId,
          range,
          dataValidationType: conditionType,
          dataValidation: rule,
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 设置条件格式
 */
export async function setConditionalFormat(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string,
  ranges: string[],
  options: {
    /** 规则类型 */
    ruleType: "containsText" | "cellIs" | "colorScale" | "dataBar";
    /** 条件（cellIs 类型） */
    operator?: "greaterThan" | "lessThan" | "equal" | "between";
    /** 条件值 */
    values?: (string | number)[];
    /** 包含的文本（containsText 类型） */
    text?: string;
    /** 满足条件时的样式 */
    style?: CellStyle;
  }
): Promise<ApiResult> {
  try {
    const rule: any = {
      ranges,
      ruleType: options.ruleType,
    };

    if (options.ruleType === "containsText" && options.text) {
      rule.condition = { type: "containsText", values: [options.text] };
    } else if (options.ruleType === "cellIs" && options.operator) {
      const operatorMap = {
        greaterThan: "greaterThan",
        lessThan: "lessThan",
        equal: "equal",
        between: "between",
      };
      rule.condition = {
        type: operatorMap[options.operator],
        values: options.values?.map(String) || [],
      };
    }

    if (options.style) {
      rule.style = {};
      if (options.style.textColor) rule.style.font = { color: options.style.textColor };
      if (options.style.backgroundColor) rule.style.background = options.style.backgroundColor;
      if (options.style.bold) rule.style.font = { ...rule.style.font, bold: true };
    }

    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/condition_formats`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetId,
          conditionFormat: rule,
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 创建筛选视图
 */
export async function createFilter(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string,
  range: string
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/filters`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetId,
          range,
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除筛选视图
 */
export async function deleteFilter(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/filters?sheetId=${sheetId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
        },
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 设置筛选条件
 */
export async function setFilterCondition(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string,
  column: string,
  condition: {
    /** 筛选类型 */
    filterType: "multiValue" | "number" | "text" | "color";
    /** 筛选值（multiValue 类型） */
    values?: string[];
    /** 比较运算符 */
    operator?: "equal" | "notEqual" | "greaterThan" | "lessThan" | "contains" | "notContains";
    /** 比较值 */
    value?: string | number;
  }
): Promise<ApiResult> {
  try {
    const filterCondition: any = {
      filterType: condition.filterType,
    };

    if (condition.filterType === "multiValue" && condition.values) {
      filterCondition.filterValue = condition.values;
    } else if (condition.operator && condition.value !== undefined) {
      filterCondition.compareType = condition.operator;
      filterCondition.expected = [String(condition.value)];
    }

    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/filters/${sheetId}/condition`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          col: column,
          condition: filterCondition,
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 排序
 */
export async function sortRange(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string,
  range: string,
  sortSpecs: Array<{
    /** 排序列 (A, B, C...) */
    column: string;
    /** 排序顺序 */
    order: "asc" | "desc";
  }>
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/sort`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetId,
          range,
          sortSpecs: sortSpecs.map((s) => ({
            sortCol: s.column,
            order: s.order === "asc" ? "ASCENDING" : "DESCENDING",
          })),
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 冻结行列
 */
export async function freezeRowsAndColumns(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string,
  frozenRows: number,
  frozenColumns: number
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/sheets/${sheetId}/frozen`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frozenRowCount: frozenRows,
          frozenColCount: frozenColumns,
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 查找替换
 */
export async function findReplace(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string,
  find: string,
  replace: string,
  options?: {
    /** 区分大小写 */
    matchCase?: boolean;
    /** 完全匹配 */
    matchEntireCell?: boolean;
    /** 搜索范围 */
    range?: string;
  }
): Promise<ApiResult<{ replacedCount: number }>> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/find_replace`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetId,
          find,
          replacement: replace,
          matchCase: options?.matchCase ?? false,
          matchEntireCell: options?.matchEntireCell ?? false,
          range: options?.range,
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return {
        ok: true,
        data: { replacedCount: data.data?.replace_count || 0 },
      };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 设置列宽
 */
export async function setColumnWidth(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string,
  startColumn: number,
  endColumn: number,
  width: number
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/dimension_range`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dimension: {
            sheetId,
            majorDimension: "COLUMNS",
            startIndex: startColumn,
            endIndex: endColumn,
          },
          dimensionProperties: {
            pixelSize: width,
          },
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 设置行高
 */
export async function setRowHeight(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string,
  startRow: number,
  endRow: number,
  height: number
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/dimension_range`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dimension: {
            sheetId,
            majorDimension: "ROWS",
            startIndex: startRow,
            endIndex: endRow,
          },
          dimensionProperties: {
            pixelSize: height,
          },
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 复制工作表
 */
export async function copySheet(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sourceSheetId: string,
  targetTitle?: string
): Promise<ApiResult<{ sheetId: string }>> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/sheets/${sourceSheetId}/copy`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: targetTitle,
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return {
        ok: true,
        data: { sheetId: data.data?.sheetId || "" },
      };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 添加工作表
 */
export async function addSheet(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  title: string,
  index?: number
): Promise<ApiResult<Sheet>> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/sheets_batch_update`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title,
                  index,
                },
              },
            },
          ],
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      const reply = data.data?.replies?.[0]?.addSheet?.properties;
      return {
        ok: true,
        data: {
          sheetId: reply?.sheetId || "",
          title: reply?.title || title,
          index: reply?.index || 0,
          rowCount: 0,
          columnCount: 0,
        },
      };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 删除工作表
 */
export async function deleteSheet(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/sheets_batch_update`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              deleteSheet: {
                sheetId,
              },
            },
          ],
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 保护工作表
 */
export async function protectSheet(
  account: ResolvedFeishuAccount,
  spreadsheetToken: string,
  sheetId: string,
  options?: {
    /** 允许编辑的用户 ID 列表 */
    allowedUsers?: string[];
    /** 锁定信息 */
    lockInfo?: string;
  }
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/protected_dimension`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(account)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addProtectedDimension: {
            dimension: {
              sheetId,
              majorDimension: "ROWS",
              startIndex: 0,
              endIndex: 999999,
            },
            protectedRange: {
              sheetId,
            },
            lockInfo: options?.lockInfo || "Protected",
            editors: options?.allowedUsers ? { users: options.allowedUsers } : undefined,
          },
        }),
      }
    );

    const data = (await response.json()) as FeishuApiResponse;
    if (data.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: data.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
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
