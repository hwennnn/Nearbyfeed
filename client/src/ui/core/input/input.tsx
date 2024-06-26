import { styled } from 'nativewind';
import * as React from 'react';
import type { TextInput, TextInputProps } from 'react-native';
import { StyleSheet } from 'react-native';
import { TextInput as NTextInput } from 'react-native';

import { isRTL, useTheme } from '@/core';

import colors from '../../theme/colors';
import { Text } from '../text';
import { View } from '../view';

const STextInput = styled(NTextInput);

export interface NInputProps extends TextInputProps {
  label?: string;
  disabled?: boolean;
  error?: string;
  rightIcon?: React.ReactElement;
}

export const Input = React.forwardRef<TextInput, NInputProps>((props, ref) => {
  const { label, error, rightIcon, ...inputProps } = props;
  const isDark = useTheme.use.colorScheme() === 'dark';
  const [isFocused, setIsFocused] = React.useState(false);
  const onBlur = React.useCallback(() => setIsFocused(false), []);
  const onFocus = React.useCallback(() => setIsFocused(true), []);

  const borderColor = error
    ? 'border-danger-600'
    : isFocused
    ? isDark
      ? 'border-white'
      : 'border-neutral-600'
    : isDark
    ? 'border-charcoal-700'
    : 'border-neutral-400';

  const bgColor = isDark
    ? 'bg-charcoal-800'
    : error
    ? 'bg-danger-50'
    : 'bg-neutral-200';
  const textDirection = isRTL ? 'text-right' : 'text-left';
  return (
    <View className="mb-4">
      {label && (
        <Text
          variant="md"
          className={`mb-1 font-bold ${
            error
              ? 'text-danger-600'
              : isDark
              ? 'text-charcoal-100'
              : 'text-black'
          }`}
        >
          {label}
        </Text>
      )}
      <View className="items-between flex-row items-center space-x-2">
        <STextInput
          keyboardAppearance={isDark ? 'dark' : 'light'}
          autoCapitalize="none"
          autoCorrect={false}
          testID="STextInput"
          ref={ref}
          placeholderTextColor={colors.neutral[400]}
          className={`mt-0 flex-1 border px-4 py-3 ${borderColor} rounded-full ${bgColor} text-[16px] ${textDirection} dark:text-charcoal-100`}
          onBlur={onBlur}
          onFocus={onFocus}
          {...inputProps}
          style={StyleSheet.flatten([
            { writingDirection: isRTL ? 'rtl' : 'ltr' },
          ])}
        />
        {rightIcon !== undefined && rightIcon}
      </View>
      {error && <Text variant="error">{error}</Text>}
    </View>
  );
});
