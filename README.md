# Feishu Plus - Clawdbot 飞书增强插件

飞书机器人增强插件，支持消息、云文档、云空间操作。

## ✨ 功能

| 类别 | 功能 | 说明 |
|------|------|------|
| **消息** | 文本消息 | 发送/接收文本 |
| | 富文本消息 | 支持 Post 格式 |
| | 卡片消息 | Interactive Card |
| | 图片消息 | 自动上传发送 |
| | 文件消息 | 自动上传发送 |
| **云文档** | 创建文档 | 创建飞书云文档 |
| | 读取文档 | 获取文档内容 |
| | 追加内容 | 向文档追加文本/Markdown |
| **云空间** | 文件夹管理 | 创建、列出 |
| | 文件操作 | 上传、下载、搜索 |

## 📦 安装

```bash
# 通过 Clawdbot 安装
clawdbot extensions add https://github.com/gcmsg/openclaw-feishu

# 或手动克隆
git clone https://github.com/gcmsg/openclaw-feishu ~/.clawdbot/extensions/feishu-plus
cd ~/.clawdbot/extensions/feishu-plus
npm install
```

## ⚙️ 配置

### 1. 创建飞书应用

1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 创建「企业自建应用」
3. 获取 **App ID** 和 **App Secret**
4. 开启「机器人」能力
5. 消息接收方式选择「**使用长连接接收消息**」

### 2. 添加权限

在应用的「权限管理」中添加以下权限：

**消息相关：**
- `im:message` - 获取与发送单聊、群组消息
- `im:message.group_at_msg` - 接收群聊中@机器人消息
- `im:chat` - 获取群组信息

**云文档相关：**
- `docx:document` - 查看、评论和编辑新版文档
- `docx:document:readonly` - 查看新版文档

**云空间相关：**
- `drive:drive` - 查看、评论、编辑和管理云空间中所有文件
- `drive:drive:readonly` - 查看云空间中文件

### 3. 发布应用

在「版本管理与发布」中创建版本并发布。

### 4. 配置 Clawdbot

```bash
clawdbot onboard feishu
```

按提示输入 App ID 和 App Secret。

## 🚀 使用

配置完成后，你可以通过飞书与 Clawdbot 对话，并使用以下功能：

### 让 AI 操作云文档

> "帮我创建一个飞书文档，标题是《会议纪要》"
> 
> "把刚才的调查结果写入那个文档"
> 
> "在文档末尾追加一段总结"

### 让 AI 管理云空间

> "在云空间创建一个叫'项目资料'的文件夹"
> 
> "把这份报告上传到那个文件夹"
> 
> "搜索一下云空间里有哪些 PDF 文件"

## 📖 API 参考

### Message Actions

通过 `message` tool 可以调用以下 actions：

| Action | 参数 | 说明 |
|--------|------|------|
| `send` | `target`, `message` | 发送文本消息 |
| `send_card` | `target`, `card` | 发送卡片消息 |
| `send_image` | `target`, `filePath` | 发送图片 |
| `send_file` | `target`, `filePath` | 发送文件 |
| `doc_create` | `title`, `folderId?` | 创建文档 |
| `doc_get` | `documentId` | 获取文档信息 |
| `doc_read` | `documentId` | 读取文档内容 |
| `doc_append` | `documentId`, `content` | 追加文本 |
| `doc_append_md` | `documentId`, `markdown` | 追加 Markdown |
| `folder_create` | `name`, `parentToken?` | 创建文件夹 |
| `folder_list` | `folderToken` | 列出文件夹 |
| `file_upload` | `filePath`, `folderToken` | 上传文件 |
| `file_download` | `fileToken`, `savePath` | 下载文件 |
| `file_search` | `query` | 搜索文件 |

### 编程接口

```typescript
import {
  createDocument,
  appendMarkdown,
  uploadFile,
  searchFiles,
} from "feishu-plus";

// 创建文档
const doc = await createDocument(account, "周报");
console.log(doc.data?.url);

// 追加 Markdown
await appendMarkdown(account, doc.data.documentId, `
# 本周工作
- 完成了 A 功能
- 修复了 B bug
`);

// 上传文件
await uploadFile(account, "./report.pdf", folderToken);

// 搜索
const result = await searchFiles(account, "季度报告");
```

## 🏗️ 项目结构

```
feishu-plus/
├── index.ts           # 插件入口
├── clawdbot.plugin.json  # 插件配置
├── src/
│   ├── channel.ts     # 通道插件定义
│   ├── client.ts      # 消息 API
│   ├── document.ts    # 云文档 API
│   ├── space.ts       # 云空间 API
│   ├── gateway.ts     # 长连接网关
│   ├── runtime.ts     # 运行时
│   └── types.ts       # 类型定义
└── package.json
```

## 📋 与现有插件的区别

| 功能 | 原飞书插件 | Feishu Plus |
|------|-----------|-------------|
| 文本消息 | ✅ | ✅ |
| 富文本消息 | ❌ | ✅ |
| 卡片消息 | ❌ | ✅ |
| 图片消息 | ❌ | ✅ |
| 文件消息 | ❌ | ✅ |
| 云文档操作 | ❌ | ✅ |
| 云空间操作 | ❌ | ✅ |
| Message Actions | ❌ | ✅ |

## 📄 License

MIT
