import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useState } from 'react';
import { RefreshControl } from 'react-native';

import type { Post } from '@/api';
import { usePosts } from '@/api';
import type { FeedNavigatorProp } from '@/navigation/feed-navigator';
import { EmptyList, Text, View } from '@/ui';

import { Card } from './card';

type Props = {
  longitude: number;
  latitude: number;
  distance: number;
  refreshCallback: () => Promise<void>;
};

export const FeedList = ({
  longitude,
  latitude,
  distance,
  refreshCallback,
}: Props) => {
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
    },
  });

  const { navigate } = useNavigation<FeedNavigatorProp>();

  const handleRefresh = async () => {
    await refreshCallback();
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
