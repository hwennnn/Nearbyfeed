import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

import { type Comment } from '@/api';
import { useChildComments } from '@/api/posts/use-child-comments';
import { CommentCard } from '@/screens/feed/comment-card';
import { Text, View } from '@/ui';

type Props = {
  postId: number;
  commentId: number;
  onRefetchDone: () => void;
  refreshing: boolean;
};

export const ChildCommentList = ({
  postId,
  refreshing,
  onRefetchDone,
  commentId,
}: Props) => {
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useChildComments({
    variables: { postId, commentId },
  });

  const onRefetch = useCallback(() => {
    if (refreshing) {
      refetch().then(() => onRefetchDone());
    }
  }, [onRefetchDone, refetch, refreshing]);

  useEffect(() => {
    onRefetch();
  }, [onRefetch]);

  const renderItem = React.useCallback(({ item }: { item: Comment }) => {
    return <CommentCard {...item} isChildComment={true} />;
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
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
    <View className="mt-2 min-h-[2px] flex-1">
      <FlashList
        refreshing={false}
        data={allComments}
        renderItem={renderItem}
        keyExtractor={(_, index) => `item-${index}`}
        estimatedItemSize={50}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
};
