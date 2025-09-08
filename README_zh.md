<div align="center">

# ccstatusline-aicodemirror

**🎨 增强版 Claude Code CLI 状态栏格式化工具，集成完整的 aicodemirror 支持**

_在终端中显示模型信息、git 分支、令牌使用量、aicodemirror 积分和其他指标_

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/your-username/ccstatusline-aicodemirror/blob/main/LICENSE)

📖 **中文文档** | **[English](README.md)**

</div>

---

## 🌟 项目概述

**ccstatusline-aicodemirror** 是一个统一的状态栏格式化工具，它结合了两个强大的项目：@sirmalloc 的原版 **[ccstatusline](https://github.com/sirmalloc/ccstatusline)** 和 @Bozhu12 的 **[cc-aicodemirror-statusline-plus](https://github.com/Bozhu12/cc-aicodemirror-statusline-plus)**。这个集成将 ccstatusline 的强大自定义功能与全面的 aicodemirror 集成相结合。实现实时积分监控、自动重置管理和无缝 Cookie 处理，同时保留所有原有的状态栏功能。

### ✨ 主要特性

- **🎨 完全可定制状态栏** - 包含原版 ccstatusline 的所有功能
- **⚡ Powerline 支持** - 美观的箭头分隔符和自定义字体
- **🔗 Aicodemirror 集成** - 积分跟踪、自动重置、Cookie 管理
- **🖥️ 交互式 TUI** - 使用 React/Ink 技术的简易配置界面
- **📐 多行支持** - 配置多个独立的状态栏
- **🌈 高级主题** - 16 色、256 色和真彩色支持
- **🚀 智能默认** - Aicodemirror 积分小部件默认启用，200 积分自动重置阈值

---

## 🚀 快速开始

### 无需安装！直接使用 npx：

```bash
# 运行配置TUI界面
npx ccstatusline-aicodemirror@latest

# 或使用Bun（更快）
bunx ccstatusline-aicodemirror@latest
```

### 配置您的状态栏

交互式 TUI 提供您需要的一切：

- ✅ 添加/删除/重排序小部件，包括 **Aicodemirror 积分**
- ✅ 自定义颜色和主题
- ✅ 配置 aicodemirror 集成
- ✅ 设置 Cookie 管理和自动积分重置
- ✅ **自动安装到 Claude Code 设置**

### 自动 Claude Code 集成

TUI 会自动提供将状态栏安装到 Claude Code 设置的选项：

1. **使用交互界面配置**您的状态栏
2. **从主菜单选择"📦 Install to Claude Code"**
3. **选择您偏好的方法**：npx（推荐）或 bunx
4. **完成！** 命令自动添加到 `~/.claude/settings.json`

将自动添加以下命令：

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y ccstatusline-aicodemirror@latest"
  }
}
```

---

## 🔧 Aicodemirror 集成

### 智能 Cookie 管理

- **🌐 浏览器登录** - 自动基于浏览器的认证
- **📝 文件输入** - 通过文本编辑器安全输入 Cookie
- **✅ 验证** - 自动 Cookie 验证和测试
- **🧹 本地存储** - 安全的本地 Cookie 存储和清理

### 积分管理

- **📊 实时显示** - 显示当前积分和计划状态
- **🔄 用户控制的自动重置** - 可切换自动积分重置开关
- **⚙️ 阈值控制** - 启用时设置自定义重置触发点
- **🎯 智能检测** - 多源 ANTHROPIC_BASE_URL 检测
- **⏱️ 可配置缓存** - 自定义 API 调用的缓存时长

### 3 步完整设置

**所有用户**：

1. **运行**：`npx ccstatusline-aicodemirror@latest`
2. **配置**：添加所需小部件并自定义外观
3. **安装**：选择"📦 Install to Claude Code" - 自动添加命令

**[Aicodemirror](https://www.aicodemirror.com/) 用户的额外设置**：

⭐ **好消息**: Aicodemirror 积分小部件**默认已启用**并放置在第一位，自动重置阈值为 200 积分！

1. **配置 Cookie**：选择"🔗 Aicodemirror Configuration" → "✋ Manual Cookie Setup"
2. **调整设置**（可选）：
   - 切换"🔄 自动重置积分"开关（默认开启）
   - 通过"⚙️ 设置自动重置阈值"自定义阈值（默认: 200 积分）
   - 设置 API 调用的自定义缓存时长

---

## 📊 可用小部件

### 原版 ccstatusline 小部件

- **模型名称** - 当前 Claude 模型
- **Git 分支** - 当前 git 分支
- **Git 更改** - 未提交的更改
- **会话时钟** - 会话开始以来的时间
- **区块计时器** - 5 小时区块的进度
- **令牌** - 输入/输出/缓存/总令牌使用量
- **上下文** - 上下文长度和百分比
- **自定义文本和命令** - 您自己的内容

### 新增 Aicodemirror 小部件

- **🔗 Aicodemirror 积分** - 实时积分和计划显示，支持用户可配置的自动重置

---

## ⚙️ 高级配置

### 终端宽度选项

- **总是全宽度** - 使用完整的终端宽度
- **全宽度减 40** - 为自动压缩消息保留空间
- **动态宽度** - 根据上下文使用情况自适应

### Powerline 模式

- **箭头分隔符** - 美观的 Powerline 风格过渡
- **自定义字体** - 自动字体安装支持
- **颜色继承** - 小部件间无缝的颜色流动

### 全局覆盖

- **一致的填充** - 小部件间统一的间距
- **颜色覆盖** - 强制一致的前景/背景
- **粗体格式** - 全局粗体文本应用

---

## 🛠️ 开发

### 前置要求

- [Bun](https://bun.sh) (v1.0+) 或 Node.js 14+
- Git

### 本地开发

```bash
# 克隆和设置
git clone https://github.com/your-username/ccstatusline-aicodemirror.git
cd ccstatusline-aicodemirror

