#!/usr/bin/env node
import chalk from 'chalk';

import { runTUI } from './tui';
import type {
    BlockMetrics,
    TokenMetrics
} from './types';
import type { RenderContext } from './types/RenderContext';
import type { StatusJSON } from './types/StatusJSON';
import { StatusJSONSchema } from './types/StatusJSON';
import {
    loadAicodemirrorConfig,
    saveAicodemirrorConfig
} from './utils/aicodemirror';
import { updateColorMap } from './utils/colors';
import {
    loadSettings,
    saveSettings
} from './utils/config';
import {
    getBlockMetrics,
    getSessionDuration,
    getTokenMetrics
} from './utils/jsonl';
import {
    calculateMaxWidthsFromPreRendered,
    preRenderAllWidgets,
    renderStatusLine
} from './utils/renderer';

async function readStdin(): Promise<string | null> {
    // Check if stdin is a TTY (terminal) - if it is, there's no piped data
    if (process.stdin.isTTY) {
        return null;
    }

    const chunks: string[] = [];

    try {
        // Use Node.js compatible approach
        if (typeof Bun !== 'undefined') {
            // Bun environment
            const decoder = new TextDecoder();
            for await (const chunk of Bun.stdin.stream()) {
                chunks.push(decoder.decode(chunk));
            }
        } else {
            // Node.js environment
            process.stdin.setEncoding('utf8');
            for await (const chunk of process.stdin) {
                chunks.push(chunk as string);
            }
        }
        return chunks.join('');
    } catch {
        return null;
    }
}

async function renderMultipleLines(data: StatusJSON) {
    const settings = await loadSettings();

    // Set global chalk level based on settings
    chalk.level = settings.colorLevel;
    // Update color map after setting chalk level
    updateColorMap();

    // Get all lines to render
    const lines = settings.lines;

    // Get token metrics if needed (check all lines)
    const hasTokenItems = lines.some(line => line.some(item => ['tokens-input', 'tokens-output', 'tokens-cached', 'tokens-total', 'context-length', 'context-percentage', 'context-percentage-usable'].includes(item.type)));

    // Check if session clock is needed
    const hasSessionClock = lines.some(line => line.some(item => item.type === 'session-clock'));

    // Check if block timer is needed
    const hasBlockTimer = lines.some(line => line.some(item => item.type === 'block-timer'));

    let tokenMetrics: TokenMetrics | null = null;
    if (hasTokenItems && data.transcript_path)
        tokenMetrics = await getTokenMetrics(data.transcript_path);

    let sessionDuration: string | null = null;
    if (hasSessionClock && data.transcript_path)
        sessionDuration = await getSessionDuration(data.transcript_path);

    let blockMetrics: BlockMetrics | null = null;
    if (hasBlockTimer && data.transcript_path)
        blockMetrics = getBlockMetrics(data.transcript_path);

    // Create render context
    const context: RenderContext = {
        data,
        tokenMetrics,
        sessionDuration,
        blockMetrics,
        isPreview: false
    };

    // Always pre-render all widgets once (for efficiency)
    const preRenderedLines = preRenderAllWidgets(lines, settings, context);
    const preCalculatedMaxWidths = calculateMaxWidthsFromPreRendered(preRenderedLines, settings);

    // Render each line using pre-rendered content
    let globalSeparatorIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        const lineItems = lines[i];
        if (lineItems && lineItems.length > 0) {
            const lineContext = { ...context, lineIndex: i, globalSeparatorIndex };
            const preRenderedWidgets = preRenderedLines[i] ?? [];
            const line = renderStatusLine(lineItems, settings, lineContext, preRenderedWidgets, preCalculatedMaxWidths);

            // Only output the line if it has content (not just ANSI codes)
            // Strip ANSI codes to check if there's actual text
            const strippedLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
            if (strippedLine.length > 0) {
                // Count separators used in this line (widgets - 1, excluding merged widgets)
                const nonMergedWidgets = lineItems.filter((_, idx) => idx === lineItems.length - 1 || !lineItems[idx]?.merge);
                if (nonMergedWidgets.length > 1)
                    globalSeparatorIndex += nonMergedWidgets.length - 1;

                // Replace all spaces with non-breaking spaces to prevent VSCode trimming
                let outputLine = line.replace(/ /g, '\u00A0');

                // Add reset code at the beginning to override Claude Code's dim setting
                outputLine = '\x1b[0m' + outputLine;
                console.log(outputLine);
            }
        }
    }

    // Check if there's an update message to display
    if (settings.updatemessage?.message
        && settings.updatemessage.message.trim() !== ''
        && settings.updatemessage.remaining
        && settings.updatemessage.remaining > 0) {
        // Display the message
        console.log(settings.updatemessage.message);

        // Decrement the remaining count
        const newRemaining = settings.updatemessage.remaining - 1;

        // Update or remove the updatemessage
        if (newRemaining <= 0) {
            // Remove the entire updatemessage block
            const { updatemessage, ...newSettings } = settings;
            void updatemessage;
            await saveSettings(newSettings);
        } else {
            // Update the remaining count
            await saveSettings({
                ...settings,
                updatemessage: {
                    ...settings.updatemessage,
                    remaining: newRemaining
                }
            });
        }
    }
}

