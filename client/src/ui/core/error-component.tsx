import React from 'react';

import { Ionicons } from '@/ui/icons';

import { Text } from './text';
import { TouchableOpacity } from './touchable-opacity';
import { View } from './view';

type Props = {
  onPressRetry?: () => void;
};

export const ErrorComponent = React.memo(({ onPressRetry }: Props) => {
  return (
    <View className="flex-1 items-center justify-center space-y-3">
      <TouchableOpacity onPress={onPressRetry}>
        <Ionicons
          name="refresh"
          size={48}
          className="text-black dark:text-white"
        />
      </TouchableOpacity>
      <Text className="font-medium">Couldn't load media</Text>
    </View>
  );
});
