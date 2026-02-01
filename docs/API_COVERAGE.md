# Feishu API Coverage

> 当前版本: 2.7.0 | 总计 Actions: 140+

## 模块概览

| 模块     | Actions | 状态    |
| -------- | ------- | ------- |
| 消息     | 7       | ✅      |
| 聊天管理 | 17      | ✅ 新增 |
| 云文档   | 11      | ✅      |
| 云空间   | 14      | ✅      |
| 多维表格 | 25      | ✅ 增强 |
| 电子表格 | 19      | ✅      |
| 日历     | 18      | ✅ 增强 |
| 任务     | 21      | ✅ 增强 |
| 知识库   | 14      | ✅      |
| 搜索     | 4       | ✅      |
| AI       | 5       | ✅      |
| 邮件     | 26      | ✅      |
| 通讯录   | 23      | ✅ 新增 |

## 详细 Actions 列表

### 消息 (7 个)

- `send` - 发送消息
- `send_card` - 发送卡片消息
- `send_image` - 发送图片
- `send_file` - 发送文件
- `msg_forward` - 转发消息
- `msg_merge_forward` - 合并转发多条消息
- `msg_urgent` - 发送加急消息
- `msg_read_users` - 获取消息已读用户

### 聊天管理 (17 个) ⭐ 新增

- `chat_create` - 创建群聊
- `chat_get` - 获取群聊信息
- `chat_update` - 更新群聊信息
- `chat_delete` - 解散群聊
- `chat_list` - 获取群聊列表
- `chat_search` - 搜索群聊
- `chat_members_add` - 添加群成员
- `chat_members_remove` - 移除群成员
- `chat_members_list` - 获取群成员列表
- `chat_members_check` - 判断用户是否在群中
- `chat_managers_add` - 添加群管理员
- `chat_managers_remove` - 移除群管理员
- `chat_tab_create` - 创建会话标签页
- `chat_tab_list` - 获取会话标签页列表
- `chat_tab_update` - 更新会话标签页
- `chat_tab_delete` - 删除会话标签页
- `chat_top_notice_put` - 置顶消息
- `chat_top_notice_delete` - 取消置顶消息
- `chat_announcement_get` - 获取群公告
- `chat_announcement_update` - 更新群公告

### 云文档 (11 个)

- `doc_create` - 创建云文档
- `doc_get` - 获取文档信息
- `doc_read` - 读取文档纯文本
- `doc_structure` - 获取文档结构
- `doc_append` - 追加文本到文档末尾
- `doc_append_md` - 追加 Markdown 到文档
- `doc_prepend` - 在文档开头插入内容
- `doc_insert_after` - 在指定块后插入内容
- `doc_block_get` - 获取指定块内容
- `doc_block_update` - 更新块内容
- `doc_block_delete` - 删除指定块
- `doc_blocks_delete` - 批量删除块

### 云空间 (14 个)

- `folder_create` - 创建文件夹
- `folder_list` - 列出文件夹内容
- `file_upload` - 上传文件
- `file_download` - 下载文件
- `file_search` - 搜索文件
- `file_meta` - 获取文件元数据
- `file_move` - 移动文件
- `file_copy` - 复制文件
- `file_delete` - 删除文件
- `file_shortcut` - 创建快捷方式
- `file_batch_download_urls` - 批量获取下载链接
- `file_transfer_owner` - 转移文件所有权

### 多维表格 (25 个) ⭐ 增强

基础:

- `bitable_create` - 创建多维表格
- `bitable_get` - 获取多维表格信息
- `bitable_tables` - 列出数据表
- `bitable_table_create` - 创建数据表
- `bitable_fields` - 列出字段
- `bitable_field_create` - 创建字段
- `bitable_records` - 查询记录
- `bitable_record_get` - 获取单条记录
- `bitable_record_create` - 创建记录
- `bitable_record_update` - 更新记录
- `bitable_record_delete` - 删除记录
- `bitable_records_delete` - 批量删除记录

视图 (新增):

- `bitable_views` - 列出视图
- `bitable_view_get` - 获取视图详情
- `bitable_view_create` - 创建视图
- `bitable_view_delete` - 删除视图

