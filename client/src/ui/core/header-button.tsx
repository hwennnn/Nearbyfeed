import { useNavigation } from '@react-navigation/native';
import React from 'react';

import { useTheme } from '@/core';
import type { RootNavigatorProp } from '@/navigation';
import { Ionicons } from '@/ui/icons';
import colors from '@/ui/theme/colors';

import { TouchableOpacity } from './touchable-opacity';

type Props = {
  iconName: string;
  disabled?: boolean;
  onBack?: () => void;
};

export const HeaderButton = ({ iconName, disabled = false, onBack }: Props) => {
  const isDark = useTheme.use.colorScheme() === 'dark';

  const { goBack, canGoBack } = useNavigation<RootNavigatorProp>();

  const closeModal = () => {
    if (canGoBack()) {
      goBack();
    }
  };

  return (
    <TouchableOpacity
      className=""
      onPress={onBack ?? closeModal}
      disabled={disabled}
    >
      <Ionicons
        name={iconName}
        size={28}
        color={isDark ? colors.white : colors.black}
      />
    </TouchableOpacity>
  );
};
