import React from 'react';
import type { ViewProps } from 'react-native';

import { useTheme } from '@/core';
import { View } from '@/ui/core/view';

interface DividerProps extends ViewProps {
  width?: number;
  orientation?: 'horizontal' | 'vertical';
  color?: string;
}

const Divider: React.FC<DividerProps> = (
  props,
  { width = 1, orientation = 'horizontal', color }
) => {
  const isDark = useTheme.use.colorScheme() === 'dark';

  const dividerStyles = [
    { width: orientation === 'horizontal' ? '100%' : width },
    { height: orientation === 'vertical' ? '100%' : width },
    { backgroundColor: color ?? isDark ? '#333333' : '#000000' },
  ];

  return <View style={dividerStyles} {...props} />;
};

export default Divider;
