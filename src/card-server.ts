/**
 * 飞书卡片回调 HTTP 服务器
 *
 * 飞书卡片按钮点击走 HTTPS Webhook（POST），不走 WebSocket 长连接。
 * 本模块启动一个本地 HTTP 服务，由 Caddy 反向代理对外暴露 HTTPS。
 *
 * 飞书验签流程：
 *   timestamp + "\n" + nonce + "\n" + token + "\n" + body
 *   → HMAC-SHA256 → base64 → 与 header X-Lark-Signature 比对
 */

import * as http from "node:http";
import * as crypto from "node:crypto";
import type { CardActionData } from "./gateway.js";

export interface CardServerOptions {
  /** 本地监听端口，默认 9991 */
  port?: number;
  /** 飞书开发者后台的 Verification Token（用于验签） */
  verificationToken: string;
  /** 回调处理函数 */
  onCardAction: (action: CardActionData) => Promise<Record<string, any> | void>;
  logger?: {
    info: (msg: string) => void;
    error: (msg: string) => void;
  };
}

export interface CardServer {
  close: () => void;
  port: number;
}

/**
 * 启动卡片回调 HTTP 服务器
 */
export function startCardServer(options: CardServerOptions): CardServer {
  const {
    port = 9991,
    verificationToken,
    onCardAction,
    logger,
  } = options;

  const server = http.createServer(async (req, res) => {
    // 只处理 POST /feishu/card
    if (req.method !== "POST") {
      res.writeHead(405).end("Method Not Allowed");
      return;
    }

    // 读取请求体
    const body = await readBody(req);

    // 验签
    const timestamp = req.headers["x-lark-request-timestamp"] as string || "";
    const nonce = req.headers["x-lark-request-nonce"] as string || "";
    const signature = req.headers["x-lark-signature"] as string || "";

    if (verificationToken && signature) {
      const valid = verifySignature(timestamp, nonce, verificationToken, body, signature);
      if (!valid) {
        logger?.error("[card-server] 验签失败，拒绝请求");
        res.writeHead(403).end("Forbidden");
        return;
      }
    }

    let payload: Record<string, any>;
    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400).end("Bad Request");
      return;
    }

    logger?.info(`[card-server] 收到回调: ${JSON.stringify(payload).slice(0, 200)}`);

    // 飞书 URL 验证（配置卡片请求网址时飞书会发一个 challenge）
    if (payload.type === "url_verification") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ challenge: payload.challenge }));
      return;
    }

    // 卡片交互回调
    const actionValue: Record<string, any> = payload.action?.value || {};
    const cmd: string = actionValue.cmd || "";
    const openId: string =
      payload.open_id || payload.operator?.open_id || payload.user_id || "";
    const openMessageId: string = payload.open_message_id || "";
    const chatId: string =
      actionValue.chat_id || payload.context?.open_chat_id || "";

    if (!cmd) {
      logger?.info("[card-server] 无 cmd 字段，返回空 200");
      res.writeHead(200).end("{}");
      return;
    }

    try {
      const result = await onCardAction({
        openId,
        openMessageId,
        chatId,
        cmd,
        rawValue: actionValue,
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result || {}));
    } catch (err) {
      logger?.error(`[card-server] onCardAction 失败: ${err}`);
      res.writeHead(500).end("Internal Server Error");
    }
  });

  server.listen(port, "127.0.0.1", () => {
    logger?.info(`[card-server] 卡片回调服务器启动，监听 127.0.0.1:${port}`);
  });

  server.on("error", (err) => {
    logger?.error(`[card-server] 服务器错误: ${err}`);
  });

  return {
    close: () => server.close(),
    port,
  };
}

/** 读取请求体 */
function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

/** 飞书验签 */
function verifySignature(
  timestamp: string,
  nonce: string,
  token: string,
  body: string,
  signature: string
): boolean {
  try {
    const content = timestamp + "\n" + nonce + "\n" + token + "\n" + body;
    const expected = crypto
      .createHmac("sha256", token)
      .update(content)
      .digest("hex");
    return expected === signature;
  } catch {
    return false;
  }
}
