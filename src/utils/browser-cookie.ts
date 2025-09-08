import type { ChildProcess } from 'child_process';
import { spawn } from 'child_process';
import {
    existsSync,
    readFileSync,
    unlinkSync,
    writeFileSync
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import {
    getCredits,
    loadAicodemirrorConfig,
    saveAicodemirrorConfig
} from './aicodemirror';

const TEMP_SCRIPT_PATH = join(tmpdir(), 'ccstatusline-cookie-extractor.js');

// JavaScript code to run in browser console
const BROWSER_SCRIPT = `
(function() {
    console.log('🔍 开始检测登录状态...');
    
    // 获取当前Cookie
    const currentCookie = document.cookie;
    
    // 检查是否包含认证Cookie
    const hasAuthCookie = currentCookie.includes('__Secure-authjs.session-token');
    
    if (!hasAuthCookie) {
        console.log('❌ 未检测到登录状态');
        console.log('请手动登录后重新运行此功能');
        return;
    }
    
    console.log('✅ 检测到登录状态');
    console.log('🍪 Cookie长度:', currentCookie.length);
    
    // 创建临时文件传递Cookie
    const cookieData = {
        cookie: currentCookie,
        timestamp: Date.now(),
        url: window.location.href
    };
    
    // 使用 fetch 发送Cookie到本地服务器
    // 注意：这需要配合本地服务器实现
    console.log('Cookie数据已准备完毕');
    console.log('请按任意键继续...');
})();
`;

export interface BrowserLoginResult {
    success: boolean;
    message: string;
    wasAlreadyLoggedIn?: boolean;
}

/**
 * 智能浏览器登录 - 打开Chrome浏览器让用户手动登录，并提供获取Cookie的指导
 */
export async function launchBrowserLogin(): Promise<BrowserLoginResult> {
    try {
        // 检查现有登录状态
        const config = loadAicodemirrorConfig();
        if (config.cookies) {
            const existingCredits = await getCredits(config.cookies);
            if (existingCredits) {
                return {
                    success: true,
                    message: `已有有效登录，积分: ${existingCredits.credits} (${existingCredits.plan})`,
                    wasAlreadyLoggedIn: true
                };
            }
        }

        // 创建临时脚本文件
        writeFileSync(TEMP_SCRIPT_PATH, BROWSER_SCRIPT);

        // 打开浏览器
        await openBrowser('https://www.aicodemirror.com/dashboard');

        // 返回手动模式说明
        return {
            success: true,
            message: `✅ 已打开Chrome浏览器到 aicodemirror

📋 获取Cookie步骤：
1. 浏览器会自动跳转：
   - 如已登录 → 直接显示仪表板
   - 未登录 → 自动跳转到登录页面，请完成登录

2. 登录成功后，打开开发者工具 (F12)

3. 切换到 Network 标签页

4. 刷新页面 (Ctrl+R 或 F5)

5. 在请求列表中找到：
   - Name: dashboard
   - Type: document
   
6. 点击该请求，在右侧面板中：
   - 点击 "Headers" 标签
   - 找到 "Request Headers" 部分
   - 复制 "Cookie:" 后面的完整内容

7. 返回此界面，选择 "🍪 手动输入Cookie"

💡 这种方法获取的Cookie最准确完整！`
        };
    } catch (error) {
        return {
            success: false,
            message: `浏览器启动失败: ${String(error)}`
        };
    }
}

function openBrowser(url: string): Promise<boolean> {
    return new Promise((resolve) => {
        const isWindows = process.platform === 'win32';
        const isMacOS = process.platform === 'darwin';
        const isWSL = detectWSL();

        console.log(`🌐 正在尝试打开浏览器: ${url}`);

        if (isWindows) {
            handleWindowsBrowser(url, resolve);
        } else if (isMacOS) {
            handleMacOSBrowser(url, resolve);
        } else {
            // Linux/Unix systems
            handleLinuxBrowser(url, isWSL, resolve);
        }
    });
}

/**
 * 检测是否运行在 WSL 环境中
 */
function detectWSL(): boolean {
    try {
        // 方法1: 检查 /proc/version 文件
        if (existsSync('/proc/version')) {
            const version = readFileSync('/proc/version', 'utf8');
            if (version.toLowerCase().includes('microsoft') || version.toLowerCase().includes('wsl')) {
                return true;
            }
        }

        // 方法2: 检查环境变量
        return process.env.WSL_DISTRO_NAME !== undefined
            || process.env.WSLENV !== undefined;
    } catch {
        return false;
    }
}

/**
 * Windows 浏览器处理
 */
function handleWindowsBrowser(url: string, resolve: (success: boolean) => void): void {
    const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];

    // 尝试直接启动Chrome
    for (const chromePath of chromePaths) {
        if (existsSync(chromePath)) {
            try {
                spawn(chromePath, [url, '--remote-debugging-port=9222'], {
                    detached: true,
                    stdio: 'ignore'
                }).on('error', () => {
                    // 继续尝试下一个路径
                }).on('spawn', () => {
                    console.log(`✓ Chrome started: ${chromePath}`);
                    resolve(true);
                    return;
                });
                return; // 等待spawn事件
            } catch {
                continue;
            }
        }
    }

    // 回退到默认浏览器
    try {
        spawn('cmd', ['/c', 'start', url], { detached: true, stdio: 'ignore' })
            .on('error', () => {
                console.log('✗ 无法打开浏览器');
                resolve(false);
            })
            .on('spawn', () => {
                console.log('✓ 使用默认浏览器打开');
                resolve(true);
            });
    } catch {
        resolve(false);
    }
}