// 处理退出登录命令
function handleLogoutCommand(): void {
    try {
        const config = loadAicodemirrorConfig();

        const newConfig = {
            ...config,
            cookies: '', // 清除Cookie
            cachedCredits: undefined, // 清除缓存的积分数据
            lastCreditRefresh: undefined // 清除最后刷新时间
        };

        saveAicodemirrorConfig(newConfig);
        console.log(chalk.green('✅ 登录状态已清除，Cookie已删除'));

        // 显示当前状态
        console.log(chalk.dim('📊 当前状态: 未登录'));
    } catch (error) {
        console.error(chalk.red(`❌ 清除登录状态失败: ${error}`));
        process.exit(1);
    }
}

// 处理积分刷新命令
async function handleCreditRefreshCommand(): Promise<void> {
    try {
        const { getCredits } = await import('./utils/aicodemirror');
        const config = loadAicodemirrorConfig();

        if (!config.cookies) {
            console.log(chalk.yellow('⚠️  未找到登录状态，请先登录'));
            return;
        }

        console.log(chalk.blue('🔄 正在刷新积分数据...'));
        const creditsData = await getCredits(config.cookies);

        if (creditsData) {
            console.log(chalk.green(`✅ 积分刷新成功: ${creditsData.credits} (${creditsData.plan})`));
        } else {
            console.log(chalk.yellow('⚠️  无法获取积分数据，Cookie可能已失效'));
        }
    } catch (error) {
        console.error(chalk.red(`❌ 积分刷新失败: ${error}`));
        process.exit(1);
    }
}

async function handleSetThresholdCommand(args: string[]): Promise<void> {
    try {
        const config = loadAicodemirrorConfig();

        // 解析阈值参数
        const thresholdIndex = args.findIndex(arg => arg === '--set-threshold');
        const thresholdValue = args[thresholdIndex + 1];

        if (!thresholdValue) {
            console.log(chalk.red('❌ 请指定阈值数值'));
            console.log(chalk.gray('用法: --set-threshold <数值>'));
            console.log(chalk.gray('示例: --set-threshold 200'));
            return;
        }

        const threshold = parseInt(thresholdValue, 10);
        if (isNaN(threshold) || threshold < 0) {
            console.log(chalk.red('❌ 阈值必须是非负整数'));
            return;
        }

        // 更新配置
        const updatedConfig = {
            ...config,
            creditThreshold: threshold,
            autoResetEnabled: true
        };
        saveAicodemirrorConfig(updatedConfig);

        console.log(chalk.green(`✅ 自动重置积分阈值已设置为: ${threshold}`));
        console.log(chalk.gray('💡 当积分低于此阈值时，系统将自动触发积分重置'));

        // 如果有Cookie，显示当前积分状态
        if (config.cookies) {
            const { getCredits } = await import('./utils/aicodemirror');
            const creditsData = await getCredits(config.cookies);
            if (creditsData) {
                console.log(chalk.cyan(`📊 当前积分: ${creditsData.credits} (${creditsData.plan})`));

                if (creditsData.credits < threshold) {
                    console.log(chalk.yellow('⚠️  当前积分已低于阈值，下次刷新时将自动重置'));
                }
            }
        }
    } catch (error) {
        console.error(chalk.red(`❌ 设置阈值失败: ${error}`));
        process.exit(1);
    }
}

