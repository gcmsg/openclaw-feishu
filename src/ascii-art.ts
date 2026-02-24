/**
 * ASCII Art 检测与图片生成
 */

import { createCanvas } from "canvas";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * 检测文本是否包含 ASCII art
 * 判断标准：
 * 1. 在代码块内（```包裹）
 * 2. 包含框线字符（┌┐└┘│─├┤┬┴┼等）
 * 3. 多行且行长度较一致（表格特征）
 */
export function detectAsciiArt(text: string): { hasArt: boolean; blocks: AsciiBlock[] } {
  const blocks: AsciiBlock[] = [];

  // 匹配代码块
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const content = match[1];
    if (isAsciiArt(content)) {
      blocks.push({
        fullMatch: match[0],
        content: content,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  return { hasArt: blocks.length > 0, blocks };
}

interface AsciiBlock {
  fullMatch: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

/**
 * 判断内容是否为 ASCII art
 */
function isAsciiArt(content: string): boolean {
  // 框线字符
  const boxChars = /[┌┐└┘│─├┤┬┴┼╔╗╚╝║═╠╣╦╩╬┏┓┗┛┃━┣┫┳┻╋╭╮╯╰]/;

  // 检查是否包含框线字符
  if (boxChars.test(content)) {
    return true;
  }

  // 检查简单 ASCII 表格
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length >= 3) {
    // 检查是否有多行使用 +---+ 或 |...| 模式
    const tableLines = lines.filter((l) => /^[\s]*[+|]/.test(l) && /[+|][\s]*$/.test(l));
    if (tableLines.length >= 3) {
      return true;
    }
  }

  return false;
}

/**
 * 将 ASCII art 转换为图片
 */
export async function asciiToImage(
  content: string,
  options?: {
    fontFamily?: string;
    fontSize?: number;
    bgColor?: string;
    textColor?: string;
    padding?: number;
  }
): Promise<string> {
  const {
    fontFamily = "monospace",
    fontSize = 14,
    bgColor = "#1e1e1e",
    textColor = "#d4d4d4",
    padding = 20,
  } = options || {};

  const lines = content.split("\n");
  const lineHeight = fontSize * 1.4;

  // 计算画布尺寸
  // 使用 canvas 测量文本宽度
  const measureCanvas = createCanvas(1, 1);
  const measureCtx = measureCanvas.getContext("2d");
  measureCtx.font = `${fontSize}px ${fontFamily}`;

  let maxWidth = 0;
  for (const line of lines) {
    const width = measureCtx.measureText(line).width;
    if (width > maxWidth) {
      maxWidth = width;
    }
  }

  const canvasWidth = Math.ceil(maxWidth + padding * 2);
  const canvasHeight = Math.ceil(lines.length * lineHeight + padding * 2);

  // 创建实际画布
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // 背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 文字
  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "top";

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], padding, padding + i * lineHeight);
  }

  // 保存到临时文件
  const tmpDir = os.tmpdir();
  const filename = `ascii-art-${Date.now()}.png`;
  const filepath = path.join(tmpDir, filename);

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(filepath, buffer);

  return filepath;
}

/**
 * 处理文本中的 ASCII art，返回处理结果
 */
export async function processAsciiArt(text: string): Promise<{
  hasArt: boolean;
  cleanText: string;
  imagePaths: string[];
}> {
  const { hasArt, blocks } = detectAsciiArt(text);

  if (!hasArt) {
    return { hasArt: false, cleanText: text, imagePaths: [] };
  }

  const imagePaths: string[] = [];
  let cleanText = text;

  // 从后往前处理，避免索引偏移
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    const imagePath = await asciiToImage(block.content);
    imagePaths.unshift(imagePath); // 保持顺序

    // 替换为占位符提示
    cleanText =
      cleanText.slice(0, block.startIndex) +
      "[ASCII art 已转为图片显示]" +
      cleanText.slice(block.endIndex);
  }

  return { hasArt: true, cleanText, imagePaths };
}
