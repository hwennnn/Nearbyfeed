import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import type { RootNavigatorProp } from '@/navigation';
import colors from '@/ui/theme/colors';

import { TouchableOpacity } from './touchable-opacity';

type Props = {
  iconName: string;
  disabled?: boolean;
  onBack?: () => void;
};

export const HeaderButton = ({ iconName, disabled = false, onBack }: Props) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      <Icon
        name={iconName}
        size={28}
        color={isDark ? colors.white : colors.black}
      />
    </TouchableOpacity>
  );
};