/**
 * macOS 浏览器处理
 */
function handleMacOSBrowser(url: string, resolve: (success: boolean) => void): void {
    try {
        spawn('open', [url], { detached: true, stdio: 'ignore' })
            .on('error', () => {
                console.log('✗ 无法打开浏览器');
                resolve(false);
            })
            .on('spawn', () => {
                console.log('✓ 浏览器已打开');
                resolve(true);
            });
    } catch {
        resolve(false);
    }
}

/**
 * Linux/Unix 浏览器处理
 */
function handleLinuxBrowser(url: string, isWSL: boolean, resolve: (success: boolean) => void): void {
    const commands = [];

    if (isWSL) {
        // WSL 环境：优先尝试调用 Windows 的浏览器
        commands.push(
            // 使用完整路径的 cmd.exe
            () => spawn('/mnt/c/Windows/System32/cmd.exe', ['/c', 'start', url], { detached: true, stdio: 'ignore' }),
            // 使用 wslview (如果可用) - WSL 的标准浏览器打开工具
            () => spawn('wslview', [url], { detached: true, stdio: 'ignore' }),
            // 使用 explorer.exe 打开 URL
            () => spawn('/mnt/c/Windows/explorer.exe', [url], { detached: true, stdio: 'ignore' }),
            // 回退到相对路径的命令
            () => spawn('cmd.exe', ['/c', 'start', url], { detached: true, stdio: 'ignore' }),
            () => spawn('powershell.exe', ['-Command', `Start-Process "${url}"`], { detached: true, stdio: 'ignore' })
        );
    }

    // 标准 Linux 桌面环境命令
    commands.push(
        () => spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }),
        () => spawn('sensible-browser', [url], { detached: true, stdio: 'ignore' }),
        () => spawn('x-www-browser', [url], { detached: true, stdio: 'ignore' }),
        () => spawn('firefox', [url], { detached: true, stdio: 'ignore' }),
        () => spawn('chromium', [url], { detached: true, stdio: 'ignore' }),
        () => spawn('chromium-browser', [url], { detached: true, stdio: 'ignore' }),
        () => spawn('google-chrome', [url], { detached: true, stdio: 'ignore' })
    );

    tryCommands(commands, 0, resolve);
}

/**
 * 依次尝试命令列表
 */
function tryCommands(commands: (() => ChildProcess)[], index: number, resolve: (success: boolean) => void): void {
    if (index >= commands.length) {
        console.log('✗ 所有浏览器启动方法都失败了');
        console.log('💡 请手动访问: https://www.aicodemirror.com/dashboard');
        console.log('   然后复制Cookie字符串并选择 "📝 从文件获取Cookie" 选项');
        resolve(false);
        return;
    }

    try {
        const command = commands[index];
        if (!command) {
            tryCommands(commands, index + 1, resolve);
            return;
        }

        const child = command();
        let resolved = false;

        child.on('error', () => {
            if (!resolved) {
                resolved = true;
                // 尝试下一个命令
                tryCommands(commands, index + 1, resolve);
            }
        });

        child.on('spawn', () => {
            if (!resolved) {
                resolved = true;
                console.log('✓ 浏览器已打开');
                resolve(true);
            }
        });

        // 设置超时，避免hanging
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                tryCommands(commands, index + 1, resolve);
            }
        }, 2000);
    } catch {
        tryCommands(commands, index + 1, resolve);
    }
}

/**
 * 验证并保存Cookie
 */
export async function validateAndSaveCookie(cookie: string): Promise<BrowserLoginResult> {
    if (!cookie || cookie.trim().length === 0) {
        return {
            success: false,
            message: '❌ Cookie不能为空'
        };
    }

    try {
        // 清理Cookie字符串（移除可能的换行符和多余空格）
        const cleanCookie = cookie.replace(/\r?\n/g, '').trim();

        console.log('Cookie validation:', {
            length: cleanCookie.length,
            preview: cleanCookie.substring(0, 100) + '...'
        });

        // 先尝试使用清理后的Cookie测试API
        let testCookie = cleanCookie;
        let credits = await getCredits(testCookie);

        // 如果清理后的Cookie无效，尝试原始Cookie
        if (!credits && testCookie !== cookie) {
            console.log('Cleaned cookie failed, trying original...');
            testCookie = cookie;
            credits = await getCredits(testCookie);
        }

        if (!credits) {
            return {
                success: false,
                message: `❌ Cookie无效或已过期，请重新登录获取\n\n🔍 调试信息:\n长度: ${testCookie.length} 字符\n预览: ${testCookie.substring(0, 100)}...\n\n💡 请确保复制的是完整的Cookie字符串`
            };
        }

        // 保存有效的Cookie
        const config = loadAicodemirrorConfig();
        const newConfig = {
            ...config,
            cookies: testCookie,
            lastCreditRefresh: Date.now()
        };
        saveAicodemirrorConfig(newConfig);

        return {
            success: true,
            message: `✅ Cookie验证成功并已保存！积分: ${credits.credits} (${credits.plan})`
        };
    } catch (error) {
        return {
            success: false,
            message: `❌ 验证Cookie时出错: ${String(error)}`
        };
    }
}

