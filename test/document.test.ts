/**
 * 云文档 API 测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAccount, createMockClient, createMockResponse } from "./setup.js";

// Mock client module
const mockClient = createMockClient();
vi.mock("../src/client.js", () => ({
  getFeishuClient: () => mockClient,
}));

import {
  createDocument,
  getDocument,
  getDocumentContent,
  getDocumentBlocks,
  getDocumentStructure,
  getBlock,
  updateBlock,
  deleteBlock,
  appendDocumentBlocks,
  appendText,
  appendMarkdown,
} from "../src/document.js";

// 确保 batchDelete mock 存在
if (!mockClient.docx.v1.documentBlockChildren.batchDelete) {
  mockClient.docx.v1.documentBlockChildren.batchDelete = vi.fn();
}

describe("云文档 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDocument", () => {
    it("应该成功创建文档", async () => {
      mockClient.docx.v1.document.create.mockResolvedValueOnce({
        code: 0,
        data: {
          document: {
            document_id: "doc_12345",
            title: "测试文档",
          },
        },
      });

      const result = await createDocument(mockAccount, "测试文档");

      expect(result.ok).toBe(true);
      expect(result.data?.documentId).toBe("doc_12345");
      expect(result.data?.title).toBe("测试文档");
      expect(result.data?.url).toContain("doc_12345");
    });

    it("应该处理创建失败", async () => {
      mockClient.docx.v1.document.create.mockResolvedValueOnce({
        code: 1,
        msg: "权限不足",
      });

      const result = await createDocument(mockAccount, "测试文档");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("权限不足");
    });

    it("应该支持指定文件夹", async () => {
      mockClient.docx.v1.document.create.mockResolvedValueOnce({
        code: 0,
        data: {
          document: {
            document_id: "doc_67890",
            title: "文件夹内文档",
          },
        },
      });

      const result = await createDocument(mockAccount, "文件夹内文档", "folder_token_123");

      expect(result.ok).toBe(true);
      expect(mockClient.docx.v1.document.create).toHaveBeenCalledWith({
        data: {
          title: "文件夹内文档",
          folder_token: "folder_token_123",
        },
      });
    });
  });

  describe("getDocument", () => {
    it("应该成功获取文档信息", async () => {
      mockClient.docx.v1.document.get.mockResolvedValueOnce({
        code: 0,
        data: {
          document: {
            document_id: "doc_12345",
            title: "我的文档",
          },
        },
      });

      const result = await getDocument(mockAccount, "doc_12345");

      expect(result.ok).toBe(true);
      expect(result.data?.documentId).toBe("doc_12345");
      expect(result.data?.title).toBe("我的文档");
    });
  });

  describe("getDocumentContent", () => {
    it("应该成功获取文档纯文本内容", async () => {
      mockClient.docx.v1.document.rawContent.mockResolvedValueOnce({
        code: 0,
        data: {
          content: "这是文档内容\n第二行",
        },
      });

      const result = await getDocumentContent(mockAccount, "doc_12345");

      expect(result.ok).toBe(true);
      expect(result.data).toBe("这是文档内容\n第二行");
    });
  });

  describe("getDocumentBlocks", () => {
    it("应该成功获取文档块列表", async () => {
      mockClient.docx.v1.documentBlock.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            { block_id: "block_1", block_type: 1 },
            { block_id: "block_2", block_type: 2 },
          ],
          has_more: false,
        },
      });

      const result = await getDocumentBlocks(mockAccount, "doc_12345");

      expect(result.ok).toBe(true);
      expect(result.data?.blocks).toHaveLength(2);
      expect(result.data?.hasMore).toBe(false);
    });

    it("应该支持分页", async () => {
      mockClient.docx.v1.documentBlock.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [{ block_id: "block_3", block_type: 2 }],
          page_token: "next_page",
          has_more: true,
        },
      });

      const result = await getDocumentBlocks(mockAccount, "doc_12345", "page_token_1");

      expect(result.ok).toBe(true);
      expect(result.data?.pageToken).toBe("next_page");
      expect(result.data?.hasMore).toBe(true);
    });
  });

  describe("getBlock", () => {
    it("应该成功获取单个块", async () => {
      mockClient.docx.v1.documentBlock.get.mockResolvedValueOnce({
        code: 0,
        data: {
          block: {
            block_id: "block_123",
            block_type: 2,
            text: {
              elements: [{ text_run: { content: "块内容" } }],
            },
          },
        },
      });

      const result = await getBlock(mockAccount, "doc_12345", "block_123");

      expect(result.ok).toBe(true);
      expect(result.data?.blockId).toBe("block_123");
      expect(result.data?.blockType).toBe("text");
      expect(result.data?.text).toBe("块内容");
    });
  });

  describe("deleteBlock", () => {
    it("应该成功删除块", async () => {
      // 实现使用的是 documentBlockChildren.batchDelete
      mockClient.docx.v1.documentBlockChildren.batchDelete.mockResolvedValueOnce({
        code: 0,
      });

      const result = await deleteBlock(mockAccount, "doc_12345", "block_123");

      expect(result.ok).toBe(true);
    });
  });

  describe("appendDocumentBlocks", () => {
    it("应该成功追加内容块", async () => {
      // Mock 获取文档块列表
      mockClient.docx.v1.documentBlock.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [{ block_id: "page_block", block_type: 1 }],
        },
      });

      // Mock 创建子块
      mockClient.docx.v1.documentBlockChildren.create.mockResolvedValueOnce({
        code: 0,
      });

      const result = await appendDocumentBlocks(mockAccount, "doc_12345", [
        { blockType: "text", text: "新内容" },
      ]);

      expect(result.ok).toBe(true);
    });
  });

  describe("appendText", () => {
    it("应该将文本拆分为多行块", async () => {
      mockClient.docx.v1.documentBlock.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [{ block_id: "page_block", block_type: 1 }],
        },
      });

      mockClient.docx.v1.documentBlockChildren.create.mockResolvedValueOnce({
        code: 0,
      });

      const result = await appendText(mockAccount, "doc_12345", "第一行\n第二行\n第三行");

      expect(result.ok).toBe(true);
      expect(mockClient.docx.v1.documentBlockChildren.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            children: expect.arrayContaining([expect.objectContaining({ block_type: 2 })]),
          }),
        })
      );
    });
  });

  describe("appendMarkdown", () => {
    it("应该正确解析 Markdown 标题", async () => {
      mockClient.docx.v1.documentBlock.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [{ block_id: "page_block", block_type: 1 }],
        },
      });

      mockClient.docx.v1.documentBlockChildren.create.mockResolvedValueOnce({
        code: 0,
      });

      const markdown = "# 一级标题\n## 二级标题\n### 三级标题";
      const result = await appendMarkdown(mockAccount, "doc_12345", markdown);

      expect(result.ok).toBe(true);
    });

    it("应该正确解析 Markdown 列表", async () => {
      mockClient.docx.v1.documentBlock.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [{ block_id: "page_block", block_type: 1 }],
        },
      });

      mockClient.docx.v1.documentBlockChildren.create.mockResolvedValueOnce({
        code: 0,
      });

      const markdown = "- 项目1\n- 项目2\n1. 有序1\n2. 有序2";
      const result = await appendMarkdown(mockAccount, "doc_12345", markdown);

      expect(result.ok).toBe(true);
    });

    it("应该正确解析 Markdown 待办", async () => {
      mockClient.docx.v1.documentBlock.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [{ block_id: "page_block", block_type: 1 }],
        },
      });

      mockClient.docx.v1.documentBlockChildren.create.mockResolvedValueOnce({
        code: 0,
      });

      const markdown = "- [ ] 未完成\n- [x] 已完成";
      const result = await appendMarkdown(mockAccount, "doc_12345", markdown);

      expect(result.ok).toBe(true);
    });
  });
});
