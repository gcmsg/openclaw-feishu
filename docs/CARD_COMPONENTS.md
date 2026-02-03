# 飞书卡片组件参考

## 卡片 JSON 结构

```json
{
  "config": {
    "wide_screen_mode": true,
    "enable_forward": true
  },
  "header": {
    "title": { "tag": "plain_text", "content": "标题" },
    "template": "blue"
  },
  "elements": [...]
}
```

## 组件列表

### 内容组件

#### div - 文本块

```json
{
  "tag": "div",
  "text": {
    "tag": "lark_md",
    "content": "**加粗** 和 *斜体*"
  }
}
```

带 fields 的多列文本：

```json
{
  "tag": "div",
  "fields": [
    { "is_short": true, "text": { "tag": "lark_md", "content": "**字段1**\n值1" } },
    { "is_short": true, "text": { "tag": "lark_md", "content": "**字段2**\n值2" } }
  ]
}
```

#### hr - 分割线

```json
{ "tag": "hr" }
```

#### img - 图片

```json
{
  "tag": "img",
  "img_key": "img_xxx",
  "alt": { "tag": "plain_text", "content": "图片描述" }
}
```

#### note - 备注

```json
{
  "tag": "note",
  "elements": [{ "tag": "plain_text", "content": "备注文本" }]
}
```

### 布局组件

#### column_set - 多列布局（用于表格）

```json
{
  "tag": "column_set",
  "flex_mode": "none",
  "background_style": "grey",
  "columns": [
    {
      "tag": "column",
      "width": "weighted",
      "weight": 1,
      "elements": [{ "tag": "div", "text": { "tag": "lark_md", "content": "**列1**" } }]
    },
    {
      "tag": "column",
      "width": "weighted",
      "weight": 1,
      "elements": [{ "tag": "div", "text": { "tag": "lark_md", "content": "**列2**" } }]
    }
  ]
}
```

### 交互组件

#### action - 按钮组

```json
{
  "tag": "action",
  "layout": "bisected",
  "actions": [
    {
      "tag": "button",
      "text": { "tag": "plain_text", "content": "按钮1" },
      "type": "primary",
      "value": { "key": "value" }
    }
  ]
}
```

## 文本标签类型

| tag          | 说明          |
| ------------ | ------------- |
| `lark_md`    | 飞书 Markdown |
| `plain_text` | 纯文本        |

## header.template 颜色

- `blue` - 蓝色
- `turquoise` - 青色
- `green` - 绿色
- `yellow` - 黄色
- `orange` - 橙色
- `red` - 红色
- `carmine` - 洋红
- `violet` - 紫罗兰
- `purple` - 紫色
- `indigo` - 靛蓝
- `grey` - 灰色
- `default` - 默认

## lark_md 支持的格式

| 格式    | 语法                        | 示例                        |
| ------- | --------------------------- | --------------------------- |
| 加粗    | `**text**`                  | **加粗**                    |
| 斜体    | `*text*`                    | _斜体_                      |
| 删除线  | `~~text~~`                  | ~~删除~~                    |
| 链接    | `[text](url)`               | [链接](https://example.com) |
| @用户   | `<at id="ou_xxx">name</at>` | @用户                       |
| @所有人 | `<at id="all">所有人</at>`  | @所有人                     |
| 换行    | `\n`                        | -                           |
| 图片    | `![alt](img_key)`           | 仅支持 img_key              |

## ❌ 不支持的格式

- 标准 Markdown 表格语法 (`| col | col |`)
- 代码块 (` ```code``` `)
- 标题 (`# ## ###`)

## 表格实现方式

使用 `column_set` 布局模拟表格：

```json
{
  "elements": [
    {
      "tag": "column_set",
      "flex_mode": "none",
      "background_style": "grey",
      "columns": [
        {
          "tag": "column",
          "width": "weighted",
          "weight": 1,
          "elements": [{ "tag": "div", "text": { "tag": "lark_md", "content": "**表头1**" } }]
        },
        {
          "tag": "column",
          "width": "weighted",
          "weight": 1,
          "elements": [{ "tag": "div", "text": { "tag": "lark_md", "content": "**表头2**" } }]
        }
      ]
    },
    {
      "tag": "column_set",
      "flex_mode": "none",
      "columns": [
        {
          "tag": "column",
          "width": "weighted",
          "weight": 1,
          "elements": [{ "tag": "div", "text": { "tag": "lark_md", "content": "数据1" } }]
        },
        {
          "tag": "column",
          "width": "weighted",
          "weight": 1,
          "elements": [{ "tag": "div", "text": { "tag": "lark_md", "content": "数据2" } }]
        }
      ]
    }
  ]
}
```

## 参考链接

- [消息卡片搭建工具](https://open.feishu.cn/tool/cardbuilder)
- [卡片结构介绍](https://open.feishu.cn/document/ukTMukTMukTM/uEjNwUjLxYDM14SM2ATN)
- [发送消息 API](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create)
