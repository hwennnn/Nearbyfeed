import React from 'react';

import { useAppLoading } from '@/core/loading';

import { ActivityIndicator } from './activity-indicator';
import { Text } from './text';
import { View } from './view';

export const OverlayLoadingSpinner = () => {
  const isLoading = useAppLoading((state) => state.isAppLoading);
  const loadingText = useAppLoading((state) => state.loadingText);

  if (isLoading)
    return (
      <View className="bg-gray20 absolute inset-0 h-full w-full items-center justify-center opacity-80">
        <View className="flex-col space-y-3 rounded-sm p-6">
          <ActivityIndicator size="large" />
          {loadingText && (
            <Text className="text-gray-300" variant="sm">
              {loadingText}
            </Text>
          )}
        </View>
      </View>
    );

  return null;
};
