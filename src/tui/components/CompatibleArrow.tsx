import React from 'react';

import { getCompatibleChar } from '../../utils/unicode-compat';

interface CompatibleArrowProps {
    isSelected: boolean;
    spacing?: string;
}

/**
 * 兼容的箭头组件，在不支持Unicode的终端中显示替代字符
 */
export const CompatibleArrow: React.FC<CompatibleArrowProps> = ({
    isSelected,
    spacing = '  '
}) => {
    if (isSelected) {
        return (
            <>
                {getCompatibleChar('▶', '>')}
                {spacing}
            </>
        );
    }

    // 返回相同长度的空格以保持对齐
    return <>{' '.repeat(1 + spacing.length)}</>;
};

export default CompatibleArrow;