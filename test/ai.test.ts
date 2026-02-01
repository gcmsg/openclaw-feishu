/**
 * AI 能力 API 测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAccount, createMockClient } from "./setup.js";

// Mock client module
const mockClient = createMockClient();
vi.mock("../src/client.js", () => ({
  getFeishuClient: () => mockClient,
}));

// 扩展 mockClient 添加 AI 相关方法
mockClient.optical_char_recognition = {
  v1: {
    image: {
      basicRecognize: vi.fn(),
    },
  },
};

mockClient.speech_to_text = {
  v1: {
    speech: {
      fileRecognize: vi.fn(),
      streamRecognize: vi.fn(),
    },
  },
};

mockClient.translation = {
  v1: {
    text: {
      translate: vi.fn(),
      detect: vi.fn(),
    },
  },
};

import {
  recognizeImage,
  speechToText,
  streamSpeechRecognize,
  translateText,
  translateBatch,
  detectLanguage,
  getLanguageName,
  getSupportedLanguages,
} from "../src/ai.js";

describe("AI 能力 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recognizeImage (OCR)", () => {
    it("应该成功识别图片中的文字", async () => {
      mockClient.optical_char_recognition.v1.image.basicRecognize.mockResolvedValueOnce({
        code: 0,
        data: {
          text_list: ["第一行文字", "第二行文字", "第三行文字"],
        },
      });

      // 模拟 base64 图片数据
      const imageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk";

      const result = await recognizeImage(mockAccount, imageBase64);

      expect(result.ok).toBe(true);
      expect(result.data?.textLines).toHaveLength(3);
      expect(result.data?.fullText).toBe("第一行文字\n第二行文字\n第三行文字");
    });

    it("应该处理空识别结果", async () => {
      mockClient.optical_char_recognition.v1.image.basicRecognize.mockResolvedValueOnce({
        code: 0,
        data: {
          text_list: [],
        },
      });

      const result = await recognizeImage(mockAccount, "base64data");

      expect(result.ok).toBe(true);
      expect(result.data?.textLines).toHaveLength(0);
      expect(result.data?.fullText).toBe("");
    });

    it("应该处理 data URL 格式", async () => {
      mockClient.optical_char_recognition.v1.image.basicRecognize.mockResolvedValueOnce({
        code: 0,
        data: { text_list: ["文字"] },
      });

      const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE";

      const result = await recognizeImage(mockAccount, dataUrl);

      expect(result.ok).toBe(true);
      expect(mockClient.optical_char_recognition.v1.image.basicRecognize).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { image: "iVBORw0KGgoAAAANSUhEUgAAAAE" },
        })
      );
    });
  });

  describe("speechToText", () => {
    it("应该成功将语音转换为文字", async () => {
      mockClient.speech_to_text.v1.speech.fileRecognize.mockResolvedValueOnce({
        code: 0,
        data: {
          recognition_text: "你好，世界！",
        },
      });

      const result = await speechToText(mockAccount, "base64audiodata");

      expect(result.ok).toBe(true);
      expect(result.data?.text).toBe("你好，世界！");
    });

    it("应该支持指定音频格式", async () => {
      mockClient.speech_to_text.v1.speech.fileRecognize.mockResolvedValueOnce({
        code: 0,
        data: { recognition_text: "测试" },
      });

      await speechToText(mockAccount, "audiodata", { format: "wav" });

      expect(mockClient.speech_to_text.v1.speech.fileRecognize).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            config: expect.objectContaining({
              format: "wav",
            }),
          }),
        })
      );
    });
  });

  describe("streamSpeechRecognize", () => {
    it("应该成功进行流式语音识别", async () => {
      mockClient.speech_to_text.v1.speech.streamRecognize.mockResolvedValueOnce({
        code: 0,
        data: {
          recognition_text: "部分识别结果",
        },
      });

      const result = await streamSpeechRecognize(mockAccount, "audiochunk", {
        streamId: "stream_123",
        sequenceId: 1,
        isEnd: false,
      });

      expect(result.ok).toBe(true);
      expect(result.data?.text).toBe("部分识别结果");
      expect(result.data?.isFinal).toBe(false);
    });

    it("应该正确处理最后一个音频片段", async () => {
      mockClient.speech_to_text.v1.speech.streamRecognize.mockResolvedValueOnce({
        code: 0,
        data: {
          recognition_text: "完整识别结果",
        },
      });

      const result = await streamSpeechRecognize(mockAccount, "lastaudiochunk", {
        streamId: "stream_123",
        sequenceId: 10,
        isEnd: true,
      });

      expect(result.ok).toBe(true);
      expect(result.data?.isFinal).toBe(true);
    });
  });

  describe("translateText", () => {
    it("应该成功翻译文本", async () => {
      mockClient.translation.v1.text.translate.mockResolvedValueOnce({
        code: 0,
        data: {
          text: "Hello, World!",
        },
      });

      const result = await translateText(mockAccount, "你好，世界！", "en", "zh");

      expect(result.ok).toBe(true);
      expect(result.data?.text).toBe("Hello, World!");
      expect(result.data?.sourceLanguage).toBe("zh");
      expect(result.data?.targetLanguage).toBe("en");
    });

    it("应该在未指定源语言时自动检测", async () => {
      // 模拟语言检测
      mockClient.translation.v1.text.detect.mockResolvedValueOnce({
        code: 0,
        data: { language: "zh" },
      });

      mockClient.translation.v1.text.translate.mockResolvedValueOnce({
        code: 0,
        data: { text: "Hello" },
      });

      const result = await translateText(mockAccount, "你好", "en");

      expect(result.ok).toBe(true);
      expect(mockClient.translation.v1.text.detect).toHaveBeenCalled();
    });
  });

  describe("translateBatch", () => {
    it("应该成功批量翻译", async () => {
      mockClient.translation.v1.text.translate
        .mockResolvedValueOnce({
          code: 0,
          data: { text: "Hello" },
        })
        .mockResolvedValueOnce({
          code: 0,
          data: { text: "World" },
        });

      const result = await translateBatch(mockAccount, ["你好", "世界"], "en", "zh");

      expect(result.ok).toBe(true);
      expect(result.data?.results).toHaveLength(2);
      expect(result.data?.results[0].text).toBe("Hello");
      expect(result.data?.results[1].text).toBe("World");
    });
  });

  describe("detectLanguage", () => {
    it("应该成功检测语言", async () => {
      mockClient.translation.v1.text.detect.mockResolvedValueOnce({
        code: 0,
        data: {
          language: "zh",
        },
      });

      const result = await detectLanguage(mockAccount, "你好世界");

      expect(result.ok).toBe(true);
      expect(result.data?.language).toBe("zh");
    });

    it("应该检测英语", async () => {
      mockClient.translation.v1.text.detect.mockResolvedValueOnce({
        code: 0,
        data: { language: "en" },
      });

      const result = await detectLanguage(mockAccount, "Hello World");

      expect(result.ok).toBe(true);
      expect(result.data?.language).toBe("en");
    });

    it("应该检测日语", async () => {
      mockClient.translation.v1.text.detect.mockResolvedValueOnce({
        code: 0,
        data: { language: "ja" },
      });

      const result = await detectLanguage(mockAccount, "こんにちは");

      expect(result.ok).toBe(true);
      expect(result.data?.language).toBe("ja");
    });
  });
});

describe("辅助函数", () => {
  describe("getLanguageName", () => {
    it("应该返回正确的语言名称", () => {
      expect(getLanguageName("zh")).toBe("中文");
      expect(getLanguageName("en")).toBe("英语");
      expect(getLanguageName("ja")).toBe("日语");
      expect(getLanguageName("ko")).toBe("韩语");
      expect(getLanguageName("fr")).toBe("法语");
    });
  });

  describe("getSupportedLanguages", () => {
    it("应该返回支持的语言列表", () => {
      const languages = getSupportedLanguages();

      expect(languages.length).toBeGreaterThan(10);
      expect(languages).toContainEqual({ code: "zh", name: "中文" });
      expect(languages).toContainEqual({ code: "en", name: "英语" });
      expect(languages).toContainEqual({ code: "ja", name: "日语" });
    });
  });
});