# 安装依赖
bun install

# 应用必需的补丁（ink-gradient兼容性需要）
bun run patch

# 开发模式运行
bun run start

# 构建npm分发版本
bun run build

# 类型检查（lint可能有些警告但构建成功）
bun run lint
```

---

## 🙏 致谢与归属

### 基于原创作品

本项目建立在两个优秀项目的基础之上：

**[ccstatusline](https://github.com/sirmalloc/ccstatusline)** 作者：**Matthew Breedlove** (@sirmalloc)

- 原始 TUI 架构和小部件系统
- Powerline 支持和主题引擎
- 多行状态栏功能
- 终端宽度管理
- 所有核心状态栏特性

**[cc-aicodemirror-statusline-plus](https://github.com/Bozhu12/cc-aicodemirror-statusline-plus)** 作者：**Bozhu12**

- Aicodemirror API 集成概念
- Cookie 管理方法
- 积分跟踪方法论
- 自动重置系统基础

### 我的增强功能

- **Aicodemirror API 集成** - 完整的积分管理系统
- **智能 Cookie 管理** - 浏览器登录和基于文件的输入
- **自动积分重置** - 可配置的基于阈值的重置
- **多源配置** - 增强的 ANTHROPIC_BASE_URL 检测
- **统一配置** - 所有功能的集成 TUI

### 许可证合规

本项目完全符合原始 MIT 许可证：

- ✅ 保留原始版权声明
- ✅ 维持原作者归属
- ✅ 应用相同的 MIT 许可证条款
- ✅ 保留所有原始功能

---

## 📄 许可证

[MIT](LICENSE) © Enhanced Integration

原版 ccstatusline © Matthew Breedlove  
原版 cc-aicodemirror-statusline-plus © Bozhu12

---

## 📢 开发者声明

**个人使用导向**: 本项目主要是为了方便个人使用而开发的，开发重点围绕个人需求和使用场景进行优化。虽然我欢迎社区使用和反馈，但请注意我可能不会实现所有功能请求或建议，因为开发优先级主要由个人需要和可用时间决定。

**请大家不要在项目中许愿**，因为不一定会去做。如果您需要特定的定制功能，我鼓励您 fork 本项目进行个人定制。

感谢您的理解！

---

## 🤝 贡献

欢迎贡献！本项目遵循与原版相同的原则：

1. Fork 仓库
2. 创建您的功能分支（`git checkout -b feature/amazing-feature`）
3. 提交您的更改（`git commit -m 'Add amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 打开 Pull Request

### 贡献理念

- 保持与原版 ccstatusline 功能的兼容性
- 尊重原项目的设计原则
- 在适用时考虑将改进贡献回原项目
- 专注于增强统一的用户体验

---

## 🔗 相关项目

- **[ccstatusline](https://github.com/sirmalloc/ccstatusline)** - 本项目所基于的原始状态栏格式化工具
- **[cc-aicodemirror-statusline-plus](https://github.com/Bozhu12/cc-aicodemirror-statusline-plus)** - 启发我们增强功能的 Aicodemirror 集成项目
- **[Claude Code CLI](https://claude.ai/code)** - Anthropic 的 AI 驱动编程助手
- **[aicodemirror](https://www.aicodemirror.com/)** - 替代 Claude API 提供商

---

## 💬 支持

- **问题反馈**：[GitHub Issues](https://github.com/your-username/ccstatusline-aicodemirror/issues)
- **文档**：[GitHub Wiki](https://github.com/your-username/ccstatusline-aicodemirror/wiki)
- **原项目**：[ccstatusline Issues](https://github.com/sirmalloc/ccstatusline/issues) 用于核心功能问题

---

## 🌟 支持我们

如果这个项目对您有帮助，请给个 ⭐！

用 ❤️ 为 Claude Code 社区构建，站在巨人的肩膀上。

---

<div align="center">

### 感谢[@sirmalloc](https://github.com/sirmalloc)和[@Bozhu12](https://github.com/Bozhu12)的出色工作 🙏

</div>
