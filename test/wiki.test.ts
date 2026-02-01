/**
 * 知识库 API 测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAccount, createMockClient } from "./setup.js";

// Mock client module
const mockClient = createMockClient();
vi.mock("../src/client.js", () => ({
  getFeishuClient: () => mockClient,
}));

// 扩展 mockClient 添加知识库相关方法
mockClient.wiki = {
  v2: {
    space: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
    },
    spaceNode: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      updateTitle: vi.fn(),
      move: vi.fn(),
      copy: vi.fn(),
    },
    spaceMember: {
      list: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
};

import {
  listWikiSpaces,
  getWikiSpace,
  createWikiSpace,
  listWikiNodes,
  getWikiNode,
  createWikiNode,
  updateWikiNodeTitle,
  moveWikiNode,
  copyWikiNode,
  listWikiMembers,
  addWikiMember,
  removeWikiMember,
  getNodeUrl,
} from "../src/wiki.js";

describe("知识库 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listWikiSpaces", () => {
    it("应该成功列出知识空间", async () => {
      mockClient.wiki.v2.space.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            { space_id: "space_1", name: "产品文档", visibility: "private" },
            { space_id: "space_2", name: "公开知识库", visibility: "public" },
          ],
        },
      });

      const result = await listWikiSpaces(mockAccount);

      expect(result.ok).toBe(true);
      expect(result.data?.spaces).toHaveLength(2);
      expect(result.data?.spaces[0].name).toBe("产品文档");
    });
  });

  describe("getWikiSpace", () => {
    it("应该成功获取知识空间详情", async () => {
      mockClient.wiki.v2.space.get.mockResolvedValueOnce({
        code: 0,
        data: {
          space: {
            space_id: "space_1",
            name: "产品文档",
            description: "产品相关文档",
            visibility: "private",
          },
        },
      });

      const result = await getWikiSpace(mockAccount, "space_1");

      expect(result.ok).toBe(true);
      expect(result.data?.name).toBe("产品文档");
      expect(result.data?.description).toBe("产品相关文档");
    });
  });

  describe("createWikiSpace", () => {
    it("应该成功创建知识空间", async () => {
      mockClient.wiki.v2.space.create.mockResolvedValueOnce({
        code: 0,
        data: {
          space: {
            space_id: "space_new",
            name: "新知识库",
          },
        },
      });

      const result = await createWikiSpace(mockAccount, "新知识库", {
        description: "测试描述",
      });

      expect(result.ok).toBe(true);
      expect(result.data?.spaceId).toBe("space_new");
    });
  });

  describe("listWikiNodes", () => {
    it("应该成功列出节点", async () => {
      mockClient.wiki.v2.spaceNode.list.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            {
              node_token: "node_1",
              space_id: "space_1",
              obj_token: "doc_1",
              obj_type: "docx",
              title: "文档1",
              has_child: true,
            },
            {
              node_token: "node_2",
              space_id: "space_1",
              obj_token: "sheet_1",
              obj_type: "sheet",
              title: "表格1",
              has_child: false,
            },
          ],
        },
      });

      const result = await listWikiNodes(mockAccount, "space_1");

      expect(result.ok).toBe(true);
      expect(result.data?.nodes).toHaveLength(2);
      expect(result.data?.nodes[0].title).toBe("文档1");
      expect(result.data?.nodes[0].objType).toBe("docx");
    });

    it("应该支持父节点过滤", async () => {
      mockClient.wiki.v2.spaceNode.list.mockResolvedValueOnce({
        code: 0,
        data: { items: [] },
      });

      await listWikiNodes(mockAccount, "space_1", {
        parentNodeToken: "parent_node",
      });

      expect(mockClient.wiki.v2.spaceNode.list).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            parent_node_token: "parent_node",
          }),
        })
      );
    });
  });

  describe("getWikiNode", () => {
    it("应该成功获取节点详情", async () => {
      mockClient.wiki.v2.spaceNode.get.mockResolvedValueOnce({
        code: 0,
        data: {
          node: {
            node_token: "node_1",
            space_id: "space_1",
            obj_token: "doc_1",
            obj_type: "docx",
            title: "我的文档",
            has_child: false,
            creator: "user_1",
          },
        },
      });

      const result = await getWikiNode(mockAccount, "node_1");

      expect(result.ok).toBe(true);
      expect(result.data?.title).toBe("我的文档");
      expect(result.data?.creator).toBe("user_1");
    });
  });

  describe("createWikiNode", () => {
    it("应该成功创建节点", async () => {
      mockClient.wiki.v2.spaceNode.create.mockResolvedValueOnce({
        code: 0,
        data: {
          node: {
            node_token: "node_new",
            space_id: "space_1",
            obj_token: "doc_new",
            obj_type: "docx",
            title: "新文档",
          },
        },
      });

      const result = await createWikiNode(mockAccount, "space_1", {
        objType: "docx",
        title: "新文档",
      });

      expect(result.ok).toBe(true);
      expect(result.data?.nodeToken).toBe("node_new");
    });

    it("应该支持指定父节点", async () => {
      mockClient.wiki.v2.spaceNode.create.mockResolvedValueOnce({
        code: 0,
        data: {
          node: {
            node_token: "node_child",
            space_id: "space_1",
            obj_token: "doc_child",
            obj_type: "docx",
            parent_node_token: "parent_node",
          },
        },
      });

      await createWikiNode(mockAccount, "space_1", {
        objType: "docx",
        parentNodeToken: "parent_node",
      });

      expect(mockClient.wiki.v2.spaceNode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parent_node_token: "parent_node",
          }),
        })
      );
    });
  });

  describe("updateWikiNodeTitle", () => {
    it("应该成功更新节点标题", async () => {
      mockClient.wiki.v2.spaceNode.updateTitle.mockResolvedValueOnce({
        code: 0,
      });

      const result = await updateWikiNodeTitle(mockAccount, "space_1", "node_1", "新标题");

      expect(result.ok).toBe(true);
    });
  });

  describe("moveWikiNode", () => {
    it("应该成功移动节点", async () => {
      mockClient.wiki.v2.spaceNode.move.mockResolvedValueOnce({
        code: 0,
        data: {
          node: {
            node_token: "node_1",
            space_id: "space_1",
            obj_token: "doc_1",
            obj_type: "docx",
            parent_node_token: "new_parent",
          },
        },
      });

      const result = await moveWikiNode(mockAccount, "space_1", "node_1", "new_parent");

      expect(result.ok).toBe(true);
      expect(result.data?.parentNodeToken).toBe("new_parent");
    });
  });

  describe("copyWikiNode", () => {
    it("应该成功复制节点", async () => {
      mockClient.wiki.v2.spaceNode.copy.mockResolvedValueOnce({
        code: 0,
        data: {
          node: {
            node_token: "node_copy",
            space_id: "space_1",
            obj_token: "doc_copy",
            obj_type: "docx",
            title: "文档副本",
          },
        },
      });

      const result = await copyWikiNode(
        mockAccount,
        "space_1",
        "node_1",
        undefined,
        undefined,
        "文档副本"
      );

      expect(result.ok).toBe(true);
      expect(result.data?.title).toBe("文档副本");
    });
  });

  describe("listWikiMembers", () => {
    it("应该成功列出成员", async () => {
      mockClient.wiki.v2.spaceMember.list.mockResolvedValueOnce({
        code: 0,
        data: {
          members: [
            { member_id: "user_1", member_type: "user", member_role: "admin" },
            { member_id: "user_2", member_type: "user", member_role: "member" },
          ],
        },
      });

      const result = await listWikiMembers(mockAccount, "space_1");

      expect(result.ok).toBe(true);
      expect(result.data?.members).toHaveLength(2);
      expect(result.data?.members[0].memberRole).toBe("admin");
    });
  });

  describe("addWikiMember", () => {
    it("应该成功添加成员", async () => {
      mockClient.wiki.v2.spaceMember.create.mockResolvedValueOnce({
        code: 0,
        data: {
          member: {
            member_id: "user_new",
            member_type: "user",
            member_role: "member",
          },
        },
      });

      const result = await addWikiMember(mockAccount, "space_1", "user_new", "user", "member");

      expect(result.ok).toBe(true);
      expect(result.data?.memberId).toBe("user_new");
    });
  });

  describe("removeWikiMember", () => {
    it("应该成功移除成员", async () => {
      mockClient.wiki.v2.spaceMember.delete.mockResolvedValueOnce({
        code: 0,
      });

      const result = await removeWikiMember(mockAccount, "space_1", "user_1", "user");

      expect(result.ok).toBe(true);
    });
  });
});

describe("getNodeUrl", () => {
  it("应该返回正确的文档 URL", () => {
    const node = {
      nodeToken: "node_1",
      spaceId: "space_1",
      objToken: "doc_123",
      objType: "docx" as const,
      title: "测试",
      hasChild: false,
      nodeType: "origin" as const,
    };

    expect(getNodeUrl(node)).toBe("https://feishu.cn/docx/doc_123");
  });

  it("应该返回正确的表格 URL", () => {
    const node = {
      nodeToken: "node_1",
      spaceId: "space_1",
      objToken: "sheet_123",
      objType: "sheet" as const,
      title: "测试",
      hasChild: false,
      nodeType: "origin" as const,
    };

    expect(getNodeUrl(node)).toBe("https://feishu.cn/sheets/sheet_123");
  });

  it("应该返回正确的多维表格 URL", () => {
    const node = {
      nodeToken: "node_1",
      spaceId: "space_1",
      objToken: "base_123",
      objType: "bitable" as const,
      title: "测试",
      hasChild: false,
      nodeType: "origin" as const,
    };

    expect(getNodeUrl(node)).toBe("https://feishu.cn/base/base_123");
  });
});
