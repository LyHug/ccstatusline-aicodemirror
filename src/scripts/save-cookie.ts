#!/usr/bin/env bun
/**
 * Cookie保存工具
 * 集成到 ccstatusline 项目中
 */

// Removed unused imports

import {
    getCredits,
    loadAicodemirrorConfig,
    saveAicodemirrorConfig
} from '../utils/aicodemirror';

function saveCookie(): boolean {
    const args = process.argv.slice(2);

    if (args.length !== 1) {
        console.log('使用方法: bun run src/scripts/save-cookie.ts \'你的Cookie字符串\'');
        console.log();
        console.log('📝 步骤：');
        console.log('1. 浏览器登录 https://www.aicodemirror.com/dashboard');
        console.log('2. F12 -> Network -> 刷新页面 -> 找到 /api/user/credits');
        console.log('3. 复制Cookie值');
        console.log('4. bun run src/scripts/save-cookie.ts \'Cookie内容\'');
        return false;
    }

    const cookie = args[0]?.trim();

    if (!cookie) {
        console.log('❌ Cookie不能为空');
        return false;
    }

    try {
        const config = loadAicodemirrorConfig();
        config.cookies = cookie;

        saveAicodemirrorConfig(config);

        console.log(`✅ Cookie已保存`);
        console.log(`📏 Cookie长度: ${cookie.length} 字符`);

        // 测试Cookie有效性
        console.log('\n🧪 正在测试...');
        void testCookie(cookie);

        return true;
    } catch (error) {
        console.log(`❌ 保存失败: ${error}`);
        return false;
    }
}

async function testCookie(cookie: string): Promise<void> {
    try {
        const creditsData = await getCredits(cookie);

        if (!creditsData) {
            console.log('❌ Cookie无效，请重新获取');
            return;
        }

        const { credits, plan } = creditsData;
        const planIcons: Record<string, string> = {
            ULTRA: '👑',
            MAX: '💎',
            PRO: '⭐',
            FREE: '🆓'
        };
        const planIcon = planIcons[plan] ?? '❓';

        console.log(`测试结果: ${planIcon} ${credits} (${plan})`);
        console.log('✅ 测试成功！');
        console.log('🎉 现在重启Claude Code或等待下次状态栏刷新即可看到积分显示');
    } catch (error) {
        console.log(`⚠️ 测试失败: ${error}`);
        console.log('但Cookie已成功保存');
    }
}

if (import.meta.main) {
    saveCookie();
}