# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 环境说明

- **操作系统**: Windows 环境
- **语言偏好**: 请使用中文进行交流和回答

## Repository Overview

This repository contains **ccstatusline-aicodemirror** - a comprehensive, highly customizable status line formatter for Claude Code with integrated aicodemirror support.

**项目整合**: 本项目整合了原 ccstatusline 和 cc-aicodemirror-statusline-plus 两个项目的功能，提供统一的状态栏解决方案。

## ccstatusline-aicodemirror

一个具有交互式 TUI 配置界面的全功能状态栏格式化工具，集成了 aicodemirror 积分显示和管理功能。

### Development Commands

```bash
# Install dependencies (prefer Bun)
bun install

# Run TUI configuration interface
bun run start
# or
bun run statusline

# Test with example payload
bun run example

# Test with piped input
echo '{"model":{"display_name":"Claude 3.5 Sonnet"},"transcript_path":"test.jsonl"}' | bun run src/ccstatusline.ts

# Build for distribution (production - excludes dev options)
bun run build

# Build for development (includes dev options)
bun run build:dev

# Type check and lint
bun run lint

# Manual credit refresh
bun run credit-refresh

# Threshold management
bun run set-threshold
bun run show-threshold
```

## Architecture

**Dual Runtime System**: Works with both Bun and Node.js
- **Piped mode**: Processes Claude Code JSON input and outputs formatted status line
- **Interactive mode**: Launches React/Ink TUI for configuration when no input is piped

