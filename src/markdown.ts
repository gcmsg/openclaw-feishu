/**
 * Markdown 转飞书 Post 格式
 */

export interface PostElement {
  tag: "text" | "a" | "at" | "img";
  text?: string;
  href?: string;
  user_id?: string;
  image_key?: string;
  style?: ("bold" | "italic" | "underline" | "lineThrough")[];
}

export interface PostContent {
  zh_cn: {
    title?: string;
    content: PostElement[][];
  };
}

/**
 * 将 Markdown 文本转换为飞书 Post 格式
 */
export function markdownToPost(markdown: string, title?: string): PostContent {
  const lines = markdown.split("\n");
  const content: PostElement[][] = [];

  let inCodeBlock = false;
  let codeBlockLang = "";

  for (const line of lines) {
    // 检测代码块开始/结束
    const codeBlockMatch = line.match(/^```(\w*)$/);
    if (codeBlockMatch) {
      if (!inCodeBlock) {
        // 代码块开始
        inCodeBlock = true;
        codeBlockLang = codeBlockMatch[1] || "code";
        content.push([{ tag: "text", text: `┌─ ${codeBlockLang} ─┐` }]);
      } else {
        // 代码块结束
        inCodeBlock = false;
        content.push([{ tag: "text", text: "└───────────┘" }]);
        codeBlockLang = "";
      }
      continue;
    }

    if (inCodeBlock) {
      // 代码块内容，保持原样，加前缀
      content.push([{ tag: "text", text: `│ ${line}` }]);
      continue;
    }

    const elements = parseLine(line);
    if (elements.length > 0) {
      content.push(elements);
    }
  }

  // 如果代码块未闭合，补上结束标记
  if (inCodeBlock) {
    content.push([{ tag: "text", text: "└───────────┘" }]);
  }

  return {
    zh_cn: {
      title,
      content,
    },
  };
}

/**
 * 解析单行 Markdown
 */
function parseLine(line: string): PostElement[] {
  const trimmed = line.trim();

  // 空行
  if (!trimmed) {
    return [];
  }

  // 标题行 (## xxx) - 转为加粗
  const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
  if (headingMatch) {
    return [{ tag: "text", text: headingMatch[1], style: ["bold"] }];
  }

  // 列表项 (- xxx 或 * xxx)
  const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
  if (listMatch) {
    return [{ tag: "text", text: "• " }, ...parseInline(listMatch[1])];
  }

  // 有序列表 (1. xxx)
  const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
  if (orderedMatch) {
    return [{ tag: "text", text: `${orderedMatch[1]}. ` }, ...parseInline(orderedMatch[2])];
  }

  // Checkbox [ ] 或 [x]
  const checkboxMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
  if (checkboxMatch) {
    const checked = checkboxMatch[1].toLowerCase() === "x";
    const icon = checked ? "✅ " : "⬜ ";
    return [{ tag: "text", text: icon }, ...parseInline(checkboxMatch[2])];
  }

  // 分隔线
  if (/^[-*_]{3,}$/.test(trimmed)) {
    return [{ tag: "text", text: "───────────" }];
  }

  // 普通行
  return parseInline(trimmed);
}

/**
 * 解析行内 Markdown 元素
 */
function parseInline(text: string): PostElement[] {
  const elements: PostElement[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // 链接 [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      elements.push({ tag: "a", text: linkMatch[1], href: linkMatch[2] });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 加粗 **text** 或 __text__
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/) || remaining.match(/^__([^_]+)__/);
    if (boldMatch) {
      elements.push({ tag: "text", text: boldMatch[1], style: ["bold"] });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 斜体 *text* 或 _text_
    const italicMatch = remaining.match(/^\*([^*]+)\*/) || remaining.match(/^_([^_]+)_/);
    if (italicMatch) {
      elements.push({ tag: "text", text: italicMatch[1], style: ["italic"] });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 行内代码 `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      elements.push({ tag: "text", text: `「${codeMatch[1]}」` });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 普通字符
    const nextSpecial = remaining.search(/[[*_`]/);
    if (nextSpecial === -1) {
      elements.push({ tag: "text", text: remaining });
      break;
    } else if (nextSpecial === 0) {
      // 特殊字符但没匹配到模式，当普通字符处理
      elements.push({ tag: "text", text: remaining[0] });
      remaining = remaining.slice(1);
    } else {
      elements.push({ tag: "text", text: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
    }
  }

  return elements;
}

/**
 * 检测文本是否包含 Markdown 格式
 */
export function hasMarkdown(text: string): boolean {
  // 检测常见 Markdown 模式
  const patterns = [
    /^#{1,6}\s/m, // 标题
    /\*\*[^*]+\*\*/, // 加粗
    /\[[^\]]+\]\([^)]+\)/, // 链接
    /^[-*]\s/m, // 列表
    /^\d+\.\s/m, // 有序列表
    /^[-*]\s+\[[ xX]\]/m, // Checkbox
    /`[^`]+`/, // 行内代码
    /^[-*_]{3,}$/m, // 分隔线
    /^```\w*$/m, // 代码块
  ];

  return patterns.some((p) => p.test(text));
}
