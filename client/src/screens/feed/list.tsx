import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';

import type { Post } from '@/api';
import { usePosts } from '@/api';
import { EmptyList, Text, View } from '@/ui';
import { retrieveCurrentPosition } from '@/utils/geolocation-utils';

import { Card } from './card';

export const Feed = () => {
  const [longitude, setLongitude] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [distance, setDistance] = useState(200);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = usePosts({
    variables: {
      distance,
      latitude,
      longitude,
      take: 15,
    },
    enabled: latitude !== null && longitude !== null,
  });

  const { navigate } = useNavigation();

  const updateLocation = async (): Promise<void> => {
    const location = await retrieveCurrentPosition();

    if (location !== null) {
      setLatitude(location.latitude);
      setLongitude(location.longitude);
    }
  };

  useEffect(() => {
    updateLocation();
  }, []);

  const handleRefresh = async () => {
    await updateLocation();
    refetch();

    setRefreshing(false);
  };

  const renderItem = React.useCallback(
    ({ item }: { item: Post }) => (
      <Card {...item} onPress={() => navigate('Post', { post: item })} />
    ),
    [navigate]
  );

  if (isError) {
    return (
      <View>
        <Text> Error Loading data </Text>
      </View>
    );
  }

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  const handleEndReached = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  return (
    <View className="flex-1 ">
      <FlashList
        data={allPosts}
        renderItem={renderItem}
        keyExtractor={(_, index) => `item-${index}`}
        ListEmptyComponent={<EmptyList isLoading={isLoading} />}
        estimatedItemSize={300}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
};
