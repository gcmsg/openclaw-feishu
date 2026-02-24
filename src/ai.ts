/**
 * 飞书 AI 能力 API
 *
 * 支持的操作：
 * - OCR 图片文字识别
 * - 语音转文字 (Speech to Text)
 * - 机器翻译
 * - 语言检测
 */

import type { ResolvedFeishuAccount, ApiResult } from "./types.js";
import { getFeishuClient } from "./client.js";
import * as fs from "fs";
import * as path from "path";

// ==================== 类型定义 ====================

/** OCR 识别结果 */
export interface OcrResult {
  /** 识别到的文本行 */
  textLines: string[];
  /** 完整文本（合并所有行） */
  fullText: string;
}

/** 语音识别结果 */
export interface SpeechRecognitionResult {
  /** 识别的文本 */
  text: string;
  /** 识别语言 */
  language?: string;
}

/** 翻译结果 */
export interface TranslationResult {
  /** 翻译后的文本 */
  text: string;
  /** 源语言 */
  sourceLanguage: string;
  /** 目标语言 */
  targetLanguage: string;
}

/** 语言检测结果 */
export interface LanguageDetectionResult {
  /** 检测到的语言代码 */
  language: string;
  /** 置信度 (0-1) */
  confidence?: number;
}

/** 支持的语言代码 */
export type LanguageCode =
  | "zh" // 中文
  | "zh-Hant" // 繁体中文
  | "en" // 英语
  | "ja" // 日语
  | "ko" // 韩语
  | "fr" // 法语
  | "de" // 德语
  | "es" // 西班牙语
  | "it" // 意大利语
  | "pt" // 葡萄牙语
  | "ru" // 俄语
  | "ar" // 阿拉伯语
  | "th" // 泰语
  | "vi" // 越南语
  | "id"; // 印尼语

// ==================== OCR 图片识别 ====================

/**
 * 识别图片中的文字 (OCR)
 * @param account 飞书账户
 * @param image 图片数据（base64 字符串或文件路径）
 */
