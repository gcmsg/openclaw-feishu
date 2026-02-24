/**
 * 飞书云文档 API
 *
 * 支持的操作：
 * - 创建/获取文档
 * - 读取文档内容（纯文本/结构化）
 * - 追加/插入/更新/删除内容块
 * - 支持多种块类型：文本、标题、列表、代码、引用、表格等
 */

import type {
  ResolvedFeishuAccount,
  ApiResult,
  DocumentInfo,
  DocumentBlock,
  BlockType,
} from "./types.js";
import { getFeishuClient } from "./client.js";

// ==================== 块类型映射 ====================

/** 飞书块类型 ID 到名称的映射 */
const BLOCK_TYPE_MAP: Record<number, BlockType> = {
  1: "page",
  2: "text",
  3: "heading1",
  4: "heading2",
  5: "heading3",
  6: "heading4",
  7: "heading5",
  8: "heading6",
  9: "heading7",
  10: "heading8",
  11: "heading9",
  12: "bullet",
  13: "ordered",
  14: "code",
  15: "quote",
  17: "todo",
  19: "divider",
  22: "image",
  23: "table",
  24: "tableCell",
  27: "grid",
  28: "gridColumn",
};

/** 块类型名称到 ID 的映射 */
const BLOCK_TYPE_ID_MAP: Record<string, number> = {
  page: 1,
  text: 2,
  heading1: 3,
  heading2: 4,
  heading3: 5,
  heading4: 6,
  heading5: 7,
  heading6: 8,
  heading7: 9,
  heading8: 10,
  heading9: 11,
  bullet: 12,
  ordered: 13,
  code: 14,
  quote: 15,
  todo: 17,
  divider: 19,
  image: 22,
  table: 23,
  tableCell: 24,
  grid: 27,
  gridColumn: 28,
};

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
 * 获取文档块列表（原始格式）
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
 * 从飞书块中提取文本内容
 */
function extractTextFromBlock(block: any): string {
  const blockType = block.block_type;
  let content: any = null;

  // 根据块类型获取对应的内容字段
  switch (blockType) {
    case 2:
      content = block.text;
      break;
    case 3:
      content = block.heading1;
      break;
    case 4:
      content = block.heading2;
      break;
    case 5:
      content = block.heading3;
      break;
    case 6:
      content = block.heading4;
      break;
    case 7:
      content = block.heading5;
      break;
    case 8:
      content = block.heading6;
      break;
    case 9:
      content = block.heading7;
      break;
    case 10:
      content = block.heading8;
      break;
    case 11:
      content = block.heading9;
      break;
    case 12:
      content = block.bullet;
      break;
    case 13:
      content = block.ordered;
      break;
    case 14:
      content = block.code;
      break;
    case 15:
      content = block.quote;
      break;
    case 17:
      content = block.todo;
      break;
    default:
      return "";
  }

  if (!content?.elements) return "";

  // 提取 elements 中的文本
  return content.elements
    .map((el: any) => {
      if (el.text_run?.content) return el.text_run.content;
      if (el.mention_user?.user_id) return `@${el.mention_user.user_id}`;
      if (el.mention_doc?.token) return `[文档:${el.mention_doc.token}]`;
      if (el.equation?.content) return `$${el.equation.content}$`;
      return "";
    })
    .join("");
}

/**
 * 将飞书原始块转换为 DocumentBlock 格式
 */
function parseRawBlock(block: any): DocumentBlock {
  const blockType = BLOCK_TYPE_MAP[block.block_type] || "text";
  const result: DocumentBlock = {
    blockId: block.block_id,
    blockType,
    parentId: block.parent_id,
  };

  // 提取文本内容
  const text = extractTextFromBlock(block);
  if (text) {
    result.text = text;
  }

  // 处理特殊块类型
  switch (block.block_type) {
    case 14: // code
      result.language = getLanguageName(block.code?.style?.language);
      break;
    case 17: // todo
      result.checked = block.todo?.style?.done ?? false;
      break;
    case 22: // image
      result.imageToken = block.image?.token;
      result.imageWidth = block.image?.width;
      result.imageHeight = block.image?.height;
      break;
  }

  return result;
}

