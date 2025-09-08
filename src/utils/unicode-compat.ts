/**
 * Unicode字符兼容性工具
 * 为不支持特定Unicode字符的终端提供ASCII回退
 */

/**
 * 检测终端是否支持Unicode字符
 */
function detectUnicodeSupport(): boolean {
    // 检查环境变量
    const lang = process.env.LANG ?? process.env.LC_ALL ?? '';
    const term = process.env.TERM ?? '';

    // 如果明确设置了UTF-8编码
    if (lang.includes('UTF-8') || lang.includes('utf8')) {
        return true;
    }

    // 现代终端通常支持Unicode
    const modernTerms = ['xterm-256color', 'screen-256color', 'tmux-256color'];
    if (modernTerms.some(t => term.includes(t))) {
        return true;
    }

    // Windows Terminal、VSCode Terminal等
    if (process.env.WT_SESSION || process.env.VSCODE_PID) {
        return true;
    }

    // 默认情况下假设支持（现代系统大多支持）
    // 但在WSL等环境中可能需要回退
    const isWSL = process.env.WSL_DISTRO_NAME ?? process.env.WSLENV;
    if (isWSL) {
        // WSL环境中，依赖Windows Terminal支持
        return process.env.WT_SESSION !== undefined;
    }

    return true;
}

/**
 * Unicode字符映射表
 */
const UNICODE_FALLBACKS: Record<string, string> = {
    // TUI选择器箭头
    '▶': '>',
    '◀': '<',
    '◆': '*',

    // Git分支符号
    '⎇': '*',

    // 状态符号
    '✓': '✓',  // 这个在ASCII中存在
    '✗': 'x',
    '⚠': '!',

    // Powerline分隔符 - 如果不支持Unicode，回退到简单字符
    '': '>',
    '': '<',
    '': '│',

    // 其他常用符号
    '🌐': '[WEB]',
    '📄': '[FILE]',
    '🔍': '[FIND]',
    '💡': '[TIP]',
    '⭐': '*',
    '🍪': '[COOKIE]'
};

/**
 * 缓存Unicode支持检测结果
 */
let unicodeSupported: boolean | null = null;

/**
 * 获取兼容的字符
 * @param unicodeChar Unicode字符
 * @param fallback 可选的自定义回退字符
 * @returns 兼容的字符
 */
export function getCompatibleChar(unicodeChar: string, fallback?: string): string {
    unicodeSupported ??= detectUnicodeSupport();

    if (unicodeSupported) {
        return unicodeChar;
    }

    // 使用自定义回退或默认回退
    return fallback ?? UNICODE_FALLBACKS[unicodeChar] ?? unicodeChar;
}

/**
 * 处理包含Unicode字符的字符串
 * @param text 包含Unicode字符的文本
 * @returns 兼容的文本
 */
export function makeCompatibleText(text: string): string {
    unicodeSupported ??= detectUnicodeSupport();

    if (unicodeSupported) {
        return text;
    }

    let result = text;
    for (const [unicode, fallback] of Object.entries(UNICODE_FALLBACKS)) {
        result = result.replaceAll(unicode, fallback);
    }

    return result;
}

/**
 * 强制重新检测Unicode支持（用于测试）
 */
export function resetUnicodeDetection(): void {
    unicodeSupported = null;
}

/**
 * 获取当前Unicode支持状态
 */
export function isUnicodeSupported(): boolean {
    unicodeSupported ??= detectUnicodeSupport();
    return unicodeSupported;
}