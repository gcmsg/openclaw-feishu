/**
 * 测试设置和 Mock
 */

import { vi } from "vitest";
import type { ResolvedFeishuAccount } from "../src/types.js";

// Mock 账号
export const mockAccount: ResolvedFeishuAccount = {
  accountId: "test",
  appId: "cli_test_app_id",
  appSecret: "test_app_secret",
  config: {
    appId: "cli_test_app_id",
    appSecret: "test_app_secret",
  },
};

// Mock access token
export const mockAccessToken = "t-mock-access-token-12345";

// Mock fetch 响应生成器
export function createMockResponse(data: any, code = 0, msg = "success") {
  return {
    code,
    msg,
    data,
  };
}

// Mock 飞书客户端类型 - 支持动态扩展
export interface MockClient {
  [key: string]: any;
  docx: any;
  bitable: any;
  sheets: any;
  im: any;
  drive: any;
}

// Mock 飞书客户端
export function createMockClient(): MockClient {
  return {
    docx: {
      v1: {
        document: {
          create: vi.fn(),
          get: vi.fn(),
          rawContent: vi.fn(),
        },
        documentBlock: {
          list: vi.fn(),
          get: vi.fn(),
          patch: vi.fn(),
          delete: vi.fn(),
        },
        documentBlockChildren: {
          create: vi.fn(),
          get: vi.fn(),
          batchDelete: vi.fn(),
        },
      },
    },
    bitable: {
      v1: {
        app: {
          create: vi.fn(),
          get: vi.fn(),
        },
        appTable: {
          list: vi.fn(),
          create: vi.fn(),
        },
        appTableField: {
          list: vi.fn(),
          create: vi.fn(),
        },
        appTableRecord: {
          list: vi.fn(),
          get: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
          search: vi.fn(),
          batchCreate: vi.fn(),
          batchUpdate: vi.fn(),
          batchDelete: vi.fn(),
        },
      },
    },
    sheets: {
      v3: {
        spreadsheet: {
          create: vi.fn(),
          get: vi.fn(),
        },
        spreadsheetSheet: {
          query: vi.fn(),
          get: vi.fn(),
        },
      },
    },
    im: {
      v1: {
        message: {
          create: vi.fn(),
          get: vi.fn(),
          reply: vi.fn(),
          delete: vi.fn(),
        },
        image: {
          create: vi.fn(),
          get: vi.fn(),
        },
        file: {
          create: vi.fn(),
        },
        messageResource: {
          get: vi.fn(),
        },
      },
    },
    drive: {
      v1: {
        files: {
          list: vi.fn(),
          createFolder: vi.fn(),
          uploadAll: vi.fn(),
        },
        file: {
          list: vi.fn(),
        },
        medias: {
          download: vi.fn(),
        },
      },
    },
  } as MockClient;
}

// 设置 global fetch mock
export function setupFetchMock() {
  const mockFetch = vi.fn();
  global.fetch = mockFetch as any;
  return mockFetch;
}

// Mock fetch 返回指定数据
export function mockFetchResponse(mockFetch: ReturnType<typeof vi.fn>, data: any, code = 0) {
  mockFetch.mockResolvedValueOnce({
    json: () => Promise.resolve({ code, msg: code === 0 ? "success" : "error", data }),
  });
}

// Mock fetch 返回 access token
export function mockFetchAccessToken(mockFetch: ReturnType<typeof vi.fn>) {
  mockFetch.mockResolvedValueOnce({
    json: () =>
      Promise.resolve({
        code: 0,
        tenant_access_token: mockAccessToken,
      }),
  });
}
