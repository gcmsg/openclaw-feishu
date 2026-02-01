/**
 * 多维表格 API 测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAccount, createMockClient } from "./setup.js";

// Mock client module
const mockClient = createMockClient();
vi.mock("../src/client.js", () => ({
  getFeishuClient: () => mockClient,
}));

import {
  createBitableApp,
  getBitableApp,
  listBitableTables,
  createBitableTable,
  listBitableFields,
  createBitableField,
  listBitableRecords,
  getBitableRecord,
  createBitableRecord,
  updateBitableRecord,
  deleteBitableRecord,
  deleteBitableRecords,
  createBitableRecords,
} from "../src/bitable.js";

describe("多维表格 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createBitableApp", () => {
    it("应该成功创建多维表格应用", async () => {
      mockClient.bitable.v1.app.create.mockResolvedValueOnce({
        code: 0,
        data: {
          app: {
            app_token: "app_12345",
            name: "测试表格",
          },
        },
      });

      const result = await createBitableApp(mockAccount, "测试表格");

      expect(result.ok).toBe(true);
      expect(result.data?.appToken).toBe("app_12345");
      expect(result.data?.name).toBe("测试表格");
      expect(result.data?.url).toContain("app_12345");
    });

    it("应该处理创建失败", async () => {
      mockClient.bitable.v1.app.create.mockResolvedValueOnce({
        code: 1,
        msg: "创建失败",
      });

      const result = await createBitableApp(mockAccount, "测试表格");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("创建失败");
    });
  });

  describe("getBitableApp", () => {
    it("应该成功获取表格信息", async () => {
      mockClient.bitable.v1.app.get.mockResolvedValueOnce({
        code: 0,
        data: {
          app: {
            app_token: "app_12345",
            name: "我的表格",
            revision: 10,
          },
        },
      });

      const result = await getBitableApp(mockAccount, "app_12345");

      expect(result.ok).toBe(true);
      expect(result.data?.appToken).toBe("app_12345");
      expect(result.data?.revision).toBe(10);
    });
  });

  describe("listBitableTables", () => {
    it("应该成功列出数据表", async () => {
      mockClient.bitable.v1.appTable.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            { table_id: "tbl_1", name: "表1" },
            { table_id: "tbl_2", name: "表2" },
          ],
        },
      });

      const result = await listBitableTables(mockAccount, "app_12345");

      expect(result.ok).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].tableId).toBe("tbl_1");
      expect(result.data?.[1].name).toBe("表2");
    });
  });

  describe("createBitableTable", () => {
    it("应该成功创建数据表", async () => {
      mockClient.bitable.v1.appTable.create.mockResolvedValueOnce({
        code: 0,
        data: {
          table_id: "tbl_new",
        },
      });

      const result = await createBitableTable(mockAccount, "app_12345", "新数据表");

      expect(result.ok).toBe(true);
      expect(result.data?.tableId).toBe("tbl_new");
      expect(result.data?.name).toBe("新数据表");
    });
  });

  describe("listBitableFields", () => {
    it("应该成功列出字段", async () => {
      mockClient.bitable.v1.appTableField.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            { field_id: "fld_1", field_name: "名称", type: 1 },
            { field_id: "fld_2", field_name: "数量", type: 2 },
            { field_id: "fld_3", field_name: "状态", type: 3 },
          ],
        },
      });

      const result = await listBitableFields(mockAccount, "app_12345", "tbl_1");

      expect(result.ok).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data?.[0].typeName).toBe("text");
      expect(result.data?.[1].typeName).toBe("number");
      expect(result.data?.[2].typeName).toBe("singleSelect");
    });
  });

  describe("createBitableField", () => {
    it("应该成功创建字段", async () => {
      mockClient.bitable.v1.appTableField.create.mockResolvedValueOnce({
        code: 0,
        data: {
          field: {
            field_id: "fld_new",
            field_name: "新字段",
            type: 1,
          },
        },
      });

      const result = await createBitableField(mockAccount, "app_12345", "tbl_1", "新字段", 1);

      expect(result.ok).toBe(true);
      expect(result.data?.fieldId).toBe("fld_new");
      expect(result.data?.fieldName).toBe("新字段");
    });
  });

  describe("listBitableRecords", () => {
    it("应该成功列出记录", async () => {
      mockClient.bitable.v1.appTableRecord.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            { record_id: "rec_1", fields: { 名称: "项目A" } },
            { record_id: "rec_2", fields: { 名称: "项目B" } },
          ],
          total: 2,
        },
      });

      const result = await listBitableRecords(mockAccount, "app_12345", "tbl_1");

      expect(result.ok).toBe(true);
      expect(result.data?.records).toHaveLength(2);
      expect(result.data?.total).toBe(2);
    });

    it("应该支持分页参数", async () => {
      mockClient.bitable.v1.appTableRecord.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [],
          page_token: "next",
        },
      });

      const result = await listBitableRecords(mockAccount, "app_12345", "tbl_1", {
        pageSize: 10,
      });

      expect(result.ok).toBe(true);
      expect(mockClient.bitable.v1.appTableRecord.list).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            page_size: 10,
          }),
        })
      );
    });
  });

  describe("getBitableRecord", () => {
    it("应该成功获取单条记录", async () => {
      mockClient.bitable.v1.appTableRecord.get.mockResolvedValueOnce({
        code: 0,
        data: {
          record: {
            record_id: "rec_1",
            fields: { 名称: "项目A", 状态: "进行中" },
          },
        },
      });

      const result = await getBitableRecord(mockAccount, "app_12345", "tbl_1", "rec_1");

      expect(result.ok).toBe(true);
      expect(result.data?.recordId).toBe("rec_1");
      expect(result.data?.fields.名称).toBe("项目A");
    });
  });

  describe("createBitableRecord", () => {
    it("应该成功创建记录", async () => {
      mockClient.bitable.v1.appTableRecord.create.mockResolvedValueOnce({
        code: 0,
        data: {
          record: {
            record_id: "rec_new",
            fields: { 名称: "新项目" },
          },
        },
      });

      const result = await createBitableRecord(mockAccount, "app_12345", "tbl_1", {
        名称: "新项目",
      });

      expect(result.ok).toBe(true);
      expect(result.data?.recordId).toBe("rec_new");
    });
  });

  describe("createBitableRecords", () => {
    it("应该成功批量创建记录", async () => {
      mockClient.bitable.v1.appTableRecord.batchCreate.mockResolvedValueOnce({
        code: 0,
        data: {
          records: [
            { record_id: "rec_1", fields: {} },
            { record_id: "rec_2", fields: {} },
          ],
        },
      });

      const result = await createBitableRecords(mockAccount, "app_12345", "tbl_1", [
        { fields: { 名称: "项目1" } },
        { fields: { 名称: "项目2" } },
      ]);

      expect(result.ok).toBe(true);
      expect(result.data?.records).toHaveLength(2);
    });
  });

  describe("updateBitableRecord", () => {
    it("应该成功更新记录", async () => {
      mockClient.bitable.v1.appTableRecord.update.mockResolvedValueOnce({
        code: 0,
        data: {
          record: {
            record_id: "rec_1",
            fields: { 状态: "已完成" },
          },
        },
      });

      const result = await updateBitableRecord(mockAccount, "app_12345", "tbl_1", "rec_1", {
        状态: "已完成",
      });

      expect(result.ok).toBe(true);
      expect(result.data?.fields.状态).toBe("已完成");
    });
  });

  describe("deleteBitableRecord", () => {
    it("应该成功删除记录", async () => {
      mockClient.bitable.v1.appTableRecord.delete.mockResolvedValueOnce({
        code: 0,
      });

      const result = await deleteBitableRecord(mockAccount, "app_12345", "tbl_1", "rec_1");

      expect(result.ok).toBe(true);
    });
  });

  describe("deleteBitableRecords", () => {
    it("应该成功批量删除记录", async () => {
      mockClient.bitable.v1.appTableRecord.batchDelete.mockResolvedValueOnce({
        code: 0,
        data: {
          records: ["rec_1", "rec_2"],
        },
      });

      const result = await deleteBitableRecords(mockAccount, "app_12345", "tbl_1", [
        "rec_1",
        "rec_2",
      ]);

      expect(result.ok).toBe(true);
      expect(result.data?.deleted).toEqual(["rec_1", "rec_2"]);
    });
  });
});