export async function recognizeImage(
  account: ResolvedFeishuAccount,
  image: string
): Promise<ApiResult<OcrResult>> {
  const client = getFeishuClient(account);

  try {
    // 如果是文件路径，读取文件内容
    let imageBase64: string;
    if (image.startsWith("/") || image.includes(":\\")) {
      // 文件路径
      const fileBuffer = fs.readFileSync(image);
      imageBase64 = fileBuffer.toString("base64");
    } else if (image.startsWith("data:")) {
      // data URL
      imageBase64 = image.split(",")[1] || image;
    } else {
      // 已经是 base64
      imageBase64 = image;
    }

    const result = await client.optical_char_recognition.v1.image.basicRecognize({
      data: {
        image: imageBase64,
      },
    });

    if (result.code === 0) {
      const textLines = result.data?.text_list || [];
      return {
        ok: true,
        data: {
          textLines,
          fullText: textLines.join("\n"),
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 语音转文字 ====================

/**
 * 将语音文件转换为文字
 * @param account 飞书账户
 * @param audio 音频数据（base64 字符串或文件路径）
 * @param options 选项
 */
export async function speechToText(
  account: ResolvedFeishuAccount,
  audio: string,
  options?: {
    /** 音频格式: pcm, wav, ogg, speex, mp3, silk */
    format?: "pcm" | "wav" | "ogg" | "speex" | "mp3" | "silk";
    /** 采样率 */
    sampleRate?: number;
    /** 引擎类型 */
    engineType?: string;
  }
): Promise<ApiResult<SpeechRecognitionResult>> {
  const client = getFeishuClient(account);

  try {
    // 如果是文件路径，读取文件内容
    let audioBase64: string;
    let format = options?.format;

    if (audio.startsWith("/") || audio.includes(":\\")) {
      // 文件路径
      const fileBuffer = fs.readFileSync(audio);
      audioBase64 = fileBuffer.toString("base64");

      // 从扩展名推断格式
      if (!format) {
        const ext = path.extname(audio).toLowerCase().slice(1);
        if (["pcm", "wav", "ogg", "speex", "mp3", "silk"].includes(ext)) {
          format = ext as any;
        }
      }
    } else if (audio.startsWith("data:")) {
      // data URL
      audioBase64 = audio.split(",")[1] || audio;
    } else {
      // 已经是 base64
      audioBase64 = audio;
    }

    const result = await client.speech_to_text.v1.speech.fileRecognize({
      data: {
        speech: {
          speech: audioBase64,
        },
        config: {
          file_id: "audio_" + Date.now(),
          format: format || "mp3",
          engine_type: options?.engineType || "16k_auto",
        },
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: {
          text: result.data?.recognition_text || "",
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 流式语音识别（用于实时语音）
 * @param account 飞书账户
 * @param audioChunk 音频片段（base64）
 * @param options 选项
 */
export async function streamSpeechRecognize(
  account: ResolvedFeishuAccount,
  audioChunk: string,
  options: {
    /** 流 ID */
    streamId: string;
    /** 序列号 */
    sequenceId: number;
    /** 是否是最后一个片段 */
    isEnd?: boolean;
    /** 音频格式 */
    format?: "pcm" | "wav" | "ogg" | "speex" | "mp3" | "silk";
  }
): Promise<ApiResult<{ text: string; isFinal: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.speech_to_text.v1.speech.streamRecognize({
      data: {
        speech: {
          speech: audioChunk,
        },
        config: {
          stream_id: options.streamId,
          sequence_id: options.sequenceId,
          action: options.isEnd ? 1 : 0,
          format: options.format || "pcm",
          engine_type: "16k_auto",
        },
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: {
          text: result.data?.recognition_text || "",
          isFinal: options.isEnd || false,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 机器翻译 ====================

/**
 * 翻译文本
 * @param account 飞书账户
 * @param text 要翻译的文本
 * @param targetLanguage 目标语言
 * @param sourceLanguage 源语言（可选，不指定则自动检测）
 */
export async function translateText(
  account: ResolvedFeishuAccount,
  text: string,
  targetLanguage: LanguageCode,
  sourceLanguage?: LanguageCode
): Promise<ApiResult<TranslationResult>> {
  const client = getFeishuClient(account);

  try {
    // 如果没有指定源语言，先检测
    let srcLang = sourceLanguage;
    if (!srcLang) {
      const detectResult = await detectLanguage(account, text);
      if (detectResult.ok && detectResult.data) {
        srcLang = detectResult.data.language as LanguageCode;
      } else {
        srcLang = "zh"; // 默认中文
      }
    }

    const result = await client.translation.v1.text.translate({
      data: {
        source_language: srcLang,
        target_language: targetLanguage,
        text,
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: {
          text: result.data?.text || "",
          sourceLanguage: srcLang!,
          targetLanguage,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 批量翻译文本
 * @param account 飞书账户
 * @param texts 要翻译的文本数组
 * @param targetLanguage 目标语言
 * @param sourceLanguage 源语言
 */
export async function translateBatch(
  account: ResolvedFeishuAccount,
  texts: string[],
  targetLanguage: LanguageCode,
  sourceLanguage?: LanguageCode
): Promise<ApiResult<{ results: TranslationResult[] }>> {
  const results: TranslationResult[] = [];

  for (const text of texts) {
    const result = await translateText(account, text, targetLanguage, sourceLanguage);
    if (result.ok && result.data) {
      results.push(result.data);
    } else {
      results.push({
        text: "",
        sourceLanguage: sourceLanguage || "unknown",
        targetLanguage,
      });
    }
  }

  return { ok: true, data: { results } };
}

// ==================== 语言检测 ====================

/**
 * 检测文本语言
 * @param account 飞书账户
 * @param text 要检测的文本
 */
export async function detectLanguage(
  account: ResolvedFeishuAccount,
  text: string
): Promise<ApiResult<LanguageDetectionResult>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.translation.v1.text.detect({
      data: {
        text,
      },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: {
          language: result.data?.language || "unknown",
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ==================== 辅助函数 ====================

/**
 * 获取语言名称
 */
export function getLanguageName(code: LanguageCode): string {
  const names: Record<LanguageCode, string> = {
    zh: "中文",
    "zh-Hant": "繁体中文",
    en: "英语",
    ja: "日语",
    ko: "韩语",
    fr: "法语",
    de: "德语",
    es: "西班牙语",
    it: "意大利语",
    pt: "葡萄牙语",
    ru: "俄语",
    ar: "阿拉伯语",
    th: "泰语",
    vi: "越南语",
    id: "印尼语",
  };
  return names[code] || code;
}

/**
 * 获取支持的语言列表
 */
export function getSupportedLanguages(): Array<{ code: LanguageCode; name: string }> {
  const codes: LanguageCode[] = [
    "zh",
    "zh-Hant",
    "en",
    "ja",
    "ko",
    "fr",
    "de",
    "es",
    "it",
    "pt",
    "ru",
    "ar",
    "th",
    "vi",
    "id",
  ];
  return codes.map((code) => ({ code, name: getLanguageName(code) }));
}
