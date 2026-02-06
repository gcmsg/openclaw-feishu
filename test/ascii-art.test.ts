import { describe, it, expect } from "vitest";
import { detectAsciiArt, asciiToImage, processAsciiArt } from "../src/ascii-art.js";
import * as fs from "fs";

describe("ASCII Art Detection", () => {
  it("should detect Unicode box-drawing characters", () => {
    const text = `\`\`\`
┌─────────┬─────────┐
│  Name   │  Value  │
├─────────┼─────────┤
│  foo    │  bar    │
└─────────┴─────────┘
\`\`\``;
    const result = detectAsciiArt(text);
    expect(result.hasArt).toBe(true);
    expect(result.blocks.length).toBe(1);
  });

  it("should detect simple ASCII tables", () => {
    const text = `\`\`\`
+-------+-------+
| Col1  | Col2  |
+-------+-------+
| val1  | val2  |
+-------+-------+
\`\`\``;
    const result = detectAsciiArt(text);
    expect(result.hasArt).toBe(true);
  });

  it("should NOT detect regular code blocks", () => {
    const text = `\`\`\`javascript
const x = 1;
console.log(x);
\`\`\``;
    const result = detectAsciiArt(text);
    expect(result.hasArt).toBe(false);
  });

  it("should NOT detect plain text", () => {
    const text = "Hello, this is plain text without any ASCII art.";
    const result = detectAsciiArt(text);
    expect(result.hasArt).toBe(false);
  });

  it("should detect multiple ASCII art blocks", () => {
    const text = `Here's the first table:
\`\`\`
┌───┬───┐
│ A │ B │
└───┴───┘
\`\`\`

And another:
\`\`\`
╔═══╦═══╗
║ X ║ Y ║
╚═══╩═══╝
\`\`\``;
    const result = detectAsciiArt(text);
    expect(result.hasArt).toBe(true);
    expect(result.blocks.length).toBe(2);
  });
});

describe("ASCII to Image Conversion", () => {
  it("should generate a PNG file", async () => {
    const content = `┌─────────┐
│  Test   │
└─────────┘`;
    const imagePath = await asciiToImage(content);

    expect(fs.existsSync(imagePath)).toBe(true);
    expect(imagePath.endsWith(".png")).toBe(true);

    // 检查文件是 PNG 格式
    const buffer = fs.readFileSync(imagePath);
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // P
    expect(buffer[2]).toBe(0x4e); // N
    expect(buffer[3]).toBe(0x47); // G

    // 清理
    fs.unlinkSync(imagePath);
  });

  it("should respect custom options", async () => {
    const content = "Test";
    const imagePath = await asciiToImage(content, {
      fontSize: 20,
      bgColor: "#ffffff",
      textColor: "#000000",
    });

    expect(fs.existsSync(imagePath)).toBe(true);
    fs.unlinkSync(imagePath);
  });
});

describe("Process ASCII Art", () => {
  it("should return unchanged text when no ASCII art", async () => {
    const text = "Just some regular text.";
    const result = await processAsciiArt(text);

    expect(result.hasArt).toBe(false);
    expect(result.cleanText).toBe(text);
    expect(result.imagePaths.length).toBe(0);
  });

  it("should replace ASCII art with placeholder and return image paths", async () => {
    const text = `Before
\`\`\`
┌───┐
│ X │
└───┘
\`\`\`
After`;
    const result = await processAsciiArt(text);

    expect(result.hasArt).toBe(true);
    expect(result.cleanText).toContain("Before");
    expect(result.cleanText).toContain("[ASCII art 已转为图片显示]");
    expect(result.cleanText).toContain("After");
    expect(result.cleanText).not.toContain("┌───┐");
    expect(result.imagePaths.length).toBe(1);

    // 清理
    for (const p of result.imagePaths) {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  });
});
