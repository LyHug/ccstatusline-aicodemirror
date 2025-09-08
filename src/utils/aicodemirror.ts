import {
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync
} from 'fs';
import { request } from 'https';
import { homedir } from 'os';
import {
    dirname,
    join
} from 'path';

// 缓存配置 - 30秒缓存，避免频繁API调用
export const CACHE_DURATION = 30; // 秒

// 配置文件路径
const CONFIG_FILE = join(homedir(), '.config', 'ccstatusline-aicodemirror', 'aicodemirror-config.json');

// 禁用SSL证书验证警告（仅用于开发）
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export interface AicodemirrorConfig {
    cookies?: string;
    credits_cache?: {
        data: AicodemirrorCreditsData;
        timestamp: number;
    };
    creditThreshold?: number;
    autoResetEnabled?: boolean;
    cacheDuration?: number; // 自定义缓存时间（秒）
}

export interface AicodemirrorCreditsData {
    userId?: number;
    email?: string | null;
    credits: number;
    plan: string;
}

export function loadAicodemirrorConfig(): AicodemirrorConfig {
    try {
        if (!existsSync(CONFIG_FILE)) {
            return {};
        }
        const data = readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data) as AicodemirrorConfig;
    } catch {
        return {};
    }
}

export function saveAicodemirrorConfig(config: AicodemirrorConfig): void {
    try {
        const configDir = dirname(CONFIG_FILE);
        if (!existsSync(configDir)) {
            mkdirSync(configDir, { recursive: true });
        }
        writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch {
        // 忽略错误
    }
}

export function getCredits(cookies?: string): Promise<AicodemirrorCreditsData | null> {
    return new Promise((resolve) => {
        if (!cookies) {
            resolve(null);
            return;
        }

        // 检查缓存
        const config = loadAicodemirrorConfig();
        const currentTime = Date.now() / 1000;

        // 如果有缓存且未过期，直接返回缓存数据
        if (config.credits_cache) {
            const cacheData = config.credits_cache;
            const cacheDuration = config.cacheDuration ?? CACHE_DURATION; // 使用配置中的缓存时间或默认值
            if (currentTime - cacheData.timestamp < cacheDuration) {
                resolve(cacheData.data);
                return;
            }
        }

        const options = {
            hostname: 'www.aicodemirror.com',
            path: '/api/user/credits',
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cookie': cookies,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            timeout: 3000
        };

        const req = request(options, (res) => {
            let data = '';
            res.on('data', (chunk: Buffer) => {
                data += chunk.toString();
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const jsonData = JSON.parse(data) as AicodemirrorCreditsData;

                        // 保存到缓存
                        config.credits_cache = {
                            data: jsonData,
                            timestamp: currentTime
                        };
                        saveAicodemirrorConfig(config);

                        resolve(jsonData);
                    } else {
                        resolve(null);
                    }
                } catch {
                    resolve(null);
                }
            });
        });

        req.on('error', () => {
            resolve(null);
        });

        req.on('timeout', () => {
            req.destroy();
            resolve(null);
        });

        req.end();
    });
}

export function formatCredits(credits: number): string {
    return credits.toString();
}

export function getPlanIcon(plan: string): string {
    const planIcons: Record<string, string> = {
        ULTRA: '👑',
        MAX: '💎',
        PRO: '⭐',
        FREE: '🆓'
    };
    return planIcons[plan] ?? '❓';
}

interface ClaudeConfigFile {
    env?: {
        ANTHROPIC_BASE_URL?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

/**
 * 从配置文件中提取 ANTHROPIC_BASE_URL
 */
function extractBaseUrlFromConfig(config: ClaudeConfigFile): string | null {
    // 只检查 env.ANTHROPIC_BASE_URL 字段
    if (config.env?.ANTHROPIC_BASE_URL && typeof config.env.ANTHROPIC_BASE_URL === 'string') {
        return config.env.ANTHROPIC_BASE_URL;
    }

    return null;
}

/**
 * 检测 ANTHROPIC_BASE_URL 的多个来源，按优先级返回第一个有效值
 * 优先级（从高到低）：
 * 1. 项目级配置文件（最高优先级）
 *    - .claude/settings.json 中的 env.ANTHROPIC_BASE_URL
 * 2. 用户级配置文件
 *    - ~/.claude/settings.json 中的 env.ANTHROPIC_BASE_URL
 * 3. 环境变量 ANTHROPIC_BASE_URL（最低优先级）
 */
export function getAnthropicBaseUrl(): string {
    // 1. 项目级配置文件（最高优先级）
    const projectConfigPath = join(process.cwd(), '.claude', 'settings.json');
    try {
        if (existsSync(projectConfigPath)) {
            const config = JSON.parse(readFileSync(projectConfigPath, 'utf-8')) as ClaudeConfigFile;
            const baseUrl = extractBaseUrlFromConfig(config);
            if (baseUrl) {
                return baseUrl;
            }
        }
    } catch {
        // 忽略项目配置读取错误
    }

    // 2. 用户级配置文件
    const userConfigPath = join(homedir(), '.claude', 'settings.json');
    try {
        if (existsSync(userConfigPath)) {
            const config = JSON.parse(readFileSync(userConfigPath, 'utf-8')) as ClaudeConfigFile;
            const baseUrl = extractBaseUrlFromConfig(config);
            if (baseUrl) {
                return baseUrl;
            }
        }
    } catch {
        // 忽略用户配置读取错误
    }

    // 3. 环境变量（最低优先级）
    const envBaseUrl = process.env.ANTHROPIC_BASE_URL;
    if (envBaseUrl?.trim()) {
        return envBaseUrl.trim();
    }

    // 默认返回空字符串
    return '';
}

export function checkAnthropicBaseUrl(): boolean {
    const baseUrl = getAnthropicBaseUrl();
    return baseUrl.includes('aicodemirror.com');
}

export function triggerCreditReset(cookies: string): Promise<boolean> {
    return new Promise((resolve) => {
        try {
            const options = {
                hostname: 'www.aicodemirror.com',
                path: '/api/user/credit-reset',
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Cookie': cookies,
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'priority': 'u=1, i'
                },
                timeout: 5000
            };

            const req = request(options, (res) => {
                res.on('end', () => {
                    resolve(res.statusCode === 200);
                });
            });

            req.on('error', () => { resolve(false); });
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });

            req.end();
        } catch {
            resolve(false);
        }
    });
}

export async function refreshCreditsCache(): Promise<boolean> {
    try {
        // 检查是否使用aicodemirror
        if (!checkAnthropicBaseUrl()) {
            return true;
        }

        const config = loadAicodemirrorConfig();
        const { cookies } = config;

        if (!cookies) {
            return false;
        }

        const creditsData = await getCredits(cookies);
        if (!creditsData) {
            return false;
        }

        // 检查是否需要自动重置积分
        await checkAndTriggerReset(config, creditsData);

        return true;
    } catch {
        return false;
    }
}

async function checkAndTriggerReset(config: AicodemirrorConfig, creditsData: AicodemirrorCreditsData): Promise<void> {
    // 初始化默认配置
    config.creditThreshold ??= 200;
    if (!Object.prototype.hasOwnProperty.call(config, 'autoResetEnabled'))
        config.autoResetEnabled = true;

    // 检查是否启用自动重置
    if (!config.autoResetEnabled || !config.cookies)
        return;

    // 检查积分是否低于阈值
    const currentCredits = creditsData.credits;
    if (currentCredits >= config.creditThreshold)
        return;

    // 触发积分重置
    try {
        await triggerCreditReset(config.cookies);
    } catch {
        // 静默处理错误，不影响主流程
    }
}