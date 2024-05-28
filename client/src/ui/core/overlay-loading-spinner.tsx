import React from 'react';

import { useAppLoading } from '@/core/loading';
import { Text } from '@/ui/core/text';

import { ActivityIndicator } from './activity-indicator';
import { View } from './view';

export const OverlayLoadingSpinner = () => {
  const isLoading = useAppLoading((state) => state.isAppLoading);
  const loadingText = useAppLoading((state) => state.loadingText);

  if (isLoading)
    return (
      <View className="absolute inset-0 items-center justify-center bg-[#F5FCFF88]">
        <View className="space-y-3 rounded-sm bg-gray-400 p-6">
          <ActivityIndicator color="white" size="large" />
          {loadingText && (
            <Text className="text-gray-600 dark:text-gray-300" variant="sm">
              {loadingText}
            </Text>
          )}
        </View>
      </View>
    );

  return null;
};
