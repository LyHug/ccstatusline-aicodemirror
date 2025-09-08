<div align="center">

# ccstatusline-aicodemirror

**🎨 Enhanced status line formatter for Claude Code CLI with comprehensive aicodemirror integration**

*Display model info, git branch, token usage, aicodemirror credits, and other metrics in your terminal*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/your-username/ccstatusline-aicodemirror/blob/main/LICENSE)

📖 **[中文文档](README_zh.md)** | **English**

</div>

---

## 🌟 Overview

**ccstatusline-aicodemirror** is a unified status line formatter that combines two powerful projects: the original **[ccstatusline](https://github.com/sirmalloc/ccstatusline)** by @sirmalloc and **[cc-aicodemirror-statusline-plus](https://github.com/Bozhu12/cc-aicodemirror-statusline-plus)** by @Bozhu12. This integration brings together ccstatusline's powerful customization features with comprehensive aicodemirror integration. Get real-time credit monitoring, automatic reset management, and seamless cookie handling alongside all the original status line features.

### ✨ Key Features

- **🎨 Fully Customizable Status Line** - All original ccstatusline functionality
- **⚡ Powerline Support** - Beautiful arrow separators and custom fonts  
- **🔗 Aicodemirror Integration** - Credit tracking, automatic reset, cookie management
- **🖥️ Interactive TUI** - Easy configuration with React/Ink interface
- **📐 Multi-line Support** - Configure multiple independent status lines
- **🌈 Advanced Theming** - 16-color, 256-color, and truecolor support
- **🚀 Smart Defaults** - Aicodemirror credits widget enabled by default with 200 credit auto-reset threshold

---

## 🚀 Quick Start

### No installation needed! Use directly with npx:

```bash
# Run the configuration TUI
npx ccstatusline-aicodemirror@latest

# Or with Bun (faster)
bunx ccstatusline-aicodemirror@latest
```

### Configure Your Status Line

The interactive TUI provides everything you need:
- ✅ Add/remove/reorder widgets including **Aicodemirror Credits**
- ✅ Customize colors and themes
- ✅ Configure aicodemirror integration
- ✅ Set up cookie management and automatic credit reset
- ✅ **Automatically install to Claude Code settings**

### Automatic Claude Code Integration

The TUI will automatically offer to install the status line to your Claude Code settings:
1. **Configure your status line** using the interactive interface
2. **Select "📦 Install to Claude Code"** from the main menu
3. **Choose your preferred method**: npx (recommended) or bunx
4. **Done!** The command is automatically added to `~/.claude/settings.json`

The following command will be added automatically:
```json
{
  "statusLine": {
    "type": "command", 
    "command": "npx -y ccstatusline-aicodemirror@latest"
  }
}
```

---

## 🔧 Aicodemirror Integration

### Smart Cookie Management
- **🌐 Browser Login** - Automatic browser-based authentication
- **📝 File Input** - Secure cookie input through text editor
- **✅ Validation** - Automatic cookie verification and testing
- **🧹 Local Storage** - Safe local cookie storage and cleanup

### Credit Management
- **📊 Real-time Display** - Show current credits and plan status
- **🔄 User-Controlled Auto Reset** - Toggle automatic credit reset on/off
- **⚙️ Threshold Control** - Set custom reset trigger points when enabled
- **🎯 Smart Detection** - Multi-source ANTHROPIC_BASE_URL detection
- **⏱️ Configurable Caching** - Custom cache duration for API calls

### Complete Setup in 3 Steps

**For all users**:
1. **Run**: `npx ccstatusline-aicodemirror@latest`
2. **Configure**: Add desired widgets and customize appearance
3. **Install**: Select "📦 Install to Claude Code" - automatically adds the command

**Additional setup for [Aicodemirror](https://www.aicodemirror.com/) users**:

⭐ **Good news**: Aicodemirror Credits widget is **enabled by default** in the first position with auto-reset at 200 credits!

1. **Configure Cookie**: Select "🔗 Aicodemirror Configuration" → "✋ Manual Cookie Setup"  
2. **Adjust Settings** (Optional): 
   - Toggle "🔄 Auto Reset Credits" on/off (enabled by default)
   - Customize threshold via "⚙️ Set Auto Reset Threshold" (default: 200 credits)
   - Set custom cache duration for API calls

---

## 📊 Available Widgets

### Original ccstatusline Widgets
- **Model Name** - Current Claude model
- **Git Branch** - Current git branch  
- **Git Changes** - Uncommitted changes
- **Session Clock** - Time since session start
- **Block Timer** - Progress through 5-hour blocks
- **Tokens** - Input/Output/Cached/Total token usage
- **Context** - Context length and percentage
- **Custom Text & Commands** - Your own content

### New Aicodemirror Widgets
- **🔗 Aicodemirror Credits** - Real-time credit and plan display with user-configurable auto-reset

---

## ⚙️ Advanced Configuration

### Terminal Width Options
- **Full width always** - Use complete terminal width
- **Full width minus 40** - Reserve space for auto-compact messages  
- **Dynamic width** - Adapt based on context usage

### Powerline Mode
- **Arrow Separators** - Beautiful Powerline-style transitions
- **Custom Fonts** - Automatic font installation support
- **Color Inheritance** - Seamless color flow between widgets

### Global Overrides
- **Consistent Padding** - Uniform spacing across widgets
- **Color Overrides** - Force consistent foreground/background
- **Bold Formatting** - Global bold text application

---

## 🛠️ Development

### Prerequisites
- [Bun](https://bun.sh) (v1.0+) or Node.js 14+
- Git

### Local Development
```bash
# Clone and setup
git clone https://github.com/your-username/ccstatusline-aicodemirror.git
cd ccstatusline-aicodemirror

# Install dependencies  
bun install

# Apply required patches (required for ink-gradient compatibility)
bun run patch

# Run in development mode
bun run start

# Build for npm distribution
bun run build

# Type check (lint may have some warnings but builds successfully)
bun run lint
```

---

## 🙏 Acknowledgments & Attribution

### Based on Original Work

This project builds upon the excellent foundations of two projects:

**[ccstatusline](https://github.com/sirmalloc/ccstatusline)** by **Matthew Breedlove** (@sirmalloc)
- Original TUI architecture and widget system
- Powerline support and theming engine
- Multi-line status line functionality
- Terminal width management
- All core status line features

**[cc-aicodemirror-statusline-plus](https://github.com/Bozhu12/cc-aicodemirror-statusline-plus)** by **Bozhu12**
- Aicodemirror API integration concepts
- Cookie management approaches
- Credit tracking methodology
- Automatic reset system foundation

### My Enhancements

- **Aicodemirror API Integration** - Complete credit management system
- **Smart Cookie Management** - Browser login and file-based input
- **Automatic Credit Reset** - Configurable threshold-based reset
- **Multi-source Configuration** - Enhanced ANTHROPIC_BASE_URL detection
- **Unified Configuration** - Integrated TUI for all features

### License Compliance

This project maintains full compliance with the original MIT license:
- ✅ Original copyright notices preserved
- ✅ Original author attribution maintained  
- ✅ Same MIT license terms apply
- ✅ All original functionality preserved

---

## 📄 License

[MIT](LICENSE) © Enhanced Integration

Original ccstatusline © Matthew Breedlove  
Original cc-aicodemirror-statusline-plus © Bozhu12

---

## 📢 Developer Note

**Personal Use Focus**: This project was developed primarily for personal convenience and use case optimization. While I welcome community usage and feedback, please note that I may not implement all feature requests or suggestions, as development priorities are guided by personal needs and available time.

I appreciate your understanding and encourage you to fork the project if you need specific customizations for your workflow.

---

## 🤝 Contributing

Contributions are welcome! This project follows the same principles as the original:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)  
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contributing Philosophy
- Maintain compatibility with original ccstatusline features
- Respect the original project's design principles
- Consider contributing improvements back to the original project when applicable
- Focus on enhancing the unified experience

---

## 🔗 Related Projects

- **[ccstatusline](https://github.com/sirmalloc/ccstatusline)** - The original status line formatter this project builds upon
- **[cc-aicodemirror-statusline-plus](https://github.com/Bozhu12/cc-aicodemirror-statusline-plus)** - Aicodemirror integration project that inspired our enhanced features
- **[Claude Code CLI](https://claude.ai/code)** - AI-powered coding assistant by Anthropic
- **[aicodemirror](https://www.aicodemirror.com/)** - Alternative Claude API provider

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/ccstatusline-aicodemirror/issues)
- **Documentation**: [GitHub Wiki](https://github.com/your-username/ccstatusline-aicodemirror/wiki)
- **Original Project**: [ccstatusline Issues](https://github.com/sirmalloc/ccstatusline/issues) for core functionality

---

## 🌟 Show Your Support

Give a ⭐ if this project helped you!

Built with ❤️ for the Claude Code community, standing on the shoulders of giants.

---

<div align="center">

### Made possible by the excellent work of [@sirmalloc](https://github.com/sirmalloc) and [@Bozhu12](https://github.com/Bozhu12) 🙏

</div>