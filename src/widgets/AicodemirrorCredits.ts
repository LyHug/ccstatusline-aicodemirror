import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    CACHE_DURATION,
    checkAnthropicBaseUrl,
    formatCredits,
    getCredits,
    getPlanIcon,
    loadAicodemirrorConfig
} from '../utils/aicodemirror';

export class AicodemirrorCreditsWidget implements Widget {
    getDefaultColor(): string {
        return 'blue';
    }

    getDescription(): string {
        return 'Displays aicodemirror credit balance and plan type (requires ANTHROPIC_BASE_URL with aicodemirror)';
    }

    getDisplayName(): string {
        return 'Aicodemirror Credits';
    }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? '💎 12345' : 'Credits: 💎 12345';
        }

        // 检查是否使用aicodemirror
        if (!checkAnthropicBaseUrl()) {
            return null; // 不显示，因为不是aicodemirror环境
        }

        try {
            const config = loadAicodemirrorConfig();
            const { cookies } = config;

            if (!cookies) {
                return item.rawValue ? '🍪 Cookie 未配置' : 'Credits: 🍪 Cookie 未配置';
            }

            // 先检查缓存数据
            if (config.credits_cache) {
                const currentTime = Date.now() / 1000;
                const cacheData = config.credits_cache;
                const cacheDuration = config.cacheDuration ?? CACHE_DURATION; // 使用配置中的缓存时间或默认值

                // 如果缓存仍然有效，使用缓存数据
                if (currentTime - cacheData.timestamp < cacheDuration) {
                    const credits = cacheData.data.credits || 0;
                    const plan = cacheData.data.plan || 'FREE';
                    const creditsText = formatCredits(credits);
                    const planIcon = getPlanIcon(plan);

                    return item.rawValue ? `${planIcon} ${creditsText}` : `Credits: ${planIcon} ${creditsText}`;
                }
            }

            // 如果没有有效缓存，触发后台刷新（异步）
            this.refreshCreditsInBackground(cookies);

            // 返回旧的缓存数据或默认消息
            if (config.credits_cache?.data) {
                const credits = config.credits_cache.data.credits || 0;
                const plan = config.credits_cache.data.plan || 'FREE';
                const creditsText = formatCredits(credits);
                const planIcon = getPlanIcon(plan);

                return item.rawValue ? `${planIcon} ${creditsText}` : `Credits: ${planIcon} ${creditsText}`;
            }

            return item.rawValue ? '🔄 加载中...' : 'Credits: 🔄 加载中...';
        } catch {
            return item.rawValue ? '🔴 错误' : 'Credits: 🔴 错误';
        }
    }

    private refreshCreditsInBackground(cookies: string): void {
        // 异步刷新积分数据，不阻塞渲染
        getCredits(cookies).then(() => {
            // 数据已更新到缓存中，下次渲染会使用新数据
        }).catch(() => {
            // 静默处理错误
        });
    }

    supportsRawValue(): boolean {
        return true;
    }

    supportsColors(item: WidgetItem): boolean {
        return true;
    }
}