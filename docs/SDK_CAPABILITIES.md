# 飞书 SDK 能力分析

> 基于 @larksuiteoapi/node-sdk v1.58.0 分析
> 用于指导 openclaw-feishu 插件的开发方向

## 📊 能力概览

| 类别 | 模块 | 当前状态 | 优先级 | 说明 |
|------|------|---------|--------|------|
| **消息** | im | ✅ 已实现 | - | 核心功能 |
| **文档** | docx | ✅ 已实现 | - | 创建/读取/追加 |
| **云空间** | drive | ✅ 已实现 | - | 文件夹/上传/下载 |
| **日历** | calendar | ⬜ 待开发 | ⭐⭐⭐ | 日程管理 |
| **多维表格** | bitable | ⬜ 待开发 | ⭐⭐⭐ | 类似 Airtable |
| **电子表格** | sheets | ⬜ 待开发 | ⭐⭐ | Excel 类操作 |
| **任务** | task | ⬜ 待开发 | ⭐⭐⭐ | 待办任务 |
| **审批** | approval | ⬜ 待开发 | ⭐⭐ | 审批流程 |
| **知识库** | wiki | ⬜ 待开发 | ⭐⭐ | 知识库管理 |
| **邮箱** | mail | ⬜ 待开发 | ⭐ | 企业邮箱 |
| **视频会议** | vc | ⬜ 待开发 | ⭐ | 会议管理 |
| **通讯录** | contact | ⬜ 待开发 | ⭐ | 组织架构 |
| **考勤** | attendance | ⬜ 待开发 | ⭐ | 打卡记录 |
| **搜索** | search | ⬜ 待开发 | ⭐⭐ | 全局搜索 |
| **AI 能力** | speech_to_text | ⬜ 待开发 | ⭐⭐ | 语音转文字 |
| **AI 能力** | translation | ⬜ 待开发 | ⭐ | 翻译 |
| **AI 能力** | optical_char_recognition | ⬜ 待开发 | ⭐ | OCR |
| **AI 能力** | document_ai | ⬜ 待开发 | ⭐ | 文档 AI |

---

## 🎯 推荐开发优先级

### P0 - 高优先级（实用性强）

#### 1. 日历 (calendar)
```
calendar.event.create    - 创建日程
calendar.event.list      - 查看日程
calendar.event.delete    - 删除日程
calendar.freebusy.list   - 查看忙闲状态
```
**场景**：
- "帮我创建明天下午 3 点的会议"
- "看看我这周有什么安排"
- "帮我约一下小明的时间"

#### 2. 多维表格 (bitable)
```
bitable.app.create       - 创建多维表格
bitable.table.create     - 创建数据表
bitable.record.create    - 添加记录
bitable.record.search    - 搜索记录
bitable.record.update    - 更新记录
```
**场景**：
- "帮我创建一个项目跟踪表"
- "在表格里添加一条任务记录"
- "查一下表格里的数据"

#### 3. 任务 (task)
```
task.task.create         - 创建任务
task.task.list           - 查看任务列表
task.task.patch          - 更新任务状态
task.tasklist.create     - 创建任务列表
```
**场景**：
- "帮我创建一个待办任务"
- "看看我有哪些未完成的任务"
- "把这个任务标记为完成"

### P1 - 中优先级

#### 4. 电子表格 (sheets)
```
sheets.spreadsheet.create     - 创建表格
sheets.spreadsheet.get        - 读取表格
spreadsheet.values.update     - 更新单元格
```

#### 5. 知识库 (wiki)
```
wiki.space.list          - 知识库列表
wiki.node.create         - 创建页面
wiki.node.get            - 读取页面
```

#### 6. 审批 (approval)
```
approval.instance.create     - 发起审批
approval.instance.list       - 查看审批
approval.instance.cancel     - 撤销审批
```

#### 7. 搜索 (search)
```
search.message.create    - 搜索消息
search.app.create        - 搜索应用数据
```

### P2 - 低优先级

#### 8. AI 能力
```
speech_to_text           - 语音转文字（独立 API）
translation              - 翻译
optical_char_recognition - OCR 文字识别
document_ai              - 文档智能分析
```

#### 9. 其他
```
mail                     - 邮箱操作
vc                       - 视频会议
contact                  - 通讯录
attendance               - 考勤
hire                     - 招聘
okr                      - OKR 管理
```

---

## 📝 详细模块说明

### im (即时通讯) ✅ 已实现

| 子模块 | 功能 | 状态 |
|--------|------|------|
| message.create | 发送消息 | ✅ |
| message.reply | 回复消息 | ✅ |
| message.delete | 撤回消息 | ✅ |
| image.create/get | 上传/下载图片 | ✅ |
| file.create/get | 上传/下载文件 | ✅ |
| chat.create | 创建群聊 | ⬜ |
| chat.update | 修改群设置 | ⬜ |
| chat.members | 群成员管理 | ⬜ |
| pin | 置顶消息 | ⬜ |
| thread | 话题回复 | ⬜ |