### Core Structure
- **src/ccstatusline.ts**: Main entry point with mode detection
- **src/tui/**: React/Ink-based configuration interface
  - App.tsx, MainMenu.tsx, ItemsEditor.tsx, ColorMenu.tsx, etc.
  - **components/AicodemirrorConfigMenu.tsx**: aicodemirror 配置界面
- **src/utils/**: Core utilities
  - config.ts (settings management), renderer.ts (status line rendering)
  - powerline.ts (Powerline font support), claude-settings.ts (integration)
  - **aicodemirror.ts**: aicodemirror API 集成和 ANTHROPIC_BASE_URL 多源检测
  - **browser-cookie.ts**: 智能浏览器登录和 Cookie 管理
- **src/widgets/**: Modular widget system
  - Model, GitBranch, TokensTotal, BlockTimer, SessionClock, etc.
  - **AicodemirrorCredits**: aicodemirror 积分和计划显示

### Key Features
- **Widget System**: Modular components for different data types
- **Powerline Support**: Arrow separators and custom font integration  
- **Multi-line Support**: Configure multiple independent status lines
- **Advanced Theming**: 16-color, 256-color, and truecolor support
- **Flex Separators**: Dynamic spacing that expands to fill available width
- **Custom Commands**: Execute shell commands and display output
- **Terminal Width Management**: Smart truncation with multiple width handling modes
- **Aicodemirror Integration**: 完整的积分显示、Cookie 管理和智能浏览器登录

## ANTHROPIC_BASE_URL Detection

增强的多源检测系统，按优先级顺序：

1. **项目级配置** (最高优先级): `[项目根目录]/.claude/settings.json`
2. **用户级配置**: `~/.claude/settings.json`  
3. **环境变量** (最低优先级): `process.env.ANTHROPIC_BASE_URL`

支持的配置格式：
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.aicodemirror.com/v1"
  }
}
```
或
```json
{
  "ANTHROPIC_BASE_URL": "https://api.aicodemirror.com/v1"
}
```

## Aicodemirror Configuration

### 智能浏览器登录
- 自动打开系统 Chrome 浏览器到 aicodemirror dashboard
- 使用调试端口连接，获取 Cookie 后自动验证和保存
- 支持交互式确认，避免超时问题

### Cookie 管理
- **文件输入**: 通过外部编辑器输入 Cookie，避免终端 85 字符限制
- **智能验证**: 输入前检查现有 Cookie 有效性
- **本地清除**: 安全清除本地保存的 Cookie 数据

### 智能菜单显示
Aicodemirror Configuration 菜单只有在启用 "Aicodemirror Credits" 小部件时才会显示，避免不必要的菜单干扰。

核心功能：
- 🌐 智能浏览器登录
- 📝 从文件获取Cookie  
- 🔄 自动重置积分开关 (用户可选择开启/关闭)
- ⚙️ 设置自动重置阈值 (仅在开启自动重置时显示)
- ⏱️ 设置缓存刷新时间
- 🧹 清除本地Cookie

### 默认配置说明

**新用户默认配置**:
- **积分部件**: 默认启用并放置在第一行第一位，颜色为蓝色
- **自动重置**: 默认开启，默认阈值为 200 积分
- **其他部件**: 模型名称、上下文长度、Git分支、Git变更等按序排列

**用户控制机制**:
- **自动重置开关**: 通过 TUI 菜单可随时开启/关闭自动重置
- **条件显示**: 只有开启自动重置时，阈值设置选项才会显示在菜单中
- **智能提示**: 开启自动重置但无阈值时，系统会提示设置阈值

**使用流程**:
1. 进入 Aicodemirror Configuration 菜单 (仅在启用积分部件时显示)
2. 选择 "🔄 自动重置积分: 开启/关闭" 切换开关状态  
3. 如果开启，菜单会显示 "⚙️ 设置自动重置阈值" 选项 (默认: 200)
4. 系统将在积分低于设定阈值时自动触发重置

**配置存储**: 设置保存在 `~/.config/ccstatusline-aicodemirror/aicodemirror-config.json`

## Development Preferences
- **Runtime**: Prefer Bun over Node.js for all commands
- **Linting**: Only use `bun run lint` - never run ESLint directly
- **Building**: Target Node.js 14+ compatibility for distribution
- **Production vs Development Build**: 
  - `bun run build` - 生产构建，排除开发测试安装选项
  - `bun run build:dev` - 开发构建，包含完整功能用于本地测试

## Integration with Claude Code

### Status Line Configuration
添加到 `~/.claude/settings.json`:
```json
{
  "statusLine": {
    "type": "command", 
    "command": "npx -y ccstatusline-aicodemirror@latest"
  }
}
```

TUI 提供两种主要安装选项：
- **npx**: 使用 npm 安装最新发布版本 (推荐)
- **bunx**: 使用 bun 安装最新发布版本 (需要 bun 运行时)

### Environment Variables
- **ANTHROPIC_BASE_URL**: API 基础 URL (支持多源检测)
- **ANTHROPIC_MODEL**: 当前模型信息
- **CLAUDE_OUTPUT_STYLE**: 输出样式设置

## 使用步骤

1. **安装和配置**：
   ```bash
   # 运行 TUI 配置界面
   npx ccstatusline-aicodemirror@latest
   
   # 在 TUI 中添加所需 widgets，包括 "Aicodemirror Credits"
   ```

2. **配置 Cookie** (仅 aicodemirror 用户)：
   - 在 TUI 的 Aicodemirror Configuration 中选择智能浏览器登录
   - 或通过文件输入方式安全输入 Cookie

3. **设置环境变量** (仅 aicodemirror 用户)：
   ```bash
   export ANTHROPIC_BASE_URL=https://api.aicodemirror.com/v1
   ```

## Common Development Tasks

```bash
# Start development
bun install
bun run start

# Test specific widget
echo '{"model":{"display_name":"Test Model"}}' | bun run src/ccstatusline.ts

# Test with example payload
bun run example

# Build and validate
bun run lint
bun run build

# Test aicodemirror integration
bun run credit-refresh
```

## Project Integration History

### 整合的功能
- **原 ccstatusline 项目**: 基础状态栏功能、TUI界面、Widget系统
- **原 cc-aicodemirror-statusline-plus 项目**: aicodemirror 集成功能

### 保留和增强的功能
- 智能浏览器登录
- Cookie 文件输入和验证
- 积分显示和缓存
- 多源 ANTHROPIC_BASE_URL 检测
- TUI 配置界面
- 自动积分重置系统

## Scripts and Utilities

### Build Scripts
- **scripts/replace-version.ts**: 版本替换脚本，构建后自动执行
- **scripts/payload.example.json**: 测试用例载荷文件，用于 `bun run example`

### Standalone Scripts
- **src/scripts/save-cookie.ts**: Cookie 保存工具
- **src/scripts/credit-refresh.ts**: 积分刷新工具

### 配置文件
- **eslint.config.js**: ESLint 配置，支持 TypeScript 和 React
- **vitest.config.ts**: Vitest 测试框架配置

## 重要提醒

- **类型检查和代码检查**: 仅通过 `bun run lint` 命令运行，绝不直接使用 `npx eslint` 或其他变体
- **构建目标**: 分发时目标为 Node.js 14+ 以获得最大兼容性
- **依赖关系**: 所有运行时依赖使用 `--packages=external` 打包用于 npm 发布
- **平台兼容**: 支持 Windows 和 Unix 系统，在 Windows 上使用 `dir` 命令而非 `ls`