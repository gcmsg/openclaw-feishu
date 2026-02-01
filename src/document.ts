/**
 * 飞书云文档 API
 */

import type {
  ResolvedFeishuAccount,
  ApiResult,
  DocumentInfo,
  DocumentBlock,
  BlockType,
} from "./types.js";
import { getFeishuClient } from "./client.js";

/**
 * 创建云文档
 */
export async function createDocument(
  account: ResolvedFeishuAccount,
  title: string,
  folderId?: string
): Promise<ApiResult<DocumentInfo>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.docx.v1.document.create({
      data: {
        title,
        folder_token: folderId,
      },
    });

    if (result.code === 0 && result.data?.document) {
      const doc = result.data.document;
      return {
        ok: true,
        data: {
          documentId: doc.document_id!,
          title: doc.title || title,
          url: `https://feishu.cn/docx/${doc.document_id}`,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取文档信息
 */
export async function getDocument(
  account: ResolvedFeishuAccount,
  documentId: string
): Promise<ApiResult<DocumentInfo>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.docx.v1.document.get({
      path: { document_id: documentId },
    });

    if (result.code === 0 && result.data?.document) {
      const doc = result.data.document;
      return {
        ok: true,
        data: {
          documentId: doc.document_id!,
          title: doc.title || "",
          url: `https://feishu.cn/docx/${doc.document_id}`,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取文档纯文本内容
 */
export async function getDocumentContent(
  account: ResolvedFeishuAccount,
  documentId: string
): Promise<ApiResult<string>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.docx.v1.document.rawContent({
      path: { document_id: documentId },
    });

    if (result.code === 0) {
      return { ok: true, data: result.data?.content || "" };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取文档块列表
 */
export async function getDocumentBlocks(
  account: ResolvedFeishuAccount,
  documentId: string,
  pageToken?: string
): Promise<ApiResult<{ blocks: any[]; pageToken?: string; hasMore?: boolean }>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.docx.v1.documentBlock.list({
      path: { document_id: documentId },
      params: { page_size: 500, page_token: pageToken },
    });

    if (result.code === 0) {
      return {
        ok: true,
        data: {
          blocks: result.data?.items || [],
          pageToken: result.data?.page_token,
          hasMore: result.data?.has_more,
        },
      };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 向文档追加内容块
 */
export async function appendDocumentBlocks(
  account: ResolvedFeishuAccount,
  documentId: string,
  blocks: DocumentBlock[]
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    // 获取根块 ID
    const blocksResult = await getDocumentBlocks(account, documentId);
    if (!blocksResult.ok || !blocksResult.data?.blocks?.length) {
      return { ok: false, error: "Failed to get document blocks" };
    }

    // 找到 page 类型的根块
    const pageBlock = blocksResult.data.blocks.find((b: any) => b.block_type === 1);
    if (!pageBlock) {
      return { ok: false, error: "Page block not found" };
    }

    // 转换块格式
    const children = blocks.map((block) => convertBlock(block));

    const result = await client.docx.v1.documentBlockChildren.create({
      path: {
        document_id: documentId,
        block_id: pageBlock.block_id,
      },
      data: { children },
    });

    if (result.code === 0) {
      return { ok: true };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 将简化的块格式转换为飞书 API 格式
 */
function convertBlock(block: DocumentBlock): any {
  const blockTypeMap: Record<BlockType, number> = {
    page: 1,
    text: 2,
    heading1: 3,
    heading2: 4,
    heading3: 5,
    bullet: 6,
    ordered: 7,
    todo: 8,
    code: 9,
    quote: 10,
    divider: 11,
  };

  const result: any = {
    block_type: blockTypeMap[block.blockType] || 2,
  };

  if (block.text) {
    const textContent = {
      elements: [{ text_run: { content: block.text } }],
    };

    switch (block.blockType) {
      case "heading1":
        result.heading1 = textContent;
        break;
      case "heading2":
        result.heading2 = textContent;
        break;
      case "heading3":
        result.heading3 = textContent;
        break;
      case "bullet":
        result.bullet = textContent;
        break;
      case "ordered":
        result.ordered = textContent;
        break;
      case "todo":
        result.todo = { ...textContent, style: { done: block.checked ?? false } };
        break;
      case "code":
        result.code = { ...textContent, style: { language: getLanguageCode(block.language) } };
        break;
      case "quote":
        result.quote = textContent;
        break;
      default:
        result.text = textContent;
    }
  }

  return result;
}

function getLanguageCode(language?: string): number {
  if (!language) return 1;
  const map: Record<string, number> = {
    plaintext: 1,
    bash: 2,
    c: 3,
    cpp: 4,
    csharp: 5,
    css: 6,
    go: 7,
    html: 8,
    java: 9,
    javascript: 10,
    json: 11,
    kotlin: 12,
    markdown: 13,
    php: 14,
    python: 15,
    ruby: 16,
    rust: 17,
    sql: 18,
    swift: 19,
    typescript: 20,
    xml: 21,
    yaml: 22,
  };
  return map[language.toLowerCase()] || 1;
}

/**
 * 向文档追加纯文本
 */
export async function appendText(
  account: ResolvedFeishuAccount,
  documentId: string,
  text: string
): Promise<ApiResult> {
  const lines = text.split("\n");
  const blocks: DocumentBlock[] = lines.map((line) => ({
    blockType: "text" as BlockType,
    text: line || " ",
  }));
  return appendDocumentBlocks(account, documentId, blocks);
}

/**
 * 向文档追加 Markdown（简单解析）
 */
export async function appendMarkdown(
  account: ResolvedFeishuAccount,
  documentId: string,
  markdown: string
): Promise<ApiResult> {
  const lines = markdown.split("\n");
  const blocks: DocumentBlock[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      blocks.push({ blockType: "heading1", text: trimmed.slice(2) });
    } else if (trimmed.startsWith("## ")) {
      blocks.push({ blockType: "heading2", text: trimmed.slice(3) });
    } else if (trimmed.startsWith("### ")) {
      blocks.push({ blockType: "heading3", text: trimmed.slice(4) });
    } else if (trimmed.startsWith("- [ ] ")) {
      blocks.push({ blockType: "todo", text: trimmed.slice(6), checked: false });
    } else if (trimmed.startsWith("- [x] ")) {
      blocks.push({ blockType: "todo", text: trimmed.slice(6), checked: true });
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      blocks.push({ blockType: "bullet", text: trimmed.slice(2) });
    } else if (/^\d+\.\s/.test(trimmed)) {
      blocks.push({ blockType: "ordered", text: trimmed.replace(/^\d+\.\s/, "") });
    } else if (trimmed.startsWith("> ")) {
      blocks.push({ blockType: "quote", text: trimmed.slice(2) });
    } else if (trimmed === "---" || trimmed === "***") {
      blocks.push({ blockType: "divider" });
    } else if (!trimmed.startsWith("```")) {
      blocks.push({ blockType: "text", text: line || " " });
    }
  }

  return appendDocumentBlocks(account, documentId, blocks);
}
