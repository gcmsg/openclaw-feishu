# OpenClaw Feishu Plugin / 飞书通道插件

[English](#english) | [中文](#中文)

> ✅ **Compatible with:** OpenClaw, Clawdbot, Moltbot
>
> ✅ **兼容版本：** OpenClaw、Clawdbot、Moltbot

---

## English

A Feishu (Lark) channel plugin for OpenClaw with support for messaging, cloud documents, and drive operations.

### ✨ Features

| Category      | Feature   | Description                |
| ------------- | --------- | -------------------------- |
| **Messaging** | Text      | Send/receive text messages |
|               | Rich Text | Post format support        |
|               | Cards     | Interactive Card messages  |
|               | Images    | Auto upload & send         |
|               | Files     | Auto upload & send         |
| **Documents** | Create    | Create Feishu docs         |
|               | Read      | Get document content       |
|               | Append    | Add text/Markdown          |
| **Drive**     | Folders   | Create, list               |
|               | Files     | Upload, download, search   |

### 📦 Quick Install

```bash
# OpenClaw (latest)
openclaw plugins install https://github.com/gcmsg/openclaw-feishu

# Clawdbot (legacy)
clawdbot plugins install https://github.com/gcmsg/openclaw-feishu
```

Or manually:

```bash
git clone https://github.com/gcmsg/openclaw-feishu ~/.openclaw/extensions/feishu
cd ~/.openclaw/extensions/feishu && npm install
```

### ⚙️ Configuration

#### 1. Create Feishu App

1. Go to [Feishu Open Platform](https://open.feishu.cn/app)
2. Create an "Enterprise Self-built App"
3. Get **App ID** and **App Secret**
4. Enable "Bot" capability
5. Set message receive mode to "**Long Connection**"

#### 2. Add Permissions

**Messaging:**

- `im:message` - Send/receive messages
- `im:message.group_at_msg` - Receive @bot messages
- `im:chat` - Get chat info

**Documents:**

- `docx:document` - Read/write documents

**Drive:**

- `drive:drive` - Manage drive files

#### 3. Configure

```bash
# OpenClaw
openclaw onboard feishu

# Clawdbot
clawdbot onboard feishu
```

Enter your App ID and App Secret when prompted.

---

## 中文

OpenClaw 飞书通道插件，支持消息收发、云文档操作、云空间管理。

### ✨ 功能特性

| 类别       | 功能       | 说明                    |
| ---------- | ---------- | ----------------------- |
| **消息**   | 文本消息   | 发送/接收文本           |
|            | 富文本消息 | 支持 Post 格式          |
|            | 卡片消息   | Interactive Card        |
|            | 图片消息   | 自动上传发送            |
|            | 文件消息   | 自动上传发送            |
| **云文档** | 创建文档   | 创建飞书云文档          |
|            | 读取文档   | 获取文档内容            |
|            | 追加内容   | 向文档追加文本/Markdown |
| **云空间** | 文件夹管理 | 创建、列出              |
|            | 文件操作   | 上传、下载、搜索        |

### 📦 快速安装

```bash
# OpenClaw（最新版）
openclaw plugins install https://github.com/gcmsg/openclaw-feishu

# Clawdbot（旧版）
clawdbot plugins install https://github.com/gcmsg/openclaw-feishu
```

或手动安装：

```bash
git clone https://github.com/gcmsg/openclaw-feishu ~/.openclaw/extensions/feishu
cd ~/.openclaw/extensions/feishu && npm install
```

### ⚙️ 配置步骤

#### 1. 创建飞书应用

1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 创建「企业自建应用」
3. 获取 **App ID** 和 **App Secret**
4. 开启「机器人」能力
5. 消息接收方式选择「**使用长连接接收消息**」

#### 2. 添加权限

**消息相关：**

- `im:message` - 获取与发送消息
- `im:message.group_at_msg` - 接收群聊@机器人消息
- `im:chat` - 获取群组信息

**云文档相关：**

- `docx:document` - 查看和编辑文档

**云空间相关：**

- `drive:drive` - 管理云空间文件

#### 3. 配置

```bash
# OpenClaw
openclaw onboard feishu

# Clawdbot
clawdbot onboard feishu
```

按提示输入 App ID 和 App Secret 即可。

### 🚀 使用示例

配置完成后，通过飞书与 AI 对话：

**操作云文档：**

> "帮我创建一个飞书文档，标题是《会议纪要》"
>
> "在文档末尾追加一段总结"

**管理云空间：**

> "在云空间创建一个叫'项目资料'的文件夹"
>
> "搜索一下云空间里有哪些 PDF 文件"

---

## 📖 API Reference / API 参考

| Action          | Params                    | Description / 说明         |
| --------------- | ------------------------- | -------------------------- |
| `send`          | `target`, `message`       | Send text / 发送文本       |
| `send_card`     | `target`, `card`          | Send card / 发送卡片       |
| `send_image`    | `target`, `filePath`      | Send image / 发送图片      |
| `send_file`     | `target`, `filePath`      | Send file / 发送文件       |
| `doc_create`    | `title`, `folderId?`      | Create doc / 创建文档      |
| `doc_read`      | `documentId`              | Read doc / 读取文档        |
| `doc_append`    | `documentId`, `content`   | Append text / 追加文本     |
| `doc_append_md` | `documentId`, `markdown`  | Append Markdown            |
| `folder_create` | `name`, `parentToken?`    | Create folder / 创建文件夹 |
| `folder_list`   | `folderToken`             | List folder / 列出文件夹   |
| `file_upload`   | `filePath`, `folderToken` | Upload file / 上传文件     |
| `file_download` | `fileToken`, `savePath`   | Download file / 下载文件   |
| `file_search`   | `query`                   | Search files / 搜索文件    |

---

## 🏗️ Project Structure / 项目结构

```
openclaw-feishu/
├── index.ts              # Plugin entry / 插件入口
├── clawdbot.plugin.json  # Plugin manifest / 插件配置
├── src/
│   ├── compat.ts         # SDK compatibility layer / SDK 兼容层
│   ├── channel.ts        # Channel definition / 通道定义
│   ├── client.ts         # Messaging API / 消息 API
│   ├── document.ts       # Document API / 云文档 API
│   ├── space.ts          # Drive API / 云空间 API
│   ├── gateway.ts        # WebSocket gateway / 长连接网关
│   ├── runtime.ts        # Runtime / 运行时
│   └── types.ts          # Type definitions / 类型定义
└── package.json
```

## 🔄 Compatibility / 兼容性

This plugin works with all versions:

| Version  | CLI Command | Status       |
| -------- | ----------- | ------------ |
| OpenClaw | `openclaw`  | ✅ Latest    |
| Clawdbot | `clawdbot`  | ✅ Supported |
| Moltbot  | `moltbot`   | ✅ Supported |

## 📄 License

MIT