角色 (新增):

- `bitable_roles` - 列出角色
- `bitable_role_create` - 创建角色
- `bitable_role_update` - 更新角色
- `bitable_role_delete` - 删除角色
- `bitable_role_members` - 列出角色成员
- `bitable_role_member_add` - 添加角色成员
- `bitable_role_member_remove` - 移除角色成员

自动化 (新增):

- `bitable_workflows` - 列出自动化规则
- `bitable_workflow_toggle` - 启用/禁用自动化规则

### 电子表格 (19 个)

- `sheet_create` - 创建电子表格
- `sheet_get` - 获取电子表格信息
- `sheet_list` - 列出工作表
- `sheet_info` - 获取工作表信息
- `sheet_read` - 读取单元格
- `sheet_write` - 写入单元格
- `sheet_append` - 追加行数据
- `sheet_insert_rows` - 插入行
- `sheet_delete_rows` - 删除行
- `sheet_insert_cols` - 插入列
- `sheet_delete_cols` - 删除列
- `sheet_style` - 设置单元格样式
- `sheet_merge` - 合并单元格
- `sheet_unmerge` - 拆分单元格
- `sheet_sort` - 排序
- `sheet_freeze` - 冻结行列
- `sheet_find_replace` - 查找替换
- `sheet_filter_create` - 创建筛选
- `sheet_filter_delete` - 删除筛选
- `sheet_col_width` - 设置列宽
- `sheet_row_height` - 设置行高
- `sheet_add` - 添加工作表
- `sheet_delete` - 删除工作表
- `sheet_copy` - 复制工作表

### 日历 (18 个) ⭐ 增强

基础:

- `cal_list` - 列出日历
- `cal_primary` - 获取主日历
- `cal_create` - 创建日历
- `cal_events` - 列出日程
- `cal_event_get` - 获取日程详情
- `cal_event_create` - 创建日程
- `cal_event_update` - 更新日程
- `cal_event_delete` - 删除日程
- `cal_event_search` - 搜索日程
- `cal_attendees` - 获取日程参与者
- `cal_attendee_add` - 添加参与者
- `cal_freebusy` - 查询忙闲状态

订阅 (新增):

- `cal_subscribe` - 订阅日历
- `cal_unsubscribe` - 取消订阅日历

权限 (新增):

- `cal_acls` - 获取日历访问控制列表
- `cal_acl_add` - 添加日历访问控制
- `cal_acl_remove` - 删除日历访问控制

### 任务 (21 个) ⭐ 增强

基础:

- `task_create` - 创建任务
- `task_get` - 获取任务详情
- `task_update` - 更新任务
- `task_delete` - 删除任务
- `task_complete` - 完成任务
- `task_uncomplete` - 取消完成任务
- `task_list` - 列出任务

任务列表:

- `tasklist_create` - 创建任务列表
- `tasklist_get` - 获取任务列表详情
- `tasklist_list` - 列出所有任务列表
- `tasklist_delete` - 删除任务列表
- `tasklist_add_task` - 将任务添加到列表
- `tasklist_remove_task` - 从列表移除任务
- `task_reminder_add` - 添加任务提醒

成员 (新增):

- `task_members_add` - 添加任务成员
- `task_members_remove` - 移除任务成员
- `tasklist_members_add` - 添加任务列表成员
- `tasklist_members_remove` - 移除任务列表成员

依赖 (新增):

- `task_dependencies_add` - 添加任务依赖
- `task_dependencies_remove` - 移除任务依赖

附件 (新增):

- `task_attachments` - 获取任务附件列表
- `task_attachment_get` - 获取任务附件详情
- `task_attachment_delete` - 删除任务附件

### 知识库 (14 个)

- `wiki_spaces` - 列出知识空间
- `wiki_space_get` - 获取知识空间详情
- `wiki_space_create` - 创建知识空间
- `wiki_nodes` - 列出节点
- `wiki_node_get` - 获取节点详情
- `wiki_node_create` - 创建节点
- `wiki_node_rename` - 重命名节点
- `wiki_node_move` - 移动节点
- `wiki_node_copy` - 复制节点
- `wiki_members` - 列出成员
- `wiki_member_add` - 添加成员
- `wiki_member_remove` - 移除成员

