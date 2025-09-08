import {
    Box,
    Text,
    useInput
} from 'ink';
import React, { useState } from 'react';

import { getCompatibleChar } from '../../utils/unicode-compat';

export interface InstallMenuProps {
    bunxAvailable: boolean;
    existingStatusLine: string | null;
    onSelectNpx: () => void;
    onSelectBunx: () => void;
    onSelectDev: () => void;
    onCancel: () => void;
}

export const InstallMenu: React.FC<InstallMenuProps> = ({
    bunxAvailable,
    existingStatusLine,
    onSelectNpx,
    onSelectBunx,
    onSelectDev,
    onCancel
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const isProduction = process.env.NODE_ENV === 'production';
    const showDevOption = !isProduction;
    const maxIndex = bunxAvailable
        ? (showDevOption ? 3 : 2)  // npx, bunx, dev (if not production), back
        : (showDevOption ? 2 : 1); // npx, dev (if not production), back

    useInput((input, key) => {
        if (key.escape) {
            onCancel();
        } else if (key.upArrow) {
            setSelectedIndex(selectedIndex === 0 ? maxIndex : selectedIndex - 1);
        } else if (key.downArrow) {
            setSelectedIndex(selectedIndex === maxIndex ? 0 : selectedIndex + 1);
        } else if (key.return) {
            if (selectedIndex === 0) {
                onSelectNpx();
            } else if (selectedIndex === 1 && bunxAvailable) {
                onSelectBunx();
            } else if (showDevOption && selectedIndex === (bunxAvailable ? 2 : 1)) {
                onSelectDev();
            } else if (selectedIndex === maxIndex) {
                onCancel();
            }
        }
    });

    return (
        <Box flexDirection='column'>
            <Text bold>Install ccstatusline-aicodemirror to Claude Code</Text>

            {existingStatusLine && (
                <Box marginBottom={1}>
                    <Text color='yellow'>
                        ⚠ Current status line: "
                        {existingStatusLine}
                        "
                    </Text>
                </Box>
            )}

            <Box>
                <Text dimColor>Select installation method:</Text>
            </Box>

            <Box marginTop={1} flexDirection='column'>
                <Box>
                    <Text color={selectedIndex === 0 ? 'blue' : undefined}>
                        {selectedIndex === 0 ? `${getCompatibleChar('▶', '>')}  ` : '   '}
                        npx - Node Package Execute
                    </Text>
                </Box>

                {bunxAvailable && (
                    <Box>
                        <Text color={selectedIndex === 1 ? 'blue' : undefined}>
                            {selectedIndex === 1 ? `${getCompatibleChar('▶', '>')}  ` : '   '}
                            bunx - Bun Package Execute
                        </Text>
                    </Box>
                )}

                {showDevOption && (
                    <Box>
                        <Text color={selectedIndex === (bunxAvailable ? 2 : 1) ? 'blue' : undefined}>
                            {selectedIndex === (bunxAvailable ? 2 : 1) ? `${getCompatibleChar('▶', '>')}  ` : '   '}
                            dev - Development Testing
                        </Text>
                    </Box>
                )}

                <Box marginTop={1}>
                    <Text color={selectedIndex === maxIndex ? 'blue' : undefined}>
                        {selectedIndex === maxIndex ? `${getCompatibleChar('▶', '>')}  ` : '   '}
                        ← Back
                    </Text>
                </Box>
            </Box>

            <Box marginTop={2}>
                <Text dimColor>
                    The selected command will be written to ~/.claude/settings.json
                </Text>
            </Box>

            <Box marginTop={1}>
                <Text dimColor>Press Enter to select, ESC to cancel</Text>
            </Box>
        </Box>
    );
};