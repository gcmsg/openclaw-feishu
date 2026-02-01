/**
 * 电子表格 API 测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mockAccount,
  createMockClient,
  setupFetchMock,
  mockFetchResponse,
  mockFetchAccessToken,
} from "./setup.js";

// Mock client module
const mockClient = createMockClient();
vi.mock("../src/client.js", () => ({
  getFeishuClient: () => mockClient,
}));

import {
  createSpreadsheet,
  getSpreadsheet,
  listSheets,
  getSheet,
  readRange,
  writeRange,
  appendRows,
  insertRows,
  deleteRows,
  insertColumns,
  deleteColumns,
  setCellStyle,
  mergeCells,
  unmergeCells,
  sortRange,
  freezeRowsAndColumns,
  findReplace,
  addSheet,
  deleteSheet,
  columnToLetter,
  letterToColumn,
  buildRange,
} from "../src/sheets.js";

describe("电子表格 API", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = setupFetchMock();
  });

  describe("createSpreadsheet", () => {
    it("应该成功创建电子表格", async () => {
      mockClient.sheets.v3.spreadsheet.create.mockResolvedValueOnce({
        code: 0,
        data: {
          spreadsheet: {
            spreadsheet_token: "sheet_12345",
            title: "测试表格",
          },
        },
      });

      const result = await createSpreadsheet(mockAccount, "测试表格");

      expect(result.ok).toBe(true);
      expect(result.data?.spreadsheetToken).toBe("sheet_12345");
      expect(result.data?.title).toBe("测试表格");
    });
  });

  describe("getSpreadsheet", () => {
    it("应该成功获取表格信息", async () => {
      mockClient.sheets.v3.spreadsheet.get.mockResolvedValueOnce({
        code: 0,
        data: {
          spreadsheet: {
            spreadsheet_token: "sheet_12345",
            title: "我的表格",
            owner_user: "user_123",
          },
        },
      });

      const result = await getSpreadsheet(mockAccount, "sheet_12345");

      expect(result.ok).toBe(true);
      expect(result.data?.title).toBe("我的表格");
      expect(result.data?.ownerUser).toBe("user_123");
    });
  });

  describe("listSheets", () => {
    it("应该成功列出工作表", async () => {
      mockClient.sheets.v3.spreadsheetSheet.query.mockResolvedValueOnce({
        code: 0,
        data: {
          sheets: [
            {
              sheet_id: "sheet1",
              title: "Sheet1",
              index: 0,
              grid_properties: { row_count: 100, column_count: 26 },
            },
            {
              sheet_id: "sheet2",
              title: "Sheet2",
              index: 1,
              grid_properties: { row_count: 50, column_count: 10 },
            },
          ],
        },
      });

      const result = await listSheets(mockAccount, "sheet_12345");

      expect(result.ok).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].sheetId).toBe("sheet1");
      expect(result.data?.[0].rowCount).toBe(100);
    });
  });

  describe("getSheet", () => {
    it("应该成功获取工作表信息", async () => {
      mockClient.sheets.v3.spreadsheetSheet.get.mockResolvedValueOnce({
        code: 0,
        data: {
          sheet: {
            sheet_id: "sheet1",
            title: "Sheet1",
            index: 0,
            grid_properties: { row_count: 100, column_count: 26 },
          },
        },
      });

      const result = await getSheet(mockAccount, "sheet_12345", "sheet1");

      expect(result.ok).toBe(true);
      expect(result.data?.sheetId).toBe("sheet1");
    });
  });

  describe("readRange", () => {
    // 注：readRange 使用 fetch 直接调用 v2 API，需要集成测试来验证
    it.skip("应该成功读取单元格范围（需要集成测试）", async () => {
      // 此测试需要真实的飞书环境来验证
      // 在单元测试中跳过，使用集成测试覆盖
    });
  });

  describe("writeRange", () => {
    it("应该成功写入单元格", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, { updatedCells: 9 });

      const result = await writeRange(mockAccount, "sheet_12345", "Sheet1!A1:C3", [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
      ]);

      expect(result.ok).toBe(true);
      expect(result.data?.updatedCells).toBe(9);
    });
  });

  describe("appendRows", () => {
    it("应该成功追加行", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, {
        updates: { updatedCells: 3, updatedRows: 1 },
      });

      const result = await appendRows(mockAccount, "sheet_12345", "Sheet1!A:C", [
        ["新行1", "新行2", "新行3"],
      ]);

      expect(result.ok).toBe(true);
      expect(result.data?.updatedRows).toBe(1);
    });
  });

  describe("insertRows", () => {
    it("应该成功插入行", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, {});

      const result = await insertRows(mockAccount, "sheet_12345", "sheet1", 5, 3);

      expect(result.ok).toBe(true);
    });
  });

  describe("deleteRows", () => {
    it("应该成功删除行", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, {});

      const result = await deleteRows(mockAccount, "sheet_12345", "sheet1", 5, 3);

      expect(result.ok).toBe(true);
    });
  });

  describe("insertColumns", () => {
    it("应该成功插入列", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, {});

      const result = await insertColumns(mockAccount, "sheet_12345", "sheet1", 2, 2);

      expect(result.ok).toBe(true);
    });
  });

  describe("deleteColumns", () => {
    it("应该成功删除列", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, {});

      const result = await deleteColumns(mockAccount, "sheet_12345", "sheet1", 2, 2);

      expect(result.ok).toBe(true);
    });
  });

  describe("setCellStyle", () => {
    it("应该成功设置单元格样式", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, {});

      const result = await setCellStyle(mockAccount, "sheet_12345", "Sheet1!A1:B2", {
        bold: true,
        fontSize: 14,
        textColor: "#FF0000",
        backgroundColor: "#FFFF00",
        hAlign: "center",
      });

      expect(result.ok).toBe(true);
    });
  });

  describe("mergeCells", () => {
    it("应该成功合并单元格", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, {});

      const result = await mergeCells(mockAccount, "sheet_12345", "Sheet1!A1:C3");

      expect(result.ok).toBe(true);
    });

    it("应该支持不同合并类型", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, {});

      const result = await mergeCells(mockAccount, "sheet_12345", "Sheet1!A1:C3", "MERGE_ROWS");

      expect(result.ok).toBe(true);
    });
  });

  describe("unmergeCells", () => {
    it("应该成功拆分单元格", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, {});

      const result = await unmergeCells(mockAccount, "sheet_12345", "Sheet1!A1:C3");

      expect(result.ok).toBe(true);
    });
  });

  describe("sortRange", () => {
    it("应该成功排序", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, {});

      const result = await sortRange(mockAccount, "sheet_12345", "sheet1", "A1:C10", [
        { column: "A", order: "asc" },
        { column: "B", order: "desc" },
      ]);

      expect(result.ok).toBe(true);
    });
  });

  describe("freezeRowsAndColumns", () => {
    it("应该成功冻结行列", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, {});

      const result = await freezeRowsAndColumns(mockAccount, "sheet_12345", "sheet1", 1, 2);

      expect(result.ok).toBe(true);
    });
  });

  describe("findReplace", () => {
    it("应该成功查找替换", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, { replace_count: 5 });

      const result = await findReplace(mockAccount, "sheet_12345", "sheet1", "旧值", "新值");

      expect(result.ok).toBe(true);
      expect(result.data?.replacedCount).toBe(5);
    });
  });

  describe("addSheet", () => {
    it("应该成功添加工作表", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, {
        replies: [{ addSheet: { properties: { sheetId: "new_sheet", title: "新工作表" } } }],
      });

      const result = await addSheet(mockAccount, "sheet_12345", "新工作表");

      expect(result.ok).toBe(true);
      expect(result.data?.sheetId).toBe("new_sheet");
    });
  });

  describe("deleteSheet", () => {
    it("应该成功删除工作表", async () => {
      mockFetchAccessToken(mockFetch);
      mockFetchResponse(mockFetch, {});

      const result = await deleteSheet(mockAccount, "sheet_12345", "sheet1");

      expect(result.ok).toBe(true);
    });
  });
});

describe("辅助函数", () => {
  describe("columnToLetter", () => {
    it("应该正确转换列号到字母", () => {
      expect(columnToLetter(1)).toBe("A");
      expect(columnToLetter(26)).toBe("Z");
      expect(columnToLetter(27)).toBe("AA");
      expect(columnToLetter(28)).toBe("AB");
      expect(columnToLetter(52)).toBe("AZ");
      expect(columnToLetter(53)).toBe("BA");
      expect(columnToLetter(702)).toBe("ZZ");
      expect(columnToLetter(703)).toBe("AAA");
    });
  });

  describe("letterToColumn", () => {
    it("应该正确转换字母到列号", () => {
      expect(letterToColumn("A")).toBe(1);
      expect(letterToColumn("Z")).toBe(26);
      expect(letterToColumn("AA")).toBe(27);
      expect(letterToColumn("AB")).toBe(28);
      expect(letterToColumn("AZ")).toBe(52);
      expect(letterToColumn("BA")).toBe(53);
      expect(letterToColumn("ZZ")).toBe(702);
      expect(letterToColumn("AAA")).toBe(703);
    });
  });

  describe("buildRange", () => {
    it("应该正确构建范围字符串", () => {
      expect(buildRange("sheet1", 1, 1, 10, 3)).toBe("sheet1!A1:C10");
      expect(buildRange("sheet2", 5, 2, 20, 5)).toBe("sheet2!B5:E20");
    });
  });
});
