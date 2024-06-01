import React from 'react';
import { ActivityIndicator } from 'react-native';

import { View } from './view';

export const LoadingComponent = React.memo(() => {
  return (
    <View className="min-h-[400px] flex-1 items-center justify-center px-10">
      <ActivityIndicator />
    </View>
  );
});
