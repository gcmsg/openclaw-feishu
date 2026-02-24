/**
 * 搜索 API 测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAccount, createMockClient } from "./setup.js";

// Mock client module
const mockClient = createMockClient();
vi.mock("../src/client.js", () => ({
  getFeishuClient: () => mockClient,
}));

// 扩展 mockClient 添加搜索相关方法
mockClient.search = {
  v2: {
    message: {
      create: vi.fn(),
    },
    app: {
      create: vi.fn(),
    },
  },
};

mockClient.suite = {
  v1: {
    docsSearch: {
      create: vi.fn(),
    },
  },
};

mockClient.drive = {
  v1: {
    file: {
      list: vi.fn(),
    },
  },
};

import {
  searchMessages,
  searchDocs,
  searchDriveFiles,
  searchAppData,
  universalSearch,
  highlightKeywords,
} from "../src/search.js";

describe("搜索 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchMessages", () => {
    it("应该成功搜索消息", async () => {
      mockClient.search.v2.message.create.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            {
              message_id: "msg_1",
              chat_id: "chat_1",
              chat_type: "group",
              sender: { sender_id: { open_id: "user_1" } },
              message_type: "text",
              body: { content: JSON.stringify({ text: "搜索结果1" }) },
              create_time: "1704067200",
            },
            {
              message_id: "msg_2",
              chat_id: "chat_2",
              chat_type: "p2p",
              sender: { sender_id: { open_id: "user_2" } },
              message_type: "text",
              body: { content: JSON.stringify({ text: "搜索结果2" }) },
              create_time: "1704070800",
            },
          ],
          has_more: false,
        },
      });

      const result = await searchMessages(mockAccount, "搜索关键词");

      expect(result.ok).toBe(true);
      expect(result.data?.results).toHaveLength(2);
      expect(result.data?.results[0].messageId).toBe("msg_1");
      expect(result.data?.results[0].content).toBe("搜索结果1");
    });

    it("应该支持时间范围过滤", async () => {
      mockClient.search.v2.message.create.mockResolvedValueOnce({
        code: 0,
        data: { items: [] },
      });

      await searchMessages(mockAccount, "关键词", {
        filter: {
          startTime: 1704067200,
          endTime: 1704153600,
        },
      });

      expect(mockClient.search.v2.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            start_time: "1704067200",
            end_time: "1704153600",
          }),
        })
      );
    });

    it("应该支持聊天过滤", async () => {
      mockClient.search.v2.message.create.mockResolvedValueOnce({
        code: 0,
        data: { items: [] },
      });

      await searchMessages(mockAccount, "关键词", {
        filter: {
          chatIds: ["chat_1", "chat_2"],
        },
      });

      expect(mockClient.search.v2.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            chat_ids: ["chat_1", "chat_2"],
          }),
        })
      );
    });
  });

  describe("searchDocs", () => {
    it("应该成功搜索文档", async () => {
      mockClient.suite.v1.docsSearch.create.mockResolvedValueOnce({
        code: 0,
        data: {
          docs_entities: [
            {
              docs_token: "doc_1",
              docs_type: "docx",
              title: "项目文档",
              url: "https://feishu.cn/docx/doc_1",
            },
            {
              docs_token: "sheet_1",
              docs_type: "sheet",
              title: "数据表格",
              url: "https://feishu.cn/sheets/sheet_1",
            },
          ],
          has_more: false,
        },
      });

      const result = await searchDocs(mockAccount, "项目");

      expect(result.ok).toBe(true);
      expect(result.data?.results).toHaveLength(2);
      expect(result.data?.results[0].title).toBe("项目文档");
      expect(result.data?.results[0].docType).toBe("docx");
    });

    it("应该支持文档类型过滤", async () => {
      mockClient.suite.v1.docsSearch.create.mockResolvedValueOnce({
        code: 0,
        data: { docs_entities: [] },
      });

      await searchDocs(mockAccount, "关键词", {
        filter: {
          docTypes: ["docx", "sheet"],
        },
      });

      expect(mockClient.suite.v1.docsSearch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            docs_types: ["docx", "sheet"],
          }),
        })
      );
    });
  });

  describe("searchDriveFiles", () => {
    it("应该成功搜索云空间文件", async () => {
      mockClient.drive.v1.file.list.mockResolvedValueOnce({
        code: 0,
        data: {
          files: [
            { token: "file_1", name: "测试文件.pdf", type: "file" },
            { token: "file_2", name: "测试文档.docx", type: "docx" },
            { token: "file_3", name: "其他文件.txt", type: "file" },
          ],
        },
      });

      const result = await searchDriveFiles(mockAccount, "测试");

      expect(result.ok).toBe(true);
      expect(result.data?.results).toHaveLength(2); // 只匹配包含"测试"的文件
      expect(result.data?.results[0].title).toBe("测试文件.pdf");
    });
  });

  describe("searchAppData", () => {
    it("应该成功搜索应用数据", async () => {
      mockClient.search.v2.app.create.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            {
              data_source_id: "ds_1",
              id: "item_1",
              title: "应用数据1",
              url: "https://example.com/1",
            },
          ],
          has_more: false,
        },
      });

      const result = await searchAppData(mockAccount, "关键词");

      expect(result.ok).toBe(true);
      expect(result.data?.results).toHaveLength(1);
      expect(result.data?.results[0].title).toBe("应用数据1");
    });
  });

  describe("universalSearch", () => {
    it("应该同时搜索消息和文档", async () => {
      mockClient.search.v2.message.create.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            {
              message_id: "msg_1",
              chat_id: "chat_1",
              chat_type: "p2p",
              sender: { sender_id: { open_id: "user_1" } },
              message_type: "text",
              body: { content: JSON.stringify({ text: "消息内容" }) },
              create_time: "1704067200",
            },
          ],
        },
      });

      mockClient.suite.v1.docsSearch.create.mockResolvedValueOnce({
        code: 0,
        data: {
          docs_entities: [
            {
              docs_token: "doc_1",
              docs_type: "docx",
              title: "文档标题",
            },
          ],
        },
      });

      const result = await universalSearch(mockAccount, "关键词");

      expect(result.ok).toBe(true);
      expect(result.data?.results).toHaveLength(2);

      const types = result.data?.results.map((r) => r.type);
      expect(types).toContain("message");
      expect(types).toContain("doc");
    });

    it("应该支持指定搜索类型", async () => {
      mockClient.suite.v1.docsSearch.create.mockResolvedValueOnce({
        code: 0,
        data: { docs_entities: [] },
      });

      await universalSearch(mockAccount, "关键词", {
        searchTypes: ["doc"],
      });

      // 应该只调用文档搜索
      expect(mockClient.suite.v1.docsSearch.create).toHaveBeenCalled();
      expect(mockClient.search.v2.message.create).not.toHaveBeenCalled();
    });
  });
});

describe("highlightKeywords", () => {
  it("应该高亮单个关键词", () => {
    const result = highlightKeywords("这是一个测试文本", "测试");
    expect(result).toBe("这是一个**测试**文本");
  });

  it("应该高亮多个关键词", () => {
    const result = highlightKeywords("这是一个测试文本内容", "测试 内容");
    expect(result).toBe("这是一个**测试**文本**内容**");
  });

  it("应该不区分大小写", () => {
    const result = highlightKeywords("Hello World", "hello");
    expect(result).toBe("**Hello** World");
  });

  it("空查询应该返回原文本", () => {
    const result = highlightKeywords("原文本", "");
    expect(result).toBe("原文本");
  });
});
