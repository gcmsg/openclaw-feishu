# 贡献指南

感谢你对 openclaw-feishu 的贡献兴趣！

## 开发环境

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
git clone https://github.com/gcmsg/openclaw-feishu.git
cd openclaw-feishu
npm install
```

## 开发流程

### 1. 代码规范

项目使用 ESLint 和 Prettier 保证代码质量和一致性。

```bash
# 检查代码规范
npm run lint

# 自动修复可修复的问题
npm run lint:fix

# 检查格式
npm run format:check

# 自动格式化
npm run format
```

### 2. 类型检查

```bash
npm run typecheck
```

### 3. 提交代码

提交前请确保：

1. 代码通过 lint 检查
2. 代码已格式化
3. 类型检查通过

```bash
npm run lint && npm run format:check && npm run typecheck
```

### Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat: 新功能`
- `fix: 修复 bug`
- `docs: 文档更新`
- `style: 代码格式（不影响功能）`
- `refactor: 重构`
- `test: 测试相关`
- `chore: 构建/工具相关`

示例：

```
feat: 支持接收图片和文件消息
fix: 修复文档追加时的编码问题
docs: 更新 README 安装说明
```

## 项目结构

```
openclaw-feishu/
├── index.ts           # 插件入口
├── clawdbot.plugin.json  # 插件配置
├── src/
│   ├── channel.ts     # 通道插件定义
│   ├── client.ts      # 消息 API
│   ├── document.ts    # 云文档 API
│   ├── space.ts       # 云空间 API
│   ├── gateway.ts     # 长连接网关
│   ├── runtime.ts     # 运行时
│   ├── types.ts       # 类型定义
│   └── compat.ts      # 兼容层
├── eslint.config.js   # ESLint 配置
├── .prettierrc        # Prettier 配置
└── tsconfig.json      # TypeScript 配置
```

## 添加新功能

1. 在 `src/types.ts` 添加必要的类型定义
2. 在对应模块（client/document/space）实现功能
3. 在 `src/channel.ts` 的 `feishuMessageActions` 中注册 action
4. 更新 README.md 文档

## 问题反馈

- 提交 Issue: [GitHub Issues](https://github.com/gcmsg/openclaw-feishu/issues)
- 加入讨论: [Clawdbot Discord](https://discord.com/invite/clawd)

## License

MIT
