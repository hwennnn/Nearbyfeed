import { useNavigation } from '@react-navigation/native';
import React from 'react';

import type { RootNavigatorProp } from '@/navigation';
import { Ionicons } from '@/ui/icons';

import { TouchableOpacity } from './touchable-opacity';

type Props = {
  size?: number;
  iconName: string;
  disabled?: boolean;
  onBack?: () => void;
};

export const HeaderButton = ({
  iconName,
  disabled = false,
  onBack,
  size = 24,
}: Props) => {
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
        size={size}
        className="text-black dark:text-white"
      />
    </TouchableOpacity>
  );
};
