#!/usr/bin/env bun
/**
 * 积分刷新脚本 - 用于Stop Hook
 * 强制刷新积分缓存，不显示输出（避免干扰状态栏）
 * 集成到 ccstatusline 项目中
 */

import { refreshCreditsCache } from '../utils/aicodemirror';

async function main(): Promise<void> {
    // 静默执行，不输出任何内容
    try {
        await refreshCreditsCache();
    } catch {
        // 静默处理错误，不影响主流程
    }
}

if (import.meta.main) {
    void main();
}