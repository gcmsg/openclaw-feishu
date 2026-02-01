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
| **Messaging** | Text, Rich Text, Cards, Images, Files, Voice transcription, Quote reply             |
| **Documents** | Create, Read, Update, Delete blocks, Insert at position, Markdown support           |
| **Bitable**   | Create apps/tables, Field management, Record CRUD, Batch operations                 |
| **Sheets**    | Create/read/write cells, Row/column operations, Styles, Merge, Sort, Filter, Freeze |
| **Calendar**  | Create events, List/search events, Attendees, Free/busy query                       |
| **Tasks**     | Create/complete tasks, Task lists, Reminders                                        |
| **Wiki**      | Spaces, Nodes (pages), Members management, Move/copy nodes                          |
| **Search**    | Messages, Documents, Drive files, Universal search                                  |
| **AI**        | OCR (image text recognition), Speech-to-Text, Translation, Language detection       |

### 📦 Quick Install

```bash
# OpenClaw (latest)
openclaw plugins install https://github.com/gcmsg/openclaw-feishu

# Clawdbot
clawdbot plugins install https://github.com/gcmsg/openclaw-feishu
```

### ⚙️ Configuration

1. Create app at [Feishu Open Platform](https://open.feishu.cn/app)
2. Get **App ID** and **App Secret**
3. Enable "Bot" capability with "Long Connection" mode
4. Add required permissions (see below)
5. Run `openclaw onboard feishu` or `clawdbot onboard feishu`

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

### 📦 快速安装

```bash
# OpenClaw（最新版）
openclaw plugins install https://github.com/gcmsg/openclaw-feishu

# Clawdbot
clawdbot plugins install https://github.com/gcmsg/openclaw-feishu
```

### ⚙️ 配置步骤

1. 在 [飞书开放平台](https://open.feishu.cn/app) 创建应用
2. 获取 **App ID** 和 **App Secret**
3. 开启「机器人」能力，消息接收方式选择「使用长连接接收消息」
4. 添加所需权限（见下表）
5. 运行 `openclaw onboard feishu` 或 `clawdbot onboard feishu`

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
├── clawdbot.plugin.json  # Plugin manifest / 插件配置
├── src/
│   ├── channel.ts        # Channel definition / 通道定义
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

## 📄 License

MIT

---

## 🤝 Contributing / 贡献

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

Issues and PRs are welcome!
