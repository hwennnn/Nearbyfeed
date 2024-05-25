import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { RefreshControl } from 'react-native';

import type { Post } from '@/api';
import { useMyPosts } from '@/api/users';
import type { RootNavigatorProp } from '@/navigation/root-navigator';
import { FeedCard } from '@/screens';
import { colors, EmptyList, Text, View } from '@/ui';
import Divider from '@/ui/core/divider';

export const MyPosts = () => {
  const [refreshing, setRefreshing] = useState(false);

  const { colorScheme } = useColorScheme();

  const refreshColor =
    colorScheme === 'dark' ? colors.neutral[400] : colors.neutral[500];

  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMyPosts({
    variables: {},
  });

  const { navigate } = useNavigation<RootNavigatorProp>();

  const handleRefresh = async () => {
    refetch();

    setRefreshing(false);
  };

  const renderItem = React.useCallback(
    ({ item }: { item: Post }) => (
      <FeedCard
        {...item}
        onPress={() => {
          if (item.isOptimistic === true) return;
          navigate('FeedDetails', { postId: item.id });
        }}
      />
    ),
    [navigate]
  );

  const footer = React.useCallback(() => {
    return <View className="py-6" />;
  }, []);

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
    <View className="min-h-[2px] flex-1">
      <FlashList
        ItemSeparatorComponent={Divider}
        data={allPosts}
        renderItem={renderItem}
        keyExtractor={(_, index) => `item-${index}`}
        estimatedItemSize={200}
        ListEmptyComponent={<EmptyList isLoading={isLoading} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            title="Pull down to refresh"
            tintColor={refreshColor}
            titleColor={refreshColor}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={footer}
      />
    </View>
  );
};