async function handleShowThresholdCommand(): Promise<void> {
    try {
        const config = loadAicodemirrorConfig();

        const threshold = config.creditThreshold ?? 200;
        const autoResetEnabled = config.autoResetEnabled ?? true;

        console.log(chalk.cyan('🔧 自动重置积分配置'));
        console.log(chalk.gray('═'.repeat(30)));
        console.log(`${chalk.blue('阈值:')} ${threshold}`);
        console.log(`${chalk.blue('自动重置:')} ${autoResetEnabled ? chalk.green('启用') : chalk.red('禁用')}`);

        // 如果有Cookie，显示当前积分状态
        if (config.cookies) {
            const { getCredits } = await import('./utils/aicodemirror');
            const creditsData = await getCredits(config.cookies);
            if (creditsData) {
                console.log(chalk.gray('─'.repeat(30)));
                console.log(`${chalk.blue('当前积分:')} ${creditsData.credits} (${creditsData.plan})`);

                if (autoResetEnabled) {
                    if (creditsData.credits < threshold) {
                        console.log(chalk.yellow('⚠️  当前积分已低于阈值'));
                    } else {
                        console.log(chalk.green('✅ 当前积分高于阈值'));
                    }
                }
            }
        } else {
            console.log(chalk.yellow('⚠️  未配置Cookie，无法显示当前积分'));
        }

        console.log(chalk.gray('─'.repeat(30)));
        console.log(chalk.gray('💡 使用 --set-threshold <数值> 可以修改阈值'));
    } catch (error) {
        console.error(chalk.red(`❌ 查看配置失败: ${error}`));
        process.exit(1);
    }
}

async function main() {
    // Check for command line arguments first
    const args = process.argv.slice(2);

    // Handle special commands
    if (args.includes('--logout') || args.includes('--clear-cookie')) {
        handleLogoutCommand();
        return;
    }

    if (args.includes('--credit-refresh')) {
        await handleCreditRefreshCommand();
        return;
    }

    if (args.includes('--set-threshold')) {
        await handleSetThresholdCommand(args);
        return;
    }

    if (args.includes('--show-threshold')) {
        await handleShowThresholdCommand();
        return;
    }

    // Check if we're in a piped/non-TTY environment first
    // On Windows, process.stdin.isTTY might be undefined, so we need to check for both false and undefined
    if (!process.stdin.isTTY) {
        // We're receiving piped input
        const input = await readStdin();
        if (input && input.trim() !== '') {
            try {
                // Parse and validate JSON in one step
                const result = StatusJSONSchema.safeParse(JSON.parse(input));
                if (!result.success) {
                    console.error('Invalid status JSON format:', result.error.message);
                    process.exit(1);
                }

                await renderMultipleLines(result.data);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                process.exit(1);
            }
        } else {
            console.error('No input received');
            process.exit(1);
        }
    } else {
        // Interactive mode - run TUI
        // Remove updatemessage before running TUI
        const settings = await loadSettings();
        if (settings.updatemessage) {
            const { updatemessage, ...newSettings } = settings;
            void updatemessage;
            await saveSettings(newSettings);
        }
        runTUI();
    }
}

void main();