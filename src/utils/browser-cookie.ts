import { spawn } from 'child_process';
import {
    existsSync,
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
        openBrowser('https://www.aicodemirror.com/dashboard');

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

function openBrowser(url: string): void {
    const isWindows = process.platform === 'win32';

    if (isWindows) {
        // Windows: 优先尝试Chrome路径
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
                    });
                    console.log(`✓ Chrome started: ${chromePath}`);
                    return;
                } catch (error) {
                    console.log(`✗ Failed to start Chrome: ${String(error)}`);
                    continue;
                }
            }
        }

        console.log('Chrome not found, using default browser');
        // 如果Chrome不可用，使用默认浏览器
        spawn('cmd', ['/c', 'start', url], { detached: true, stdio: 'ignore' });
    } else {
        // macOS/Linux
        const command = process.platform === 'darwin' ? 'open' : 'xdg-open';
        spawn(command, [url], { detached: true, stdio: 'ignore' });
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