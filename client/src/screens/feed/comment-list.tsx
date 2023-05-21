import { FlashList } from '@shopify/flash-list';
import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl } from 'react-native';

import type { Comment } from '@/api';
import { useComments } from '@/api/posts/use-comments';
import { CommentCard } from '@/screens/feed/comment-card';
import { Text, View } from '@/ui';

type Props = { postId: number };

export const CommentList = ({ postId }: Props) => {
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useComments({
    variables: { postId, take: 15 },
  });

  const handleRefresh = async () => {
    refetch();

    setRefreshing(false);
  };

  const renderItem = React.useCallback(
    ({ item }: { item: Comment }) => <CommentCard {...item} />,
    []
  );

  if (isLoading) {
    return (
      <View className="flex-1  justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <View>
        <Text> Error Loading data </Text>
      </View>
    );
  }

  const allComments = data?.pages.flatMap((page) => page.comments) ?? [];

  const handleEndReached = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  return (
    <View className="mt-8 flex-1">
      <Text variant="xl" className="">
        Comments
      </Text>

      <FlashList
        data={allComments}
        renderItem={renderItem}
        keyExtractor={(_, index) => `item-${index}`}
        // ListEmptyComponent={<ActivityIndicator />}
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
