import React from 'react';
import type { TouchableOpacityProps } from 'react-native';

import { ActivityIndicator } from './activity-indicator';
import type { ITextProps } from './text';
import { Text } from './text';
import { TouchableOpacity } from './touchable-opacity';

interface Props extends TouchableOpacityProps {
  label?: string;
  isLoading?: boolean;
  textProps?: ITextProps;
}

export const LoadingButton = ({
  label,
  isLoading = false,
  disabled = false,
  textProps,
  ...props
}: Props) => {
  return (
    <TouchableOpacity
      disabled={disabled || isLoading}
      className={`flex-row items-center justify-center rounded-lg bg-primary-500 px-4 py-2 dark:bg-primary-600 ${
        disabled ? 'opacity-50' : ''
      }`}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Text
          variant="sm"
          className="text-black dark:text-white"
          {...textProps}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};
