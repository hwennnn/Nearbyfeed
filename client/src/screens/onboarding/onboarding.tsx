import React from 'react';

import { useIsFirstTime } from '@/core/hooks';
import { Button, SafeAreaView, Text, View } from '@/ui';
import { Layout } from '@/ui/core/layout';

import { Cover } from './cover';
export const Onboarding = () => {
  const [_, setIsFirstTime] = useIsFirstTime();

  return (
    <Layout className="flex h-full items-center justify-center">
      <View className="w-full flex-1">
        <Cover />
      </View>
      <View className="justify-end ">
        <Text className="my-3 text-center text-5xl font-bold">NearbyFeed</Text>
        <Text className="mb-2 text-center text-lg text-gray-600">
          Discover and connect with your local community through real-time
          updates and engaging posts.
        </Text>

        <Text className="my-1 pt-6 text-left text-lg">
          🌍 Discover Local Feeds in Real-Time
        </Text>
        <Text className="my-1 text-left text-lg">
          ⚡️ Seamless Enhanced Engagement
        </Text>
        <Text className="my-1 text-left text-lg">
          🚀 Streamlined and Efficient Platform
        </Text>
      </View>
      <SafeAreaView className="mt-6">
        <Button
          label="Let's Get Started "
          onPress={() => {
            setIsFirstTime(false);
          }}
        />
      </SafeAreaView>
    </Layout>
  );
};
