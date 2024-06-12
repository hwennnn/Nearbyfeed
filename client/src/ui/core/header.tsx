import * as React from 'react';

import { HeaderButton } from './header-button';
import { Text } from './text';
import { View } from './view';

type Props = {
  headerTitle?: string;
  onBack?: () => void;
  isDisabledBack?: boolean;
  headerRight?: JSX.Element;
};

export const Header = ({
  headerTitle,
  onBack,
  isDisabledBack = false,
  headerRight,
}: Props) => {
  return (
    <View className="flex-row items-center px-4">
      <View className="flex-1 items-start">
        <HeaderButton
          iconName="chevron-back-outline"
          onBack={onBack}
          disabled={isDisabledBack}
        />
      </View>

      <View className="flex-2 items-center">
        <Text className="text-center font-semibold" variant="lg">
          {headerTitle ?? ''}
        </Text>
      </View>

      <View className="flex-1 items-end">
        {headerRight !== undefined && headerRight}
      </View>
    </View>
  );
};
