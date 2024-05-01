import React from 'react';
import type { TouchableOpacityProps } from 'react-native';

import { ActivityIndicator } from './activity-indicator';
import { Text } from './text';
import { TouchableOpacity } from './touchable-opacity';

interface Props extends TouchableOpacityProps {
  label?: string;
  isLoading?: boolean;
}

export const LoadingButton = ({
  label,
  isLoading = false,
  disabled = false,
  ...props
}: Props) => {
  return (
    <TouchableOpacity
      disabled={disabled || isLoading}
      className={`flex-row items-center justify-center rounded-lg bg-primary-600 px-12 py-2 ${
        disabled ? 'opacity-50' : ''
      }`}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Text variant="sm">{label}</Text>
      )}
    </TouchableOpacity>
  );
};
