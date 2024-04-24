import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import type { RootNavigatorProp } from '@/navigation';
import { colors, TouchableOpacity } from '@/ui';

export const HeaderButton = ({ iconName }: { iconName: string }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { goBack, canGoBack } = useNavigation<RootNavigatorProp>();

  const closeModal = () => {
    if (canGoBack()) {
      goBack();
    }
  };

  return (
    <TouchableOpacity onPress={closeModal} className="">
      <Icon
        name={iconName}
        size={28}
        color={isDark ? colors.white : colors.black}
      />
    </TouchableOpacity>
  );
};
