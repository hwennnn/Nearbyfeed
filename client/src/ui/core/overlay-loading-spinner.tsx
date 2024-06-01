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
      <View className="absolute inset-0 h-full w-full items-center justify-center bg-black opacity-75">
        <View className="flex-col space-y-3 rounded-sm p-6">
          <ActivityIndicator size="large" color="white" />
          {loadingText && (
            <Text className="font-normal text-gray-100" variant="sm">
              {loadingText}
            </Text>
          )}
        </View>
      </View>
    );

  return null;
};
