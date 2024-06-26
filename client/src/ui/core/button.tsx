import React from 'react';
import type { TouchableOpacityProps } from 'react-native';

import { useTheme } from '@/core';

import { ActivityIndicator } from './activity-indicator';
import { Text } from './text';
import { TouchableOpacity } from './touchable-opacity';
import { View } from './view';

type Variant = {
  container: string;
  label: string;
  indicator: string;
};
type VariantName = 'defaults' | 'primary' | 'outline' | 'secondary';
type BVariant = {
  [key in VariantName]: Variant;
};

interface Props extends TouchableOpacityProps {
  variant?: VariantName;
  label?: string;
  loading?: boolean;
  icon?: JSX.Element;
}

export const Button = ({
  label,
  loading = false,
  variant = 'primary',
  disabled = false,
  icon,
  ...props
}: Props) => {
  const isDark = useTheme.use.colorScheme() === 'dark';

  // Define buttonVariants with dynamic primary variant
  const buttonVariants: BVariant = {
    defaults: {
      container:
        'flex-row items-center justify-center rounded-md px-12 py-3 my-2',
      label: 'text-[16px] font-medium text-white',
      indicator: '',
    },
    primary: {
      container: isDark ? 'bg-white' : 'bg-black',
      label: isDark ? 'text-black' : 'text-white',
      indicator: isDark ? 'black' : 'white',
    },
    secondary: {
      container: 'bg-primary-600',
      label: 'text-secondary-600',
      indicator: 'white',
    },
    outline: {
      container: 'border border-neutral-400',
      label: 'text-black dark:text-charcoal-100',
      indicator: 'black',
    },
  };

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      className={`
        ${buttonVariants.defaults.container}
        ${buttonVariants[variant].container}
        ${disabled ? 'opacity-50' : ''}
      `}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={buttonVariants[variant].indicator}
          size="small"
          className={`
            ${buttonVariants.defaults.indicator}
          `}
        />
      ) : (
        <View className="flex-row items-center space-x-2">
          {icon !== undefined && icon}
          <Text
            className={`
              ${buttonVariants.defaults.label}
              ${buttonVariants[variant].label}
            `}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