/**
 * 跨平台文本编辑器打开
 */
export async function openTextEditor(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
        const isWindows = process.platform === 'win32';
        const isMacOS = process.platform === 'darwin';
        const isWSL = detectWSL();

        console.log(`📝 正在打开文本编辑器: ${filePath}`);

        if (isWindows) {
            handleWindowsEditor(filePath, resolve);
        } else if (isMacOS) {
            handleMacOSEditor(filePath, resolve);
        } else {
            // Linux/Unix systems
            handleLinuxEditor(filePath, isWSL, resolve);
        }
    });
}

/**
 * Windows 编辑器处理
 */
function handleWindowsEditor(filePath: string, resolve: (success: boolean) => void): void {
    const editors = [
        () => spawn('notepad', [filePath], { detached: true, stdio: 'ignore' }),
        () => spawn('code', [filePath], { detached: true, stdio: 'ignore' }), // VS Code
        () => spawn('notepad++', [filePath], { detached: true, stdio: 'ignore' })
    ];

    tryEditorCommands(editors, 0, resolve);
}

/**
 * macOS 编辑器处理
 */
function handleMacOSEditor(filePath: string, resolve: (success: boolean) => void): void {
    const editors = [
        () => spawn('open', ['-t', filePath], { detached: true, stdio: 'ignore' }), // TextEdit
        () => spawn('code', [filePath], { detached: true, stdio: 'ignore' }), // VS Code
        () => spawn('nano', [filePath], { detached: true, stdio: 'ignore' })
    ];

    tryEditorCommands(editors, 0, resolve);
}

/**
 * Linux 编辑器处理
 */
function handleLinuxEditor(filePath: string, isWSL: boolean, resolve: (success: boolean) => void): void {
    const editors = [];

    if (isWSL) {
        // WSL 环境：优先尝试 Windows 编辑器
        editors.push(
            () => spawn('/mnt/c/Windows/System32/notepad.exe', [filePath], { detached: true, stdio: 'ignore' }),
            () => spawn('code', [filePath], { detached: true, stdio: 'ignore' })
        );
    }

    // Linux 桌面环境编辑器
    editors.push(
        () => spawn('gedit', [filePath], { detached: true, stdio: 'ignore' }),
        () => spawn('kate', [filePath], { detached: true, stdio: 'ignore' }),
        () => spawn('mousepad', [filePath], { detached: true, stdio: 'ignore' }),
        () => spawn('leafpad', [filePath], { detached: true, stdio: 'ignore' }),
        () => spawn('pluma', [filePath], { detached: true, stdio: 'ignore' }),
        () => spawn('code', [filePath], { detached: true, stdio: 'ignore' }),
        () => spawn('subl', [filePath], { detached: true, stdio: 'ignore' }),
        // 终端编辑器作为最后的回退
        () => spawn('nano', [filePath], { stdio: 'inherit' }),
        () => spawn('vim', [filePath], { stdio: 'inherit' }),
        () => spawn('vi', [filePath], { stdio: 'inherit' })
    );

    tryEditorCommands(editors, 0, resolve);
}

/**
 * 依次尝试编辑器命令列表
 */
function tryEditorCommands(commands: (() => ChildProcess)[], index: number, resolve: (success: boolean) => void): void {
    if (index >= commands.length) {
        console.log('✗ 无法打开任何文本编辑器');
        console.log('💡 请手动编辑文件，然后按回车继续');
        resolve(false);
        return;
    }

    try {
        const command = commands[index];
        if (!command) {
            tryEditorCommands(commands, index + 1, resolve);
            return;
        }

        const child = command();
        let resolved = false;

        child.on('error', () => {
            if (!resolved) {
                resolved = true;
                // 尝试下一个编辑器
                tryEditorCommands(commands, index + 1, resolve);
            }
        });

        child.on('spawn', () => {
            if (!resolved) {
                resolved = true;
                console.log('✓ 文本编辑器已打开');
                resolve(true);
            }
        });

        // 设置超时，避免hanging
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                tryEditorCommands(commands, index + 1, resolve);
            }
        }, 3000);
    } catch {
        tryEditorCommands(commands, index + 1, resolve);
    }
}

/**
 * 清理临时文件和资源
 */
export function cleanup(): void {
    try {
        if (existsSync(TEMP_SCRIPT_PATH)) {
            unlinkSync(TEMP_SCRIPT_PATH);
        }
    } catch {
        // 忽略清理错误
    }
}