/**
 * 获取文档完整结构（解析后的格式）
 */
export async function getDocumentStructure(
  account: ResolvedFeishuAccount,
  documentId: string
): Promise<ApiResult<{ blocks: DocumentBlock[]; title: string }>> {
  try {
    // 获取文档信息
    const docResult = await getDocument(account, documentId);
    if (!docResult.ok) {
      return { ok: false, error: docResult.error };
    }

    // 获取所有块
    const allBlocks: any[] = [];
    let pageToken: string | undefined;

    do {
      const blocksResult = await getDocumentBlocks(account, documentId, pageToken);
      if (!blocksResult.ok) {
        return { ok: false, error: blocksResult.error };
      }
      allBlocks.push(...(blocksResult.data?.blocks || []));
      pageToken = blocksResult.data?.pageToken;
    } while (pageToken);

    // 解析块
    const parsedBlocks = allBlocks
      .filter((b) => b.block_type !== 1) // 排除 page 块
      .map(parseRawBlock);

    return {
      ok: true,
      data: {
        blocks: parsedBlocks,
        title: docResult.data?.title || "",
      },
    };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 获取指定块的内容
 */
export async function getBlock(
  account: ResolvedFeishuAccount,
  documentId: string,
  blockId: string
): Promise<ApiResult<DocumentBlock>> {
  const client = getFeishuClient(account);

  try {
    const result = await client.docx.v1.documentBlock.get({
      path: { document_id: documentId, block_id: blockId },
    });

    if (result.code === 0 && result.data?.block) {
      return {
        ok: true,
        data: parseRawBlock(result.data.block),
      };
    }
    return { ok: false, error: result.msg || "Block not found" };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 更新指定块的内容
 */
export async function updateBlock(
  account: ResolvedFeishuAccount,
  documentId: string,
  blockId: string,
  content: { text?: string; checked?: boolean }
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    // 先获取块信息以确定类型
    const blockResult = await getBlock(account, documentId, blockId);
    if (!blockResult.ok || !blockResult.data) {
      return { ok: false, error: blockResult.error || "Block not found" };
    }

    const block = blockResult.data;
    const updateData: any = {};

    // 根据块类型构建更新数据
    if (content.text !== undefined) {
      const textContent = {
        elements: [{ text_run: { content: content.text } }],
      };

      switch (block.blockType) {
        case "text":
          updateData.text = textContent;
          break;
        case "heading1":
          updateData.heading1 = textContent;
          break;
        case "heading2":
          updateData.heading2 = textContent;
          break;
        case "heading3":
          updateData.heading3 = textContent;
          break;
        case "bullet":
          updateData.bullet = textContent;
          break;
        case "ordered":
          updateData.ordered = textContent;
          break;
        case "quote":
          updateData.quote = textContent;
          break;
        case "code":
          updateData.code = {
            ...textContent,
            style: { language: getLanguageCode(block.language) },
          };
          break;
        case "todo":
          updateData.todo = {
            ...textContent,
            style: { done: content.checked ?? block.checked ?? false },
          };
          break;
        default:
          return { ok: false, error: `Cannot update block type: ${block.blockType}` };
      }
    }

    // 单独更新 todo 状态
    if (content.checked !== undefined && block.blockType === "todo") {
      if (!updateData.todo) {
        updateData.todo = {
          elements: [{ text_run: { content: block.text || "" } }],
          style: { done: content.checked },
        };
      } else {
        updateData.todo.style = { done: content.checked };
      }
    }

    const result = await client.docx.v1.documentBlock.patch({
      path: { document_id: documentId, block_id: blockId },
      data: updateData,
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
 * 删除指定块（通过父块和索引删除）
 * 注意：需要先获取块在父块中的索引位置
 */
export async function deleteBlock(
  account: ResolvedFeishuAccount,
  documentId: string,
  blockId: string,
  parentBlockId?: string,
  startIndex?: number
): Promise<ApiResult> {
  const client = getFeishuClient(account);

  try {
    // 如果没有提供父块和索引，需要先查询
    const parentId = parentBlockId || documentId;
    const index = startIndex ?? 0;

    const result = await client.docx.v1.documentBlockChildren.batchDelete({
      path: { document_id: documentId, block_id: parentId },
      data: {
        start_index: index,
        end_index: index + 1,
      },
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
 * 批量删除块
 */
export async function deleteBlocks(
  account: ResolvedFeishuAccount,
  documentId: string,
  blockIds: string[]
): Promise<ApiResult<{ succeeded: string[]; failed: string[] }>> {
  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const blockId of blockIds) {
    const result = await deleteBlock(account, documentId, blockId);
    if (result.ok) {
      succeeded.push(blockId);
    } else {
      failed.push(blockId);
    }
  }

  return {
    ok: failed.length === 0,
    data: { succeeded, failed },
    error: failed.length > 0 ? `Failed to delete ${failed.length} blocks` : undefined,
  };
}

/**
 * 在指定块之后插入内容
 */
export async function insertBlocksAfter(
  account: ResolvedFeishuAccount,
  documentId: string,
  afterBlockId: string,
  blocks: DocumentBlock[]
): Promise<ApiResult<{ blockIds: string[] }>> {
  const client = getFeishuClient(account);

  try {
    // 获取目标块的父块 ID
    const blockResult = await getBlock(account, documentId, afterBlockId);
    if (!blockResult.ok || !blockResult.data) {
      return { ok: false, error: blockResult.error || "Block not found" };
    }

    const parentId = blockResult.data.parentId;
    if (!parentId) {
      return { ok: false, error: "Cannot find parent block" };
    }

    // 获取父块的子块列表以确定插入位置
    const childrenResult = await client.docx.v1.documentBlockChildren.get({
      path: { document_id: documentId, block_id: parentId },
    });

    if (childrenResult.code !== 0) {
      return { ok: false, error: childrenResult.msg };
    }

    const children = childrenResult.data?.items || [];
    const targetIndex = children.findIndex((c: any) => c.block_id === afterBlockId);

    // 转换块格式
    const convertedBlocks = blocks.map((block) => convertBlock(block));

    const result = await client.docx.v1.documentBlockChildren.create({
      path: { document_id: documentId, block_id: parentId },
      data: {
        children: convertedBlocks,
        index: targetIndex + 1,
      },
    });

    if (result.code === 0) {
      const blockIds = result.data?.children?.map((c: any) => c.block_id) || [];
      return { ok: true, data: { blockIds } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 在文档开头插入内容（在第一个块之前）
 */
export async function prependDocumentBlocks(
  account: ResolvedFeishuAccount,
  documentId: string,
  blocks: DocumentBlock[]
): Promise<ApiResult<{ blockIds: string[] }>> {
  const client = getFeishuClient(account);

  try {
    // 获取文档块列表找到 page 块
    const blocksResult = await getDocumentBlocks(account, documentId);
    if (!blocksResult.ok || !blocksResult.data?.blocks?.length) {
      return { ok: false, error: "Failed to get document blocks" };
    }

    const pageBlock = blocksResult.data.blocks.find((b: any) => b.block_type === 1);
    if (!pageBlock) {
      return { ok: false, error: "Page block not found" };
    }

    // 转换块格式
    const convertedBlocks = blocks.map((block) => convertBlock(block));

    const result = await client.docx.v1.documentBlockChildren.create({
      path: { document_id: documentId, block_id: pageBlock.block_id },
      data: {
        children: convertedBlocks,
        index: 0, // 插入到开头
      },
    });

    if (result.code === 0) {
      const blockIds = result.data?.children?.map((c: any) => c.block_id) || [];
      return { ok: true, data: { blockIds } };
    }
    return { ok: false, error: result.msg };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 语言 ID 到名称的映射
 */
function getLanguageName(languageId?: number): string {
  if (!languageId) return "plaintext";
  const map: Record<number, string> = {
    1: "plaintext",
    2: "abap",
    3: "ada",
    4: "apache",
    5: "apex",
    6: "assembly",
    7: "bash",
    8: "c",
    9: "c#",
    10: "c++",
    11: "clojure",
    12: "cobol",
    13: "css",
    14: "dart",
    15: "delphi",
    16: "django",
    17: "dockerfile",
    18: "elixir",
    19: "erlang",
    20: "fortran",
    21: "fsharp",
    22: "go",
    23: "groovy",
    24: "haskell",
    25: "html",
    26: "java",
    27: "javascript",
    28: "json",
    29: "julia",
    30: "kotlin",
    31: "latex",
    32: "lisp",
    33: "lua",
    34: "makefile",
    35: "markdown",
    36: "matlab",
    37: "nginx",
    38: "objective-c",
    39: "pascal",
    40: "perl",
    41: "php",
    42: "plaintext",
    43: "powershell",
    44: "prolog",
    45: "protobuf",
    46: "python",
    47: "r",
    48: "ruby",
    49: "rust",
    50: "sas",
    51: "scala",
    52: "scheme",
    53: "scss",
    54: "shell",
    55: "sql",
    56: "swift",
    57: "thrift",
    58: "typescript",
    59: "vbnet",
    60: "verilog",
    61: "vhdl",
    62: "visual-basic",
    63: "vue",
    64: "xml",
    65: "yaml",
  };
  return map[languageId] || "plaintext";
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
  const result: any = {
    block_type: BLOCK_TYPE_ID_MAP[block.blockType] || 2,
  };

  // 处理分割线（没有文本内容）
  if (block.blockType === "divider") {
    result.divider = {};
    return result;
  }

  // 处理图片
  if (block.blockType === "image" && block.imageToken) {
    result.image = {
      token: block.imageToken,
      width: block.imageWidth,
      height: block.imageHeight,
    };
    return result;
  }

  // 处理文本类块
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
      case "heading4":
        result.heading4 = textContent;
        break;
      case "heading5":
        result.heading5 = textContent;
        break;
      case "heading6":
        result.heading6 = textContent;
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

/**
 * 语言名称到 ID 的映射
 */
function getLanguageCode(language?: string): number {
  if (!language) return 1;
  const map: Record<string, number> = {
    plaintext: 1,
    abap: 2,
    ada: 3,
    apache: 4,
    apex: 5,
    assembly: 6,
    bash: 7,
    c: 8,
    "c#": 9,
    csharp: 9,
    "c++": 10,
    cpp: 10,
    clojure: 11,
    cobol: 12,
    css: 13,
    dart: 14,
    delphi: 15,
    django: 16,
    dockerfile: 17,
    elixir: 18,
    erlang: 19,
    fortran: 20,
    fsharp: 21,
    go: 22,
    groovy: 23,
    haskell: 24,
    html: 25,
    java: 26,
    javascript: 27,
    js: 27,
    json: 28,
    julia: 29,
    kotlin: 30,
    latex: 31,
    lisp: 32,
    lua: 33,
    makefile: 34,
    markdown: 35,
    md: 35,
    matlab: 36,
    nginx: 37,
    "objective-c": 38,
    objc: 38,
    pascal: 39,
    perl: 40,
    php: 41,
    powershell: 43,
    ps1: 43,
    prolog: 44,
    protobuf: 45,
    python: 46,
    py: 46,
    r: 47,
    ruby: 48,
    rb: 48,
    rust: 49,
    rs: 49,
    sas: 50,
    scala: 51,
    scheme: 52,
    scss: 53,
    shell: 54,
    sh: 54,
    sql: 55,
    swift: 56,
    thrift: 57,
    typescript: 58,
    ts: 58,
    vbnet: 59,
    verilog: 60,
    vhdl: 61,
    "visual-basic": 62,
    vb: 62,
    vue: 63,
    xml: 64,
    yaml: 65,
    yml: 65,
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