### docx (文档) ✅ 已实现

| 子模块 | 功能 | 状态 |
|--------|------|------|
| document.create | 创建文档 | ✅ |
| document.get | 获取文档信息 | ✅ |
| document.rawContent | 读取文档内容 | ✅ |
| documentBlock.create | 追加内容块 | ✅ |
| documentBlock.list | 获取内容块 | ⬜ |
| documentBlock.update | 更新内容块 | ⬜ |
| documentBlock.delete | 删除内容块 | ⬜ |

### drive (云空间) ✅ 已实现

| 子模块 | 功能 | 状态 |
|--------|------|------|
| file.list | 列出文件 | ✅ |
| file.upload | 上传文件 | ✅ |
| file.download | 下载文件 | ✅ |
| file.copy/move | 复制/移动 | ⬜ |
| file.delete | 删除文件 | ⬜ |
| folder.create | 创建文件夹 | ✅ |
| permission | 权限管理 | ⬜ |

### calendar (日历) ⬜ 待开发

| 子模块 | 功能 | 优先级 |
|--------|------|--------|
| calendar.list | 日历列表 | ⭐⭐ |
| event.create | 创建日程 | ⭐⭐⭐ |
| event.list | 日程列表 | ⭐⭐⭐ |
| event.get | 日程详情 | ⭐⭐ |
| event.patch | 更新日程 | ⭐⭐ |
| event.delete | 删除日程 | ⭐⭐ |
| freebusy.list | 忙闲查询 | ⭐ |
| attendee | 参与者管理 | ⭐ |

### bitable (多维表格) ⬜ 待开发

| 子模块 | 功能 | 优先级 |
|--------|------|--------|
| app.create | 创建多维表格 | ⭐⭐ |
| table.create | 创建数据表 | ⭐⭐ |
| field.create | 创建字段 | ⭐⭐ |
| record.create | 添加记录 | ⭐⭐⭐ |
| record.search | 搜索记录 | ⭐⭐⭐ |
| record.update | 更新记录 | ⭐⭐⭐ |
| record.delete | 删除记录 | ⭐⭐ |
| view.list | 视图列表 | ⭐ |

### task (任务) ⬜ 待开发

| 子模块 | 功能 | 优先级 |
|--------|------|--------|
| task.create | 创建任务 | ⭐⭐⭐ |
| task.get | 任务详情 | ⭐⭐ |
| task.patch | 更新任务 | ⭐⭐⭐ |
| task.delete | 删除任务 | ⭐⭐ |
| tasklist.create | 创建清单 | ⭐⭐ |
| tasklist.tasks | 清单任务列表 | ⭐⭐ |

---

## 🔧 开发建议

### 1. 模块化设计
每个功能域（calendar/bitable/task）独立一个文件：
```
src/
├── channel.ts      # 通道定义
├── client.ts       # 消息 API
├── document.ts     # 文档 API ✅
├── space.ts        # 云空间 API ✅
├── calendar.ts     # 日历 API (新增)
├── bitable.ts      # 多维表格 API (新增)
├── task.ts         # 任务 API (新增)
└── ...
```

### 2. Message Actions 扩展
为每个模块添加对应的 actions：
```typescript
// 日历
{ action: "cal_create", params: ["title", "startTime", "endTime"] }
{ action: "cal_list", params: ["days?"] }

// 多维表格
{ action: "bitable_query", params: ["appToken", "tableId", "filter?"] }
{ action: "bitable_add", params: ["appToken", "tableId", "fields"] }

// 任务
{ action: "task_create", params: ["summary", "due?"] }
{ action: "task_list", params: ["status?"] }
```

### 3. 权限矩阵
| 功能 | 所需权限 |
|------|---------|
| 日历 | `calendar:calendar`, `calendar:calendar.readonly` |
| 多维表格 | `bitable:app`, `bitable:app.readonly` |
| 任务 | `task:task`, `task:task.readonly` |
| 电子表格 | `sheets:spreadsheet` |
| 知识库 | `wiki:wiki` |

---

## 📅 建议开发路线图

### Phase 1 (v2.2)
- [ ] 日历：创建/查看日程
- [ ] 任务：创建/查看/完成任务

### Phase 2 (v2.3)
- [ ] 多维表格：基础 CRUD
- [ ] 电子表格：读写单元格

### Phase 3 (v2.4)
- [ ] 知识库：浏览/创建页面
- [ ] 搜索：全局搜索消息/文件

### Phase 4 (v2.5)
- [ ] AI 能力：OCR、翻译
- [ ] 审批：发起/查看审批

---

*最后更新: 2026-02-01*
