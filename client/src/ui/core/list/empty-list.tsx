import { useNavigation } from '@react-navigation/native';
import React from 'react';

import type { RootNavigatorProp } from '@/navigation';

import { NoData } from '../../icons';
import { Text } from '../text';
import { TouchableOpacity } from '../touchable-opacity';
import { View } from '../view';

export const EmptyList = React.memo(() => {
  const { navigate } = useNavigation<RootNavigatorProp>();

  return (
    <View className="min-h-[400px] flex-1 items-center justify-center px-10">
      <View className="items-center">
        <NoData />
        <Text className="pt-4 text-center">
          There are no feeds available nearby your current location.
        </Text>
        <TouchableOpacity onPress={() => navigate('AddFeed')}>
          <Text className="pt-2 text-primary-400">
            Be the first one to create a feed!
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});
