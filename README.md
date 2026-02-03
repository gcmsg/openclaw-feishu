# OpenClaw Feishu Plugin / 飞书通道插件

[English](#english) | [中文](#中文)

> ✅ **Compatible with:** OpenClaw, Clawdbot, Moltbot
>
> ✅ **兼容版本：** OpenClaw、Clawdbot、Moltbot

---

## English

A comprehensive Feishu (Lark) channel plugin for OpenClaw with support for messaging, cloud documents, spreadsheets, databases, calendar, and tasks.

### ✨ Features

| Category      | Features                                                                            |
| ------------- | ----------------------------------------------------------------------------------- |
| **Messaging** | Text, Rich Text, Cards, Images, Files, Voice, Quote, Forward, Urgent                |
| **Chat**      | Create/manage groups, Members, Managers, Tabs, Top notice, Announcement             |
| **Documents** | Create, Read, Update, Delete blocks, Insert at position, Markdown support           |
| **Bitable**   | Apps/tables, Fields, Records, Views, Roles, Members, Automation                     |
| **Sheets**    | Create/read/write cells, Row/column operations, Styles, Merge, Sort, Filter, Freeze |
| **Calendar**  | Events, Attendees, Free/busy, Subscribe, ACL permissions                            |
| **Tasks**     | Tasks, Lists, Reminders, Members, Dependencies, Attachments                         |
| **Wiki**      | Spaces, Nodes (pages), Members management, Move/copy nodes                          |
| **Search**    | Messages, Documents, Drive files, Universal search                                  |
| **AI**        | OCR (image text recognition), Speech-to-Text, Translation, Language detection       |
| **Mail**      | Send/read emails, Folders, Mail groups, Public mailboxes, Members management        |
| **Contact**   | Users, Departments, User groups, Members, Batch operations, Search                  |
| **Approval**  | Create/query approvals, Approve/reject/transfer tasks, Comments, CC, Add sign       |
| **Lingo**     | Entity CRUD, Search, Match, Highlight, Classifications, Repos, Drafts               |

### ⚠️ Before You Install / 安装前必读

> **Important:** Back up your config file before installing any plugin!
>
> **重要：** 安装任何插件前，请先备份配置文件！

```bash
# OpenClaw
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak

# Clawdbot
cp ~/.clawdbot/clawdbot.json ~/.clawdbot/clawdbot.json.bak
```

If something goes wrong after installation, see [Recovery Guide](#-recovery-guide--恢复指南) below.

如果安装后出现问题，请参阅下方的[恢复指南](#-recovery-guide--恢复指南)。

---

### 🚀 Prerequisites: Install OpenClaw

Before installing this plugin, you need to have OpenClaw (or Clawdbot) installed.

#### Option 1: Quick Install (Recommended)

```bash
# Install OpenClaw globally via npm
npm install -g openclaw

# Verify installation
openclaw --version
```

#### Option 2: Using npx (No Install)

```bash
# Run directly without installing
npx openclaw onboard
```

#### Option 3: From Source

```bash
# Clone the repository
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# Install dependencies
pnpm install

# Build
pnpm build

# Link globally
npm link
```

#### First-time Setup

After installation, run the onboard wizard to configure your first channel:

```bash
openclaw onboard
```

For more details, see [OpenClaw Documentation](https://docs.openclaw.bot) or [GitHub Repository](https://github.com/openclaw/openclaw).

---

### 📦 Quick Install

```bash
# OpenClaw (latest)
openclaw plugins install https://github.com/gcmsg/openclaw-feishu

# Clawdbot
clawdbot plugins install https://github.com/gcmsg/openclaw-feishu
```

### 🔄 Update to Latest Version

To update an existing installation to the latest version:

```bash
# Step 1: Remove old version
rm -rf ~/.openclaw/extensions/feishu  # or: ~/.clawdbot/extensions/feishu

# Step 2: Reinstall from GitHub
openclaw plugins install https://github.com/gcmsg/openclaw-feishu
# or: clawdbot plugins install https://github.com/gcmsg/openclaw-feishu

# Step 3: Restart gateway
openclaw gateway restart  # or: clawdbot gateway restart
```

> 💡 **Tip:** Your configuration (appId, appSecret in config file) will be preserved — only the plugin code is replaced.
>
> ⚠️ **Note:** `plugins update` only works for npm-installed plugins. Since this plugin is installed from GitHub archive, use the reinstall method above.

### 🔧 Post-Install Configuration

After installation, configure the plugin with these commands:

```bash
# Step 1: Add to allowlist (REQUIRED if plugins.allow is already set)
clawdbot config set 'plugins.allow' '["feishu"]'

# Or append to existing allowlist (e.g., if you have telegram):
# clawdbot config set 'plugins.allow' '["telegram", "feishu"]'

# Step 2: Configure credentials
clawdbot config set channels.feishu.appId "cli_your_app_id"
clawdbot config set channels.feishu.appSecret "your_app_secret"
clawdbot config set channels.feishu.enabled true

# Step 3: Restart gateway
clawdbot gateway restart
```

### 🔒 Understanding the Allowlist

| Scenario | Plugin Loads? |
|----------|---------------|
| `plugins.allow` not set or empty | ✅ Yes (all plugins enabled by default) |
| `plugins.allow: ["telegram"]` (feishu not included) | ❌ No |
| `plugins.allow: ["telegram", "feishu"]` | ✅ Yes |

> 💡 **Tip:** Check your current allowlist with `clawdbot config get plugins.allow`

### 💡 Pro Tip: Add Feishu Skill

After installation, tell your AI assistant to add Feishu capabilities as a skill for easier use:

> "Add the complete Feishu API capabilities as a skill so you can help me with Feishu operations."

Or simply say:

> "Learn all Feishu tool actions and remember them."

This helps your assistant understand 200+ Feishu operations including documents, bitable, calendar, tasks, approvals, and more!

### 🛠️ Agent Tool Architecture

This plugin provides a dedicated **`feishu` agent tool** for Feishu-specific operations (cards, documents, bitable, etc.).

**Why a separate tool?**

The core `message` tool only supports standard messaging actions (`send`, `react`, `delete`, etc.). Feishu's rich features (card messages, cloud documents, bitable, calendar, etc.) require a dedicated tool with its own action schema.

**How it works:**

```
message tool  →  Basic messaging (send text, react)
feishu tool   →  Feishu-specific (send_card, doc_create, bitable_records, etc.)
```

**After installation**, the `feishu` tool is automatically available to AI agents. No additional configuration needed.

**Example usage in AI conversation:**

```
User: 发一个卡片消息到群里
AI: [calls feishu tool with action="send_card", target="chat_id", card={...}]

User: 创建一个文档
AI: [calls feishu tool with action="doc_create", title="新文档"]

User: 查询多维表格的记录
AI: [calls feishu tool with action="bitable_records", appToken="xxx", tableId="xxx"]
```

### ⚙️ Configuration

Follow this step-by-step guide to create your Feishu bot application from scratch.

---

#### 📝 Step 1: Create Application

1. Go to [Feishu Open Platform](https://open.feishu.cn/app)
2. Click **"Create Custom App"** in the top right
3. Fill in the application info:
   - **App Name**: Name your bot (e.g., Nina, My Assistant)
   - **Description**: Brief description of your app
   - **App Icon**: Upload an icon (optional)
4. Click **"Create"** to finish

---

#### 🔑 Step 2: Get Credentials

1. Enter the app you just created
2. Click **"Credentials & Basic Info"** in the left menu
3. Note down:
   - **App ID** (unique app identifier)
   - **App Secret** (click "Show" to view, keep it secret!)

---

#### 🤖 Step 3: Add Bot Capability

1. Click **"App Capabilities"** → **"Add Capability"** in the left menu
2. Find **"Bot"** and click **"Add"**
3. Configure bot info:
   - **Bot Name**: Name users see in chats
   - **Bot Description**: Bot functionality description
4. **Message Receive Method**: Select **"Long Connection"** (Important!)
   - ✅ Long Connection: No public server needed, good for personal use
   - ❌ Webhook: Requires a public server to receive callbacks

---

#### 📡 Step 4: Configure Event Subscriptions (Important!)

1. Click **"Development Settings"** → **"Events & Callbacks"** in the left menu
2. Ensure **"Subscription Method"** is set to **"Long Connection"**
3. Click **"Add Event"** and add the following events:

| Event Name | Event ID | Purpose |
|------------|----------|---------|
| Receive Message | `im.message.receive_v1` | Receive messages from users |
| Message Read | `im.message.message_read_v1` | Get message read status (optional) |
| Chat Member Change | `im.chat.member.user.added_v1` | Notify when bot is added to group (optional) |

> 💡 **You must at least add "Receive Message" event**, or the bot won't receive any messages!

---

#### 🔐 Step 5: Configure Permissions

1. Click **"Development Settings"** → **"Permissions & Scopes"** in the left menu
2. Click **"Add Permission"**
3. Search and select permissions based on needed features:

**Basic Features (Required):**
| Permission Name | Permission ID | Description |
|-----------------|---------------|-------------|
| Send and receive messages | `im:message` | Basic permission for messaging |
| Read chat info | `im:chat:readonly` | Read group information |
| Manage chat | `im:chat` | Manage group chats |

**Advanced Features (As Needed):**
| Feature | Permission ID |
|---------|---------------|
| Documents | `docx:document`, `docx:document:readonly` |
| Drive | `drive:drive`, `drive:drive:readonly` |
| Bitable | `bitable:app` |
| Sheets | `sheets:spreadsheet` |
| Calendar | `calendar:calendar`, `calendar:calendar:readonly` |
| Tasks | `task:task`, `task:task:readonly` |
| Wiki | `wiki:wiki`, `wiki:wiki:readonly` |
| Contacts | `contact:user.base:readonly`, `contact:department.base:readonly` |
| Speech to Text | `im:message:speech_to_text` |
| AI OCR | `optical_char_recognition:image` |
| AI Translation | `translation:text` |
| Search Messages | `search:message` |
| Search Docs | `suite:docs_search` |

> 💡 **Tip**: Start with basic permissions, add more as needed.

---

#### 🚀 Step 6: Publish Application

1. Click **"Version Management"** in the left menu
2. Click **"Create Version"**
3. Fill in version info:
   - **Version Number**: e.g., `1.0.0`
   - **Release Notes**: Describe this release
   - **Availability**: Choose who can use it
     - **All Members**: Everyone in the organization
     - **Specific Scope**: Only selected departments/users
4. Click **"Save"**, then click **"Submit for Review"**
5. Wait for admin approval (if you're admin, approve it directly)

> ⚠️ **Important**: Every time you modify permissions, you need to create a new version and republish!

---

#### ✅ Step 7: Configure Plugin

After completing the above configuration, choose one of these methods:

**Option A: Interactive Setup (Recommended)**

```bash
# Clawdbot - interactive wizard
clawdbot feishu setup
```

**Option B: Onboard Command**

```bash
# OpenClaw
openclaw onboard feishu

# Clawdbot
clawdbot onboard feishu
```

**Option C: Non-interactive Setup**

```bash
clawdbot feishu setup --app-id YOUR_APP_ID --app-secret YOUR_APP_SECRET --non-interactive
```

Enter your **App ID** and **App Secret** when prompted (for Option A or B).

---

#### 🎉 Verify Success

1. Search for your bot name in Feishu
2. Send a message
3. If the bot responds, congratulations!

**Troubleshooting:**
- ❌ **Not receiving messages**: Check if "Receive Message" event is added
- ❌ **No permission**: Check if permissions are added and version is published
- ❌ **Long connection disconnects**: Check if message receive method is "Long Connection"

---

#### Required Permissions

| Feature   | Permissions                                                                   |
| --------- | ----------------------------------------------------------------------------- |
| Messaging | `im:message`, `im:chat`                                                       |
| Voice     | `im:message:speech_to_text`                                                   |
| Documents | `docx:document`                                                               |
| Wiki      | `wiki:wiki`                                                                   |
| Search    | `search:message`, `suite:docs_search`                                         |
| AI        | `optical_char_recognition:image`, `speech_to_text:speech`, `translation:text` |
| Drive     | `drive:drive`                                                                 |
| Bitable   | `bitable:app`                                                                 |
| Sheets    | `sheets:spreadsheet`                                                          |
| Calendar  | `calendar:calendar`                                                           |
| Tasks     | `task:task`                                                                   |

---

## 中文

OpenClaw 飞书通道插件，支持消息收发、云文档、多维表格、电子表格、日历、任务等全面功能。

### ✨ 功能特性

| 类别         | 功能                                                    |
| ------------ | ------------------------------------------------------- |
| **消息**     | 文本、富文本、卡片、图片、文件、语音转文字、引用回复    |
| **云文档**   | 创建、读取、更新、删除块、指定位置插入、Markdown 支持   |
| **多维表格** | 创建应用/数据表、字段管理、记录 CRUD、批量操作          |
| **电子表格** | 创建/读写单元格、行列操作、样式、合并、排序、筛选、冻结 |
| **日历**     | 创建日程、列出/搜索日程、参与者管理、忙闲查询           |
| **任务**     | 创建/完成任务、任务列表、提醒                           |

### ⚠️ 安装前必读

> **重要：** 安装任何插件前，请先备份配置文件！

```bash
# OpenClaw
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak

# Clawdbot
cp ~/.clawdbot/clawdbot.json ~/.clawdbot/clawdbot.json.bak
```

如果安装后出现问题，请参阅下方的[恢复指南](#-recovery-guide--恢复指南)。

---

### 🚀 前置条件：安装 OpenClaw

在安装本插件之前，你需要先安装 OpenClaw（或 Clawdbot）。

#### 方式一：快速安装（推荐）

```bash
# 通过 npm 全局安装 OpenClaw
npm install -g openclaw

# 验证安装
openclaw --version
```

#### 方式二：使用 npx（无需安装）

```bash
# 直接运行，无需安装
npx openclaw onboard
```

#### 方式三：从源码安装

```bash
# 克隆仓库
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 安装依赖
pnpm install

# 构建
pnpm build

# 全局链接
npm link
```

#### 首次配置

安装完成后，运行 onboard 向导配置你的第一个通道：

```bash
openclaw onboard
```

更多详情请参阅 [OpenClaw 文档](https://docs.openclaw.bot) 或 [GitHub 仓库](https://github.com/openclaw/openclaw)。

---

### 📦 快速安装

```bash
# OpenClaw（最新版）
openclaw plugins install https://github.com/gcmsg/openclaw-feishu

# Clawdbot
clawdbot plugins install https://github.com/gcmsg/openclaw-feishu
```

### 🔄 更新到最新版

将已安装的插件更新到最新版本：

```bash
# 第一步：删除旧版本
rm -rf ~/.openclaw/extensions/feishu  # 或: ~/.clawdbot/extensions/feishu

# 第二步：从 GitHub 重新安装
openclaw plugins install https://github.com/gcmsg/openclaw-feishu
# 或: clawdbot plugins install https://github.com/gcmsg/openclaw-feishu

# 第三步：重启 Gateway
openclaw gateway restart  # 或: clawdbot gateway restart
```

> 💡 **提示：** 配置文件中的设置（appId、appSecret）会被保留，只替换插件代码。
>
> ⚠️ **注意：** `plugins update` 命令仅支持通过 npm 安装的插件。由于本插件通过 GitHub archive 安装，请使用上述重装方法更新。

### 🔧 安装后配置

安装后，使用以下命令配置插件：

```bash
# 第一步：添加到白名单（如果 plugins.allow 已设置则必须）
clawdbot config set 'plugins.allow' '["feishu"]'

# 或追加到现有白名单（比如已有 telegram）：
# clawdbot config set 'plugins.allow' '["telegram", "feishu"]'

# 第二步：配置凭证
clawdbot config set channels.feishu.appId "cli_你的应用ID"
clawdbot config set channels.feishu.appSecret "你的应用密钥"
clawdbot config set channels.feishu.enabled true

# 第三步：重启 Gateway
clawdbot gateway restart
```

### 🔒 理解白名单机制

| 场景 | 插件是否加载？ |
|------|---------------|
| `plugins.allow` 未设置或为空 | ✅ 是（所有插件默认启用） |
| `plugins.allow: ["telegram"]`（不含 feishu） | ❌ 否 |
| `plugins.allow: ["telegram", "feishu"]` | ✅ 是 |

> 💡 **提示：** 用 `clawdbot config get plugins.allow` 查看当前白名单

### 💡 小技巧：添加飞书 Skill

安装完成后，告诉你的 AI 助手添加飞书能力作为 skill，方便日后使用：

> "把飞书的全部 API 能力添加为 skill，这样你就能帮我处理飞书相关的操作了。"

或者简单说：

> "学习并记住所有飞书工具的操作。"

这样助手就能理解 200+ 种飞书操作，包括云文档、多维表格、日历、任务、审批等！

### 🛠️ Agent 工具架构

本插件提供独立的 **`feishu` Agent 工具**，用于飞书特有的功能（卡片消息、云文档、多维表格等）。

**为什么需要独立工具？**

核心 `message` 工具只支持标准消息操作（`send`、`react`、`delete` 等）。飞书丰富的功能（卡片消息、云文档、多维表格、日历等）需要专用工具和独立的 action schema。

**工作原理：**

```
message 工具  →  基础消息（发送文本、表情回复）
feishu 工具   →  飞书专属（send_card、doc_create、bitable_records 等 200+ 操作）
```

**安装后**，`feishu` 工具自动对 AI 助手可用，无需额外配置。

**AI 对话中的使用示例：**

```
用户: 发一个卡片消息到群里
AI: [调用 feishu 工具，action="send_card", target="chat_id", card={...}]

用户: 创建一个文档
AI: [调用 feishu 工具，action="doc_create", title="新文档"]

用户: 查询多维表格的记录
AI: [调用 feishu 工具，action="bitable_records", appToken="xxx", tableId="xxx"]
```

### ⚙️ 配置步骤

下面是完整的手把手教程，指导你从零开始创建飞书机器人应用。

---

#### 📝 第一步：创建应用

1. 打开 [飞书开放平台](https://open.feishu.cn/app)
2. 点击右上角 **「创建企业自建应用」**
3. 填写应用信息：
   - **应用名称**：给你的机器人起个名字（如：Nina、我的助手）
   - **应用描述**：简单描述应用用途
   - **应用图标**：上传一个图标（可选）
4. 点击 **「创建」** 完成

---

#### 🔑 第二步：获取凭证

1. 进入刚创建的应用
2. 在左侧菜单点击 **「凭证与基础信息」**
3. 记录下：
   - **App ID**（应用唯一标识）
   - **App Secret**（点击「显示」查看，注意保密！）

---

#### 🤖 第三步：添加机器人能力

1. 在左侧菜单点击 **「应用能力」** → **「添加应用能力」**
2. 找到 **「机器人」**，点击 **「添加」**
3. 配置机器人信息：
   - **机器人名称**：用户在聊天中看到的名字
   - **机器人描述**：机器人功能说明
4. **消息接收方式**：选择 **「使用长连接接收消息」**（重要！）
   - ✅ 长连接模式：无需公网服务器，适合个人使用
   - ❌ Webhook 模式：需要公网服务器接收回调

---

#### 📡 第四步：配置事件订阅（重要！）

1. 在左侧菜单点击 **「开发配置」** → **「事件与回调」**
2. 确认 **「订阅方式」** 选择了 **「使用长连接接收事件」**
3. 点击 **「添加事件」**，搜索并添加以下事件：

| 事件名称 | 事件标识 | 用途 |
|---------|---------|------|
| 接收消息 | `im.message.receive_v1` | 接收用户发送的消息 |
| 消息已读 | `im.message.message_read_v1` | 获取消息已读状态（可选） |
| 群成员变更 | `im.chat.member.user.added_v1` | 机器人被拉入群聊时通知（可选） |

> 💡 **至少要添加「接收消息」事件**，否则机器人收不到任何消息！

---

#### 🔐 第五步：配置权限

1. 在左侧菜单点击 **「开发配置」** → **「权限管理」**
2. 点击 **「添加权限」**
3. 根据需要的功能，搜索并勾选对应权限：

**基础功能（必选）：**
| 权限名称 | 权限标识 | 说明 |
|---------|---------|------|
| 获取与发送单聊、群组消息 | `im:message` | 收发消息的基础权限 |
| 获取群组信息 | `im:chat:readonly` | 读取群信息 |
| 获取与更新群组信息 | `im:chat` | 管理群聊 |

**进阶功能（按需选择）：**
| 功能 | 权限标识 |
|------|---------|
| 云文档 | `docx:document`、`docx:document:readonly` |
| 云空间/网盘 | `drive:drive`、`drive:drive:readonly` |
| 多维表格 | `bitable:app` |
| 电子表格 | `sheets:spreadsheet` |
| 日历 | `calendar:calendar`、`calendar:calendar:readonly` |
| 任务 | `task:task`、`task:task:readonly` |
| 知识库 | `wiki:wiki`、`wiki:wiki:readonly` |
| 通讯录 | `contact:user.base:readonly`、`contact:department.base:readonly` |
| 语音转文字 | `im:message:speech_to_text` |
| AI OCR | `optical_char_recognition:image` |
| AI 翻译 | `translation:text` |
| 搜索消息 | `search:message` |
| 搜索文档 | `suite:docs_search` |

> 💡 **建议**：先添加基础权限，后续用到什么功能再补充对应权限。

---

#### 🚀 第六步：发布应用

1. 在左侧菜单点击 **「版本管理与发布」**
2. 点击 **「创建版本」**
3. 填写版本信息：
   - **版本号**：如 `1.0.0`
   - **更新说明**：描述本次发布内容
   - **可用范围**：选择哪些人可以使用
     - **全部成员**：企业内所有人都能使用
     - **指定范围**：只有选中的部门/人员能使用
4. 点击 **「保存」**，然后点击 **「申请发布」**
5. 等待管理员审核（如果你是管理员，可以在管理后台直接通过）

> ⚠️ **重要**：每次修改权限后，都需要创建新版本并重新发布！

---

#### ✅ 第七步：配置插件

完成上述配置后，选择以下任一方式配置：

**方式 A：交互式配置（推荐）**

```bash
# Clawdbot - 交互式向导
clawdbot feishu setup
```

**方式 B：Onboard 命令**

```bash
# OpenClaw
openclaw onboard feishu

# Clawdbot
clawdbot onboard feishu
```

**方式 C：非交互式配置**

```bash
clawdbot feishu setup --app-id 你的APP_ID --app-secret 你的APP_SECRET --non-interactive
```

按提示输入 **App ID** 和 **App Secret**（方式 A 或 B）。

---

#### 🎉 验证是否成功

1. 在飞书中搜索你的机器人名称
2. 发送一条消息
3. 如果机器人有回复，恭喜配置成功！

**常见问题排查：**
- ❌ **收不到消息**：检查是否添加了「接收消息」事件
- ❌ **没有权限**：检查权限是否已添加，版本是否已发布
- ❌ **长连接断开**：检查消息接收方式是否选择了「长连接」

---

#### 所需权限

| 功能       | 权限                        |
| ---------- | --------------------------- |
| 消息       | `im:message`, `im:chat`     |
| 语音转文字 | `im:message:speech_to_text` |
| 云文档     | `docx:document`             |
| 云空间     | `drive:drive`               |
| 多维表格   | `bitable:app`               |
| 电子表格   | `sheets:spreadsheet`        |
| 日历       | `calendar:calendar`         |
| 任务       | `task:task`                 |

---

## 📖 API Reference / API 参考

### 消息 / Messaging

| Action       | Params               | Description  |
| ------------ | -------------------- | ------------ |
| `send`       | `target`, `message`  | 发送文本消息 |
| `send_card`  | `target`, `card`     | 发送卡片消息 |
| `send_image` | `target`, `filePath` | 发送图片     |
| `send_file`  | `target`, `filePath` | 发送文件     |

### 云文档 / Documents

| Action              | Params                                      | Description            |
| ------------------- | ------------------------------------------- | ---------------------- |
| `doc_create`        | `title`, `folderId?`                        | 创建文档               |
| `doc_get`           | `documentId`                                | 获取文档信息           |
| `doc_read`          | `documentId`                                | 读取文档纯文本         |
| `doc_structure`     | `documentId`                                | 获取文档结构（块列表） |
| `doc_append`        | `documentId`, `content`                     | 追加文本               |
| `doc_append_md`     | `documentId`, `markdown`                    | 追加 Markdown          |
| `doc_prepend`       | `documentId`, `content`                     | 在开头插入             |
| `doc_insert_after`  | `documentId`, `blockId`, `content`          | 在指定块后插入         |
| `doc_block_get`     | `documentId`, `blockId`                     | 获取指定块             |
| `doc_block_update`  | `documentId`, `blockId`, `text`, `checked?` | 更新块内容             |
| `doc_block_delete`  | `documentId`, `blockId`                     | 删除块                 |
| `doc_blocks_delete` | `documentId`, `blockIds`                    | 批量删除块             |

### 多维表格 / Bitable

| Action                   | Params                                          | Description  |
| ------------------------ | ----------------------------------------------- | ------------ |
| `bitable_create`         | `name`, `folderId?`                             | 创建多维表格 |
| `bitable_get`            | `appToken`                                      | 获取表格信息 |
| `bitable_tables`         | `appToken`                                      | 列出数据表   |
| `bitable_table_create`   | `appToken`, `name`                              | 创建数据表   |
| `bitable_fields`         | `appToken`, `tableId`                           | 列出字段     |
| `bitable_field_create`   | `appToken`, `tableId`, `fieldName`, `fieldType` | 创建字段     |
| `bitable_records`        | `appToken`, `tableId`, `pageSize?`              | 查询记录     |
| `bitable_record_get`     | `appToken`, `tableId`, `recordId`               | 获取单条记录 |
| `bitable_record_create`  | `appToken`, `tableId`, `fields`                 | 创建记录     |
| `bitable_record_update`  | `appToken`, `tableId`, `recordId`, `fields`     | 更新记录     |
| `bitable_record_delete`  | `appToken`, `tableId`, `recordId`               | 删除记录     |
| `bitable_records_delete` | `appToken`, `tableId`, `recordIds`              | 批量删除记录 |

### 电子表格 / Sheets

| Action                | Params                                                        | Description    |
| --------------------- | ------------------------------------------------------------- | -------------- |
| `sheet_create`        | `title`, `folderId?`                                          | 创建电子表格   |
| `sheet_get`           | `spreadsheetToken`                                            | 获取表格信息   |
| `sheet_list`          | `spreadsheetToken`                                            | 列出工作表     |
| `sheet_info`          | `spreadsheetToken`, `sheetId`                                 | 获取工作表信息 |
| `sheet_read`          | `spreadsheetToken`, `range`                                   | 读取单元格     |
| `sheet_write`         | `spreadsheetToken`, `range`, `values`                         | 写入单元格     |
| `sheet_append`        | `spreadsheetToken`, `range`, `values`                         | 追加行数据     |
| `sheet_insert_rows`   | `spreadsheetToken`, `sheetId`, `startIndex`, `count`          | 插入行         |
| `sheet_delete_rows`   | `spreadsheetToken`, `sheetId`, `startIndex`, `count`          | 删除行         |
| `sheet_insert_cols`   | `spreadsheetToken`, `sheetId`, `startIndex`, `count`          | 插入列         |
| `sheet_delete_cols`   | `spreadsheetToken`, `sheetId`, `startIndex`, `count`          | 删除列         |
| `sheet_style`         | `spreadsheetToken`, `range`, `style`                          | 设置样式       |
| `sheet_merge`         | `spreadsheetToken`, `range`, `mergeType?`                     | 合并单元格     |
| `sheet_unmerge`       | `spreadsheetToken`, `range`                                   | 拆分单元格     |
| `sheet_sort`          | `spreadsheetToken`, `sheetId`, `range`, `sortSpecs`           | 排序           |
| `sheet_freeze`        | `spreadsheetToken`, `sheetId`, `frozenRows`, `frozenColumns`  | 冻结行列       |
| `sheet_find_replace`  | `spreadsheetToken`, `sheetId`, `find`, `replace`              | 查找替换       |
| `sheet_filter_create` | `spreadsheetToken`, `sheetId`, `range`                        | 创建筛选       |
| `sheet_filter_delete` | `spreadsheetToken`, `sheetId`                                 | 删除筛选       |
| `sheet_col_width`     | `spreadsheetToken`, `sheetId`, `startCol`, `endCol`, `width`  | 设置列宽       |
| `sheet_row_height`    | `spreadsheetToken`, `sheetId`, `startRow`, `endRow`, `height` | 设置行高       |
| `sheet_add`           | `spreadsheetToken`, `title`, `index?`                         | 添加工作表     |
| `sheet_delete`        | `spreadsheetToken`, `sheetId`                                 | 删除工作表     |
| `sheet_copy`          | `spreadsheetToken`, `sourceSheetId`, `targetTitle?`           | 复制工作表     |

### 日历 / Calendar

| Action             | Params                                                                       | Description  |
| ------------------ | ---------------------------------------------------------------------------- | ------------ |
| `cal_list`         | -                                                                            | 列出日历     |
| `cal_primary`      | -                                                                            | 获取主日历   |
| `cal_create`       | `summary`, `description?`                                                    | 创建日历     |
| `cal_events`       | `calendarId`, `startTime?`, `endTime?`                                       | 列出日程     |
| `cal_event_get`    | `calendarId`, `eventId`                                                      | 获取日程详情 |
| `cal_event_create` | `calendarId`, `summary`, `startTime`, `endTime`, `description?`, `location?` | 创建日程     |
| `cal_event_update` | `calendarId`, `eventId`, `summary?`, `startTime?`, `endTime?`                | 更新日程     |
| `cal_event_delete` | `calendarId`, `eventId`                                                      | 删除日程     |
| `cal_event_search` | `calendarId`, `query`                                                        | 搜索日程     |
| `cal_attendees`    | `calendarId`, `eventId`                                                      | 获取参与者   |
| `cal_attendee_add` | `calendarId`, `eventId`, `userIds`                                           | 添加参与者   |
| `cal_freebusy`     | `userIds`, `startTime`, `endTime`                                            | 查询忙闲状态 |

**支持自然语言时间：** `今天 14:30`、`明天 10:00`、`下周一 9:00`

### 任务 / Tasks

| Action                 | Params                                       | Description      |
| ---------------------- | -------------------------------------------- | ---------------- |
| `task_create`          | `summary`, `due?`, `description?`            | 创建任务         |
| `task_get`             | `taskId`                                     | 获取任务详情     |
| `task_update`          | `taskId`, `summary?`, `due?`, `description?` | 更新任务         |
| `task_delete`          | `taskId`                                     | 删除任务         |
| `task_complete`        | `taskId`                                     | 完成任务         |
| `task_uncomplete`      | `taskId`                                     | 取消完成         |
| `task_list`            | `tasklistId?`, `completed?`                  | 列出任务         |
| `tasklist_create`      | `name`                                       | 创建任务列表     |
| `tasklist_get`         | `tasklistId`                                 | 获取任务列表详情 |
| `tasklist_list`        | -                                            | 列出所有任务列表 |
| `tasklist_delete`      | `tasklistId`                                 | 删除任务列表     |
| `tasklist_add_task`    | `tasklistId`, `taskId`                       | 添加任务到列表   |
| `tasklist_remove_task` | `tasklistId`, `taskId`                       | 从列表移除任务   |
| `task_reminder_add`    | `taskId`, `minutes`                          | 添加任务提醒     |

**支持自然语言截止时间：** `明天`、`3天后`、`下周五`

### 云空间 / Drive

| Action          | Params                    | Description    |
| --------------- | ------------------------- | -------------- |
| `folder_create` | `name`, `parentToken?`    | 创建文件夹     |
| `folder_list`   | `folderToken`             | 列出文件夹内容 |
| `file_upload`   | `filePath`, `folderToken` | 上传文件       |
| `file_download` | `fileToken`, `savePath`   | 下载文件       |
| `file_search`   | `query`                   | 搜索文件       |

### 知识库 / Wiki

| Action               | Params                                                         | Description  |
| -------------------- | -------------------------------------------------------------- | ------------ |
| `wiki_spaces`        | -                                                              | 列出知识空间 |
| `wiki_space_get`     | `spaceId`                                                      | 获取知识空间 |
| `wiki_space_create`  | `name`, `description?`, `visibility?`                          | 创建知识空间 |
| `wiki_nodes`         | `spaceId`, `parentNodeToken?`                                  | 列出节点     |
| `wiki_node_get`      | `nodeToken`                                                    | 获取节点详情 |
| `wiki_node_create`   | `spaceId`, `objType`, `parentNodeToken?`, `title?`             | 创建节点     |
| `wiki_node_rename`   | `spaceId`, `nodeToken`, `title`                                | 重命名节点   |
| `wiki_node_move`     | `spaceId`, `nodeToken`, `targetParentToken?`, `targetSpaceId?` | 移动节点     |
| `wiki_node_copy`     | `spaceId`, `nodeToken`, `targetParentToken?`, `title?`         | 复制节点     |
| `wiki_members`       | `spaceId`                                                      | 列出成员     |
| `wiki_member_add`    | `spaceId`, `memberId`, `memberType`, `memberRole?`             | 添加成员     |
| `wiki_member_remove` | `spaceId`, `memberId`, `memberType`                            | 移除成员     |

**节点类型 (objType):** `docx`, `doc`, `sheet`, `bitable`, `mindnote`, `slides`

### 搜索 / Search

| Action            | Params                                       | Description    |
| ----------------- | -------------------------------------------- | -------------- |
| `search_messages` | `query`, `chatId?`, `startTime?`, `endTime?` | 搜索消息       |
| `search_docs`     | `query`, `docTypes?`                         | 搜索云文档     |
| `search_files`    | `query`, `folderToken?`                      | 搜索云空间文件 |
| `search_all`      | `query`, `types?`                            | 综合搜索       |

**搜索类型 (types):** `message`, `doc`, `app`

### AI 能力 / AI Capabilities

| Action               | Params                              | Description    |
| -------------------- | ----------------------------------- | -------------- |
| `ai_ocr`             | `image`                             | 图片文字识别   |
| `ai_speech_to_text`  | `audio`, `format?`                  | 语音转文字     |
| `ai_translate`       | `text`, `targetLang`, `sourceLang?` | 翻译文本       |
| `ai_detect_language` | `text`                              | 检测文本语言   |
| `ai_languages`       | -                                   | 获取支持的语言 |

**支持的语言:** `zh`, `zh-Hant`, `en`, `ja`, `ko`, `fr`, `de`, `es`, `it`, `pt`, `ru`, `ar`, `th`, `vi`, `id`

**音频格式:** `pcm`, `wav`, `ogg`, `speex`, `mp3`, `silk`

---

## 🏗️ Project Structure / 项目结构

```
openclaw-feishu/
├── index.ts              # Plugin entry / 插件入口
├── openclaw.plugin.json  # Plugin manifest (OpenClaw) / 插件配置
├── clawdbot.plugin.json  # Plugin manifest (Clawdbot) / 插件配置（兼容）
├── src/
│   ├── channel.ts        # Channel definition / 通道定义
│   ├── agent-tools.ts    # Feishu agent tool / 飞书 Agent 工具
│   ├── client.ts         # Messaging API / 消息 API
│   ├── document.ts       # Document API / 云文档 API
│   ├── bitable.ts        # Bitable API / 多维表格 API
│   ├── sheets.ts         # Sheets API / 电子表格 API
│   ├── calendar.ts       # Calendar API / 日历 API
│   ├── task.ts           # Task API / 任务 API
│   ├── wiki.ts           # Wiki API / 知识库 API
│   ├── search.ts         # Search API / 搜索 API
│   ├── ai.ts             # AI API / AI 能力 API
│   ├── space.ts          # Drive API / 云空间 API
│   ├── gateway.ts        # WebSocket gateway / 长连接网关
│   ├── markdown.ts       # Markdown converter / Markdown 转换
│   ├── compat.ts         # SDK compatibility / SDK 兼容层
│   ├── runtime.ts        # Runtime / 运行时
│   └── types.ts          # Type definitions / 类型定义
├── test/                 # Unit tests / 单元测试
│   ├── setup.ts          # Test setup / 测试配置
│   ├── client.test.ts
│   ├── document.test.ts
│   ├── bitable.test.ts
│   ├── sheets.test.ts
│   ├── calendar.test.ts
│   ├── task.test.ts
│   ├── wiki.test.ts
│   ├── search.test.ts
│   └── ai.test.ts
└── docs/
    └── SDK_CAPABILITIES.md  # SDK analysis / SDK 能力分析
```

---

## 🧪 Testing / 测试

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- test/calendar.test.ts
```

**Test Coverage:**

- 110+ test cases
- Client, Document, Bitable, Sheets, Calendar, Task modules

---

## 🔄 Compatibility / 兼容性

| Version  | CLI Command | Status       |
| -------- | ----------- | ------------ |
| OpenClaw | `openclaw`  | ✅ Latest    |
| Clawdbot | `clawdbot`  | ✅ Supported |
| Moltbot  | `moltbot`   | ✅ Supported |

---

## 🔧 Troubleshooting / 故障排查

### 🔄 Recovery Guide / 恢复指南

If OpenClaw/Clawdbot won't start after installing this plugin, follow these steps to recover:

如果安装本插件后 OpenClaw/Clawdbot 无法启动，请按以下步骤恢复：

#### Option 1: Restore from backup / 方案一：从备份恢复

```bash
# OpenClaw
cp ~/.openclaw/openclaw.json.bak ~/.openclaw/openclaw.json
openclaw gateway restart

# Clawdbot
cp ~/.clawdbot/clawdbot.json.bak ~/.clawdbot/clawdbot.json
clawdbot gateway restart
```

#### Option 2: Remove plugin entries manually / 方案二：手动移除插件配置

If you don't have a backup, edit the config file directly:

如果没有备份，直接编辑配置文件：

```bash
# OpenClaw
nano ~/.openclaw/openclaw.json

# Clawdbot
nano ~/.clawdbot/clawdbot.json
```

Remove or comment out the feishu-related sections:

删除或注释掉 feishu 相关的部分：

```json
{
  "plugins": {
    "entries": {
      // "feishu": { ... }  ← Remove this
    },
    "installs": {
      // "feishu": { ... }  ← Remove this
    }
  },
  "channels": {
    // "feishu": { ... }  ← Remove this
  }
}
```

Then restart:

然后重启：

```bash
# OpenClaw
openclaw gateway restart

# Clawdbot
clawdbot gateway restart
```

#### Option 3: Delete plugin files / 方案三：删除插件文件

```bash
# OpenClaw
rm -rf ~/.openclaw/extensions/feishu

# Clawdbot
rm -rf ~/.clawdbot/extensions/feishu
```

Then edit config to remove plugin references (see Option 2).

然后编辑配置文件移除插件引用（参见方案二）。

#### Option 4: Factory reset (last resort) / 方案四：恢复出厂（最后手段）

⚠️ **Warning:** This will reset ALL your settings!

⚠️ **警告：** 这将重置所有设置！

```bash
# OpenClaw - backup first, then reset
mv ~/.openclaw ~/.openclaw.broken
openclaw onboard

# Clawdbot - backup first, then reset
mv ~/.clawdbot ~/.clawdbot.broken
clawdbot onboard
```

---

### ❌ Gateway Won't Start After Install / 安装后无法启动

**Symptom:** After running `plugins install`, OpenClaw/Clawdbot fails to start with a config error.

**症状：** 运行 `plugins install` 后，OpenClaw/Clawdbot 无法启动，提示配置错误。

**Solution / 解决方案：**

1. **Check config file syntax / 检查配置文件语法：**

```bash
# OpenClaw
node -e "JSON.parse(require('fs').readFileSync('$HOME/.openclaw/openclaw.json'))"

# Clawdbot
node -e "JSON.parse(require('fs').readFileSync('$HOME/.clawdbot/clawdbot.json'))"
```

If you see a syntax error, the JSON is malformed.
如果看到语法错误，说明 JSON 格式有问题。

2. **Manual fix / 手动修复：**

Open your config file (`~/.openclaw/openclaw.json` or `~/.clawdbot/clawdbot.json`) and ensure the `plugins` section looks like this:

打开配置文件，确保 `plugins` 部分格式如下：

```json
{
  "plugins": {
    "entries": {
      "feishu": {
        "enabled": true,
        "config": {
          "appId": "your_app_id",
          "appSecret": "your_app_secret"
        }
      }
    },
    "installs": {
      "feishu": {
        "source": "archive",
        "installPath": "/path/to/.openclaw/extensions/feishu",
        "version": "2.9.0"
      }
    }
  },
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "your_app_id",
      "appSecret": "your_app_secret"
    }
  }
}
```

3. **Validate after fix / 修复后验证：**

```bash
# OpenClaw
openclaw status

# Clawdbot
clawdbot status
```

---

### ❌ "No messages received" / 收不到消息

**Checklist / 检查清单：**

1. ✅ Added `im.message.receive_v1` event subscription?
2. ✅ Using "Long Connection" mode (not Webhook)?
3. ✅ Published a new version after adding permissions?
4. ✅ Bot is added to the chat (for group messages)?

1. ✅ 是否添加了 `im.message.receive_v1` 事件订阅？
2. ✅ 是否选择了「长连接」模式（不是 Webhook）？
3. ✅ 添加权限后是否发布了新版本？
4. ✅ 机器人是否被添加到群聊中（群消息的情况）？

---

### ❌ Permission Denied Errors / 权限错误

**Symptom:** API calls fail with 403 or "no permission".

**症状：** API 调用返回 403 或「无权限」错误。

**Solution / 解决方案：**

1. Check which permissions are needed for the API (see table above)
2. Add missing permissions in Feishu Open Platform
3. **Create a new version and publish it** (permissions don't take effect until published!)

1. 检查该 API 需要哪些权限（见上方权限表）
2. 在飞书开放平台添加缺少的权限
3. **创建新版本并发布**（权限修改后必须发布才能生效！）

---

### ❌ Long Connection Keeps Disconnecting / 长连接频繁断开

**Possible causes / 可能原因：**

1. Network instability / 网络不稳定
2. Server resources exhausted / 服务器资源不足
3. Multiple instances running / 多个实例同时运行

**Solution / 解决方案：**

```bash
# Check if multiple gateway processes are running
# 检查是否有多个 gateway 进程在运行
ps aux | grep -E "(openclaw|clawdbot)" | grep gateway

# Kill duplicates and restart
# 杀掉重复进程并重启
openclaw gateway stop && openclaw gateway start
# or
clawdbot gateway stop && clawdbot gateway start
```

---

### 💡 Debug Mode / 调试模式

Enable debug logging to see detailed API calls:

启用调试日志查看详细 API 调用：

```bash
# OpenClaw
openclaw gateway start --log-level debug

# Clawdbot
clawdbot gateway start --log-level debug
```

---

### 📞 Still Stuck? / 仍然有问题？

- Open an issue: https://github.com/gcmsg/openclaw-feishu/issues
- Community: https://discord.com/invite/clawd

---

## 📄 License

MIT

---

## 🤝 Contributing / 贡献

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

Issues and PRs are welcome!
