import {
    existsSync,
    readFileSync,
    unlinkSync,
    writeFileSync
} from 'fs';
import {
    Box,
    Text,
    useInput
} from 'ink';
import TextInput from 'ink-text-input';
import { tmpdir } from 'os';
import { join } from 'path';
import React, { useState } from 'react';

import {
    checkAnthropicBaseUrl,
    getCredits,
    loadAicodemirrorConfig,
    saveAicodemirrorConfig
} from '../../utils/aicodemirror';
import {
    cleanup,
    launchBrowserLogin,
    openTextEditor,
    validateAndSaveCookie
} from '../../utils/browser-cookie';
import { getCompatibleChar } from '../../utils/unicode-compat';

export interface AicodemirrorConfigMenuProps { onBack: () => void }

export const AicodemirrorConfigMenu: React.FC<AicodemirrorConfigMenuProps> = ({ onBack }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showManualCookieMenu, setShowManualCookieMenu] = useState(false);
    const [showFileWait, setShowFileWait] = useState(false);
    const [showThresholdInput, setShowThresholdInput] = useState(false);
    const [thresholdInput, setThresholdInput] = useState('');
    const [showCacheTimeInput, setShowCacheTimeInput] = useState(false);
    const [cacheTimeInput, setCacheTimeInput] = useState('');
    const [status, setStatus] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [tempFilePath, setTempFilePath] = useState<string>('');

    const config = loadAicodemirrorConfig();
    const isAicodemirrorEnv = checkAnthropicBaseUrl();

    // 错误处理辅助函数
    const handleError = (action: string, error: unknown, stopProcessing = true) => {
        setStatus(`❌ ${action}失败: ${String(error)}`);
        if (stopProcessing)
            setIsProcessing(false);
    };

    const autoResetEnabled = config.autoResetEnabled ?? true;
    const menuItems = [
        { label: '✋ 手动获取Cookie', value: 'manual-cookie', selectable: true },
        { label: `🔄 自动重置积分: ${autoResetEnabled ? '开启' : '关闭'}`, value: 'toggle-auto-reset', selectable: true },
        ...(autoResetEnabled ? [{ label: '⚙️ 设置自动重置阈值', value: 'set-threshold', selectable: true }] : []),
        { label: '⏱️ 设置缓存刷新时间', value: 'set-cache-time', selectable: true },
        { label: '🧹 清除本地Cookie', value: 'clear-cookie', selectable: true },
        { label: '🔙 返回主菜单', value: 'back', selectable: true }
    ];

    const manualCookieMenuItems = [
        { label: '🌐 aicodemirror控制台登录', value: 'console-login', selectable: true },
        { label: '📄 从文件获取Cookie', value: 'file-cookie', selectable: true },
        { label: '🔙 返回上一级', value: 'back-to-main', selectable: true }
    ];

    const currentMenuItems = showManualCookieMenu ? manualCookieMenuItems : menuItems;
    const selectableItems = currentMenuItems.filter(item => item.selectable);

    useInput((input, key) => {
        if (showFileWait) {
            // Handle file input waiting state
            if (key.return || input === ' ') {
                void handleFileReadAndValidate();
            } else if (key.escape) {
                setShowFileWait(false);
                setStatus(''); // Clear status when canceling file input
            }
            return;
        }

        if (showThresholdInput) {
            // Handle threshold input - TextInput component handles most input
            if (key.escape) {
                setShowThresholdInput(false);
                setThresholdInput('');
                setStatus(''); // Clear status when canceling threshold input
            }
            return;
        }

        if (showCacheTimeInput) {
            // Handle cache time input - TextInput component handles most input
            if (key.escape) {
                setShowCacheTimeInput(false);
                setCacheTimeInput('');
                setStatus(''); // Clear status when canceling cache time input
            }
            return;
        }

        // Normal menu navigation
        if (key.upArrow) {
            setSelectedIndex(Math.max(0, selectedIndex - 1));
            // Clear status when navigating menu items
            if (status && !isProcessing) {
                setStatus('');
            }
        } else if (key.downArrow) {
            setSelectedIndex(Math.min(selectableItems.length - 1, selectedIndex + 1));
            // Clear status when navigating menu items
            if (status && !isProcessing) {
                setStatus('');
            }
        } else if (key.return) {
            const item = selectableItems[selectedIndex];
            if (item) {
                handleMenuSelect(item.value);
            }
        } else if (key.escape) {
            if (showManualCookieMenu) {
                // 如果在子菜单中，返回到主菜单
                handleBackToMain();
            } else {
                // 如果在主菜单中，返回到父级
                onBack();
            }
        }
    });

    const handleMenuSelect = (value: string) => {
        setStatus(''); // Clear previous status

        switch (value) {
        case 'console-login':
            void handleConsoleLogin();
            break;
        case 'manual-cookie':
            handleManualCookie();
            break;
        case 'file-cookie':
            void handleFileCookie();
            break;
        case 'toggle-auto-reset':
            handleToggleAutoReset();
            break;
        case 'set-threshold':
            handleSetThreshold();
            break;
        case 'set-cache-time':
            handleSetCacheTime();
            break;
        case 'clear-cookie':
            handleClearCookie();
            break;
        case 'back-to-main':
            handleBackToMain();
            break;
        case 'back':
            cleanup();
            onBack();
            break;
        }
    };

    const handleConsoleLogin = async () => {
        setIsProcessing(true);
        setStatus('🚀 启动aicodemirror控制台登录...');

        try {
            const result = await launchBrowserLogin();

            if (result.success) {
                setStatus(result.message);
            } else {
                setStatus(`⚠️ ${result.message}`);
            }
        } catch (error) {
            handleError('控制台登录', error, false);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualCookie = () => {
        setShowManualCookieMenu(true);
        setSelectedIndex(0);
        setStatus(''); // Clear status when entering submenu
    };

    const handleBackToMain = () => {
        setShowManualCookieMenu(false);
        setSelectedIndex(0);
        setStatus(''); // Clear status when returning to main menu
    };

    const handleFileCookie = async () => {
        setIsProcessing(true);
        setStatus('🔍 检查现有Cookie状态...');

        try {
            // 首先检查是否已有有效的Cookie
            const config = loadAicodemirrorConfig();
            if (config.cookies) {
                setStatus('🔍 验证现有Cookie有效性...');
                const existingCredits = await getCredits(config.cookies);

                if (existingCredits) {
                    setStatus(`✅ 检测到有效Cookie！

📊 当前状态：
   积分: ${existingCredits.credits}
   计划: ${existingCredits.plan}
   
💡 您已有有效的Cookie，无需重新输入。
   如需更换Cookie，请先选择"🧹 清除本地Cookie"，然后重新输入。`);
                    setIsProcessing(false);
                    return;
                }
            }

            // 没有有效Cookie，继续文件获取流程
            setStatus('📄 正在创建临时文件用于Cookie获取...');
            const tempFile = join(tmpdir(), 'ccstatusline-cookie-get.txt');
            const instructionText = `请在此文件中粘贴您从浏览器获取的Cookie，然后保存并关闭：

Cookie获取步骤：
1. 在浏览器中按F12打开开发者工具
2. 切换到Network标签页 
3. 刷新页面，找到console请求
4. 点击该请求，查看Headers → Request Headers
5. 复制Cookie:后面的完整内容
6. 粘贴到下方空行，保存文件并关闭编辑器

Cookie内容（请粘贴到下一行）：

`;

            writeFileSync(tempFile, instructionText);
            setTempFilePath(tempFile);

            // 打开系统默认编辑器
            await openTextEditor(tempFile);

            // 切换到等待状态
            setShowFileWait(true);
            setIsProcessing(false);
            setStatus(`📄 已打开编辑器，请按以下步骤操作：

1. 从浏览器控制台页面获取完整的Cookie
2. 在编辑器中粘贴Cookie到指定位置
3. 保存文件并关闭编辑器
4. 回到此界面按 Enter 或 空格键继续验证

⚠️ 不要关闭此程序，完成编辑后请按键继续...`);
        } catch (error) {
            handleError('文件操作', error);
        }
    };

    const handleFileReadAndValidate = async () => {
        setShowFileWait(false);
        setIsProcessing(true);
        setStatus('🔍 正在读取Cookie文件...');

        try {
            const tempFile = tempFilePath;

            // 读取文件内容
            if (existsSync(tempFile)) {
                const fileContent = readFileSync(tempFile, 'utf8');
                const lines = fileContent.split('\n');
                const cookieLine = lines.find(line => line.trim()
                    && !line.includes('请在此文件')
                    && !line.includes('复制步骤')
                    && !line.includes('Cookie内容')
                    && line.length > 50
                );

                if (cookieLine) {
                    const cookie = cookieLine.trim();
                    setStatus(`🔍 找到Cookie (${cookie.length} 字符)，正在验证...`);
                    const result = await validateAndSaveCookie(cookie);
                    setStatus(result.message);

                    // 清理临时文件
                    try {
                        unlinkSync(tempFile);
                        setTempFilePath('');
                    } catch {
                        // 忽略删除错误
                    }
                } else {
                    setStatus('❌ 未在文件中找到有效的Cookie，请确保已正确粘贴并保存文件\n\n💡 如需重试，请重新选择"从文件输入Cookie"');
                }
            } else {
                setStatus('❌ 临时文件不存在，请重试');
            }
        } catch (error) {
            handleError('读取文件', error, false);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleToggleAutoReset = () => {
        try {
            setIsProcessing(true);
            const currentConfig = loadAicodemirrorConfig();
            const newAutoResetEnabled = !(currentConfig.autoResetEnabled ?? true);

            const updatedConfig = {
                ...currentConfig,
                autoResetEnabled: newAutoResetEnabled
            };

            saveAicodemirrorConfig(updatedConfig);

            if (newAutoResetEnabled) {
                setStatus('✅ 自动重置积分已开启');
                // 如果开启自动重置但没有设置阈值，提示设置阈值
                if (!updatedConfig.creditThreshold) {
                    setTimeout(() => {
                        setStatus('💡 建议设置自动重置阈值以自定义触发条件');
                    }, 1500);
                }
            } else {
                setStatus('⏸️ 自动重置积分已关闭');
            }
        } catch (error) {
            handleError('切换自动重置状态', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSetThreshold = () => {
        const currentThreshold = config.creditThreshold ?? 200;
        setThresholdInput(currentThreshold.toString());
        setShowThresholdInput(true);
        setStatus(`🔧 设置自动重置阈值 (当前: ${currentThreshold})`);
    };

    const handleThresholdSubmitAsync = async (value: string) => {
        setShowThresholdInput(false);
        setIsProcessing(true);
        setStatus('🔄 正在保存阈值设置...');

        try {
            const threshold = parseInt(value.trim(), 10);

            if (isNaN(threshold) || threshold < 0) {
                setStatus('❌ 阈值必须是非负整数');
                setIsProcessing(false);
                return;
            }

            // 更新配置
            const updatedConfig = {
                ...config,
                creditThreshold: threshold,
                autoResetEnabled: true
            };
            saveAicodemirrorConfig(updatedConfig);

            setStatus(`✅ 自动重置积分阈值已设置为: ${threshold}

💡 当积分低于此阈值时，系统将自动触发积分重置`);

            // 如果有Cookie，显示当前积分状态
            if (config.cookies) {
                const creditsData = await getCredits(config.cookies);
                if (creditsData) {
                    const statusMsg = `✅ 自动重置积分阈值已设置为: ${threshold}

📊 当前积分状态：${creditsData.credits} (${creditsData.plan})

${creditsData.credits < threshold
    ? '⚠️ 当前积分已低于阈值，下次刷新时将自动重置'
    : '✅ 当前积分高于阈值'}

💡 当积分低于此阈值时，系统将自动触发积分重置`;
                    setStatus(statusMsg);
                }
            }
        } catch (error) {
            handleError('设置阈值', error, false);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleThresholdSubmit = (value: string) => {
        void handleThresholdSubmitAsync(value);
    };

    const handleSetCacheTime = () => {
        const currentCacheTime = config.cacheDuration ?? 30;
        setCacheTimeInput(currentCacheTime.toString());
        setShowCacheTimeInput(true);
        setStatus(`⏱️ 设置积分缓存时间 (当前: ${currentCacheTime}秒)`);
    };

    const handleCacheTimeSubmitAsync = (value: string) => {
        setShowCacheTimeInput(false);
        setIsProcessing(true);
        setStatus('🔄 正在保存缓存时间设置...');

        try {
            const cacheTime = parseInt(value.trim(), 10);

            if (isNaN(cacheTime) || cacheTime < 5) {
                setStatus('❌ 缓存时间必须是至少5秒的整数');
                setIsProcessing(false);
                return;
            }

            // 更新配置
            const updatedConfig = {
                ...config,
                cacheDuration: cacheTime
            };
            saveAicodemirrorConfig(updatedConfig);

            setStatus(`✅ 积分缓存时间已设置为: ${cacheTime}秒

💡 积分信息将在${cacheTime}秒内保持缓存，减少API调用频率`);
        } catch (error) {
            handleError('设置缓存时间', error, false);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCacheTimeSubmit = (value: string) => {
        handleCacheTimeSubmitAsync(value);
    };

    const handleClearCookie = () => {
        const newConfig = {
            ...config,
            cookies: '', // 清除Cookie
            cachedCredits: undefined, // 清除缓存的积分数据
            lastCreditRefresh: undefined // 清除最后刷新时间
        };
        saveAicodemirrorConfig(newConfig);
        setStatus('✅ 本地Cookie已清除');
    };

    const getDescription = (value: string): string => {
        const mainDescriptions: Record<string, string> = {
            'manual-cookie': '提供手动获取Cookie的方式',
            'toggle-auto-reset': `${autoResetEnabled ? '关闭' : '开启'}自动重置积分功能`,
            'set-threshold': `设置自动重置积分的触发阈值 (当前: ${config.creditThreshold ?? 200})`,
            'set-cache-time': `设置积分信息的缓存时间 (当前: ${config.cacheDuration ?? 30}秒)`,
            'clear-cookie': '清除本地保存的Cookie',
            'back': '返回到主菜单'
        };

        const manualCookieDescriptions: Record<string, string> = {
            'console-login': '打开aicodemirror控制台页面，通过Network面板获取准确的Cookie',
            'file-cookie': '通过文本编辑器从文件获取Cookie',
            'back-to-main': '返回到上一级菜单'
        };

        const descriptions = showManualCookieMenu ? manualCookieDescriptions : mainDescriptions;
        return descriptions[value] ?? '';
    };

    const selectedItem = selectableItems[selectedIndex];
    const description = selectedItem ? getDescription(selectedItem.value) : '';

    return (
        <Box flexDirection='column'>
            <Text bold>{showManualCookieMenu ? '手动获取Cookie' : 'Aicodemirror Configuration'}</Text>

            {!isAicodemirrorEnv && (
                <Box marginTop={1} marginBottom={1}>
                    <Text color='yellow'>
                        ⚠️  未检测到 aicodemirror 环境，请设置 ANTHROPIC_BASE_URL
                    </Text>
                </Box>
            )}

            {config.cookies && (
                <Box marginTop={1}>
                    <Text color='green'>
                        ✅ Cookie已配置 (长度:
                        {' '}
                        {config.cookies.length}
                        {' '}
                        字符)
                    </Text>
                </Box>
            )}

            <Box marginTop={1}>
                <Text color='cyan'>
                    ⚙️ 自动重置阈值:
                    {' '}
                    {config.creditThreshold ?? 200}
                    {' '}
                    (
                    {(config.autoResetEnabled ?? true) ? '启用' : '禁用'}
                    )
                </Text>
            </Box>

            <Box marginTop={1}>
                <Text color='cyan'>
                    ⏱️ 积分缓存时间:
                    {' '}
                    {config.cacheDuration ?? 30}
                    秒
                </Text>
            </Box>

            <Box marginTop={1} flexDirection='column'>
                {showFileWait ? (
                    <Box flexDirection='column'>
                        <Text color='cyan' bold>📝 等待文件编辑完成...</Text>
                        <Text> </Text>
                        <Text dimColor>请在打开的编辑器中完成以下步骤：</Text>
                        <Text dimColor>1. 粘贴完整的Cookie到文件中</Text>
                        <Text dimColor>2. 保存文件 (Ctrl+S)</Text>
                        <Text dimColor>3. 关闭编辑器</Text>
                        <Text dimColor>4. 返回此界面</Text>
                        <Text> </Text>
                        <Text color='green'>✓ 编辑完成后，按 Enter 或 空格键 验证Cookie</Text>
                        <Text color='yellow'>✗ 按 Esc 取消操作</Text>
                    </Box>
                ) : showThresholdInput ? (
                    <Box flexDirection='column'>
                        <Text color='cyan' bold>⚙️ 设置自动重置阈值</Text>
                        <Text> </Text>
                        <Text dimColor>请输入积分阈值（非负整数）：</Text>
                        <Box marginTop={1}>
                            <Text>阈值: </Text>
                            <TextInput
                                value={thresholdInput}
                                onChange={setThresholdInput}
                                onSubmit={handleThresholdSubmit}
                                placeholder='200'
                            />
                        </Box>
                        <Text> </Text>
                        <Text dimColor>💡 当积分低于此阈值时，系统将自动触发积分重置</Text>
                        <Text color='green'>✓ 输入完成后按 Enter 确认</Text>
                        <Text color='yellow'>✗ 按 Esc 取消</Text>
                    </Box>
                ) : showCacheTimeInput ? (
                    <Box flexDirection='column'>
                        <Text color='cyan' bold>⏱️ 设置积分缓存时间</Text>
                        <Text> </Text>
                        <Text dimColor>请输入缓存时间（至少5秒）：</Text>
                        <Box marginTop={1}>
                            <Text>时间: </Text>
                            <TextInput
                                value={cacheTimeInput}
                                onChange={setCacheTimeInput}
                                onSubmit={handleCacheTimeSubmit}
                                placeholder='30'
                            />
                            <Text> 秒</Text>
                        </Box>
                        <Text> </Text>
                        <Text dimColor>💡 积分信息将在指定时间内保持缓存，减少API调用频率</Text>
                        <Text color='green'>✓ 输入完成后按 Enter 确认</Text>
                        <Text color='yellow'>✗ 按 Esc 取消</Text>
                    </Box>
                ) : (
                    currentMenuItems.map((item, idx) => {
                        if (!item.selectable && item.value.startsWith('_gap')) {
                            return <Text key={item.value}> </Text>;
                        }
                        const selectableIdx = selectableItems.indexOf(item);
                        const isSelected = selectableIdx === selectedIndex;

                        return (
                            <Text
                                key={item.value}
                                color={isSelected ? 'green' : undefined}
                            >
                                {isSelected ? `${getCompatibleChar('▶', '>')}  ` : '   '}
                                {item.label}
                            </Text>
                        );
                    })
                )}
            </Box>

            {status && (
                <Box marginTop={1}>
                    <Text>{status}</Text>
                </Box>
            )}

            {description && !showFileWait && !showThresholdInput && (
                <Box marginTop={1} paddingLeft={2}>
                    <Text dimColor wrap='wrap'>{description}</Text>
                </Box>
            )}

            {!showFileWait && !showThresholdInput && !isProcessing && (
                <Box marginTop={1}>
                    <Text dimColor>使用方向键导航，Enter选择，Esc返回</Text>
                </Box>
            )}

            {isProcessing && (
                <Box marginTop={1}>
                    <Text color='yellow'>🔄 处理中...</Text>
                </Box>
            )}
        </Box>
    );
};