### 搜索 (4 个)

- `search_messages` - 搜索消息
- `search_docs` - 搜索云文档
- `search_files` - 搜索云空间文件
- `search_all` - 综合搜索

### AI (5 个)

- `ai_ocr` - 图片文字识别
- `ai_speech_to_text` - 语音转文字
- `ai_translate` - 翻译文本
- `ai_detect_language` - 检测文本语言
- `ai_languages` - 获取支持的语言列表

### 邮件 (26 个) ⭐ 新增

邮件消息:

- `mail_send` - 发送邮件
- `mail_get` - 获取邮件详情
- `mail_list` - 获取邮件列表
- `mail_attachment_url` - 获取邮件附件下载链接

文件夹:

- `mail_folders` - 获取邮件文件夹列表
- `mail_folder_create` - 创建邮件文件夹
- `mail_folder_delete` - 删除邮件文件夹

邮件组:

- `mailgroup_create` - 创建邮件组
- `mailgroup_get` - 获取邮件组信息
- `mailgroup_list` - 获取邮件组列表
- `mailgroup_update` - 更新邮件组
- `mailgroup_delete` - 删除邮件组
- `mailgroup_members` - 获取邮件组成员
- `mailgroup_member_add` - 添加邮件组成员
- `mailgroup_member_remove` - 移除邮件组成员

公共邮箱:

- `public_mailbox_create` - 创建公共邮箱
- `public_mailbox_get` - 获取公共邮箱信息
- `public_mailbox_list` - 获取公共邮箱列表
- `public_mailbox_update` - 更新公共邮箱
- `public_mailbox_delete` - 删除公共邮箱
- `public_mailbox_members` - 获取公共邮箱成员
- `public_mailbox_member_add` - 添加公共邮箱成员
- `public_mailbox_member_remove` - 移除公共邮箱成员
- `public_mailbox_members_clear` - 清空公共邮箱成员

### 通讯录 (23 个) ⭐ 新增

用户:

- `contact_user_get` - 获取用户信息
- `contact_user_list` - 获取用户列表
- `contact_user_batch` - 批量获取用户信息
- `contact_user_batch_id` - 批量获取用户ID (通过邮箱/手机号)
- `contact_user_by_department` - 获取部门下用户

部门:

- `contact_department_get` - 获取部门信息
- `contact_department_list` - 获取部门列表
- `contact_department_children` - 获取子部门列表
- `contact_department_parent` - 获取父部门列表
- `contact_department_search` - 搜索部门
- `contact_department_batch` - 批量获取部门信息

用户组:

- `contact_group_get` - 获取用户组信息
- `contact_group_list` - 获取用户组列表
- `contact_group_create` - 创建用户组
- `contact_group_update` - 更新用户组
- `contact_group_delete` - 删除用户组
- `contact_user_groups` - 查询用户所属用户组

用户组成员:

- `contact_group_members` - 获取用户组成员
- `contact_group_member_add` - 添加用户组成员
- `contact_group_member_remove` - 移除用户组成员
- `contact_group_members_batch_add` - 批量添加用户组成员
- `contact_group_members_batch_remove` - 批量移除用户组成员

## 更新日志

### v2.7.0

- 新增通讯录模块 (contact.ts): 用户、部门、用户组完整管理
- 新增 23 个 Actions

### v2.6.0

- 新增邮件模块 (mail.ts): 发送/读取邮件、文件夹、邮件组、公共邮箱
- 新增 26 个 Actions

### v2.5.0

- 新增聊天管理模块 (chat.ts): 群聊 CRUD、成员、管理员、Tab、置顶、公告
- 多维表格增强: 视图管理、角色管理、自动化管理
- 日历增强: 订阅、ACL 权限
- 任务增强: 成员、依赖、附件管理

### v2.4.0

- 新增 AI 能力: OCR、语音转文字、翻译
- 新增综合搜索

### v2.3.0

- 完整电子表格支持
- 知识库管理
