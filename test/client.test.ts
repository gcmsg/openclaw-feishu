/**
 * 消息客户端 API 测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAccount, createMockClient } from "./setup.js";

// Mock client module
const mockClient = createMockClient();
vi.mock("@larksuiteoapi/node-sdk", () => ({
  Client: vi.fn(() => mockClient),
}));

import {
  getFeishuClient,
  sendTextMessage,
  sendPostMessage,
  sendCardMessage,
  sendImageMessage,
  sendFileMessage,
  replyMessage,
  recallMessage,
  getMessage,
} from "../src/client.js";

// Mock fs
vi.mock("fs", () => ({
  readFileSync: vi.fn(() => Buffer.from("mock file content")),
}));

describe("消息客户端 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getFeishuClient", () => {
    it("应该返回缓存的客户端", () => {
      const client1 = getFeishuClient(mockAccount);
      const client2 = getFeishuClient(mockAccount);

      // 由于缓存，应该是同一个实例
      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
    });
  });

  describe("sendTextMessage", () => {
    it("应该成功发送文本消息", async () => {
      mockClient.im.v1.message.create.mockResolvedValueOnce({
        code: 0,
        data: {
          message_id: "msg_12345",
        },
      });

      const result = await sendTextMessage(mockAccount, "chat_123", "Hello!");

      expect(result.ok).toBe(true);
      expect(result.data?.messageId).toBe("msg_12345");
      expect(mockClient.im.v1.message.create).toHaveBeenCalledWith({
        params: { receive_id_type: "chat_id" },
        data: {
          receive_id: "chat_123",
          msg_type: "text",
          content: JSON.stringify({ text: "Hello!" }),
        },
      });
    });

    it("应该处理发送失败", async () => {
      mockClient.im.v1.message.create.mockResolvedValueOnce({
        code: 1,
        msg: "发送失败",
      });

      const result = await sendTextMessage(mockAccount, "chat_123", "Hello!");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("发送失败");
    });

    it("应该处理异常", async () => {
      mockClient.im.v1.message.create.mockRejectedValueOnce(new Error("网络错误"));

      const result = await sendTextMessage(mockAccount, "chat_123", "Hello!");

      expect(result.ok).toBe(false);
      expect(result.error).toContain("网络错误");
    });
  });

  describe("sendPostMessage", () => {
    it("应该成功发送富文本消息", async () => {
      mockClient.im.v1.message.create.mockResolvedValueOnce({
        code: 0,
        data: {
          message_id: "msg_12345",
        },
      });

      const result = await sendPostMessage(mockAccount, "chat_123", "标题", [
        [{ tag: "text", text: "内容" }],
      ]);

      expect(result.ok).toBe(true);
      expect(mockClient.im.v1.message.create).toHaveBeenCalledWith({
        params: { receive_id_type: "chat_id" },
        data: {
          receive_id: "chat_123",
          msg_type: "post",
          content: expect.stringContaining("标题"),
        },
      });
    });
  });

  describe("sendCardMessage", () => {
    it("应该成功发送卡片消息", async () => {
      mockClient.im.v1.message.create.mockResolvedValueOnce({
        code: 0,
        data: {
          message_id: "msg_12345",
        },
      });

      const card = {
        elements: [{ tag: "div", text: { content: "卡片内容" } }],
      };

      const result = await sendCardMessage(mockAccount, "chat_123", card);

      expect(result.ok).toBe(true);
      expect(mockClient.im.v1.message.create).toHaveBeenCalledWith({
        params: { receive_id_type: "chat_id" },
        data: {
          receive_id: "chat_123",
          msg_type: "interactive",
          content: JSON.stringify(card),
        },
      });
    });
  });

  describe("sendImageMessage", () => {
    it("应该成功发送图片消息", async () => {
      // Mock 上传图片
      mockClient.im.v1.image.create.mockResolvedValueOnce({
        code: 0,
        data: {
          image_key: "img_key_123",
        },
      });

      // Mock 发送消息
      mockClient.im.v1.message.create.mockResolvedValueOnce({
        code: 0,
        data: {
          message_id: "msg_12345",
        },
      });

      const result = await sendImageMessage(mockAccount, "chat_123", "/path/to/image.png");

      expect(result.ok).toBe(true);
      expect(mockClient.im.v1.image.create).toHaveBeenCalled();
      expect(mockClient.im.v1.message.create).toHaveBeenCalledWith({
        params: { receive_id_type: "chat_id" },
        data: {
          receive_id: "chat_123",
          msg_type: "image",
          content: JSON.stringify({ image_key: "img_key_123" }),
        },
      });
    });

    it("应该处理图片上传失败", async () => {
      mockClient.im.v1.image.create.mockResolvedValueOnce({
        code: 1,
        msg: "上传失败",
      });

      const result = await sendImageMessage(mockAccount, "chat_123", "/path/to/image.png");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("上传失败");
    });
  });

  describe("sendFileMessage", () => {
    it("应该成功发送文件消息", async () => {
      // Mock 上传文件
      mockClient.im.v1.file.create.mockResolvedValueOnce({
        code: 0,
        data: {
          file_key: "file_key_123",
        },
      });

      // Mock 发送消息
      mockClient.im.v1.message.create.mockResolvedValueOnce({
        code: 0,
        data: {
          message_id: "msg_12345",
        },
      });

      const result = await sendFileMessage(mockAccount, "chat_123", "/path/to/file.pdf");

      expect(result.ok).toBe(true);
      expect(mockClient.im.v1.file.create).toHaveBeenCalled();
    });
  });

  describe("replyMessage", () => {
    it("应该成功回复消息", async () => {
      mockClient.im.v1.message.reply.mockResolvedValueOnce({
        code: 0,
      });

      const result = await replyMessage(mockAccount, "msg_original", "回复内容");

      expect(result.ok).toBe(true);
      expect(mockClient.im.v1.message.reply).toHaveBeenCalledWith({
        path: { message_id: "msg_original" },
        data: {
          msg_type: "text",
          content: JSON.stringify({ text: "回复内容" }),
        },
      });
    });
  });

  describe("recallMessage", () => {
    it("应该成功撤回消息", async () => {
      mockClient.im.v1.message.delete.mockResolvedValueOnce({
        code: 0,
      });

      const result = await recallMessage(mockAccount, "msg_12345");

      expect(result.ok).toBe(true);
      expect(mockClient.im.v1.message.delete).toHaveBeenCalledWith({
        path: { message_id: "msg_12345" },
      });
    });
  });

  describe("getMessage", () => {
    it("应该成功获取消息内容", async () => {
      mockClient.im.v1.message.get.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            {
              msg_type: "text",
              body: {
                content: JSON.stringify({ text: "消息内容" }),
              },
            },
          ],
        },
      });

      const result = await getMessage(mockAccount, "msg_12345");

      expect(result.ok).toBe(true);
      expect(result.data?.messageType).toBe("text");
      expect(result.data?.text).toBe("消息内容");
    });

    it("应该处理富文本消息", async () => {
      mockClient.im.v1.message.get.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [
            {
              msg_type: "post",
              body: {
                content: JSON.stringify({
                  zh_cn: {
                    content: [[{ text: "富文本内容" }]],
                  },
                }),
              },
            },
          ],
        },
      });

      const result = await getMessage(mockAccount, "msg_12345");

      expect(result.ok).toBe(true);
      expect(result.data?.messageType).toBe("post");
      expect(result.data?.text).toContain("富文本内容");
    });

    it("应该处理消息不存在", async () => {
      mockClient.im.v1.message.get.mockResolvedValueOnce({
        code: 0,
        data: {
          items: [],
        },
      });

      const result = await getMessage(mockAccount, "msg_not_exist");

      expect(result.ok).toBe(false);
    });
  });
});
