import { FlashList } from '@shopify/flash-list';
import React, { useCallback } from 'react';

import type { CommentWithPost } from '@/api';
import { useMyComments } from '@/api/users';
import { CommentCardWithPost } from '@/screens/feed/comment-card-with-post';
import { LoadingComponent, Text, View } from '@/ui';
import Divider from '@/ui/core/divider';

export const MyComments = () => {
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMyComments({
    variables: {},
  });

  const renderItem = useCallback(
    ({ item }: { item: CommentWithPost }) => {
      return (
        <View>
          <CommentCardWithPost {...item} />

          <Divider />
        </View>
      );
    },

    []
  );

  if (isLoading) {
    return <LoadingComponent />;
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
    <View className="min-h-[2px] flex-1">
      <FlashList
        data={allComments}
        renderItem={renderItem}
        estimatedItemSize={100}
        keyExtractor={(_, index) => `item-${index}`}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
};
