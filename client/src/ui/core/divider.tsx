import React from 'react';
import type { ViewProps } from 'react-native';

import { useTheme } from '@/core';
import { View } from '@/ui/core/view';
import { colors } from '@/ui/theme';

interface DividerProps extends ViewProps {
  width?: number;
  orientation?: 'horizontal' | 'vertical';
  color?: string;
}

const Divider: React.FC<DividerProps> = ({
  width = 1,
  orientation = 'horizontal',
  color,
  ...props
}) => {
  const isDark = useTheme.use.colorScheme() === 'dark';

  const dividerStyles = [
    { width: orientation === 'horizontal' ? '100%' : width },
    { height: orientation === 'vertical' ? '100%' : width },
    {
      backgroundColor:
        color ?? (isDark ? colors.gray20 : colors.neutral['200']),
    },
  ];

  return <View style={dividerStyles} {...props} />;
};

export default Divider;
