import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useEffect } from 'react';

import { type Comment } from '@/api';
import { useChildComments } from '@/api/posts/use-child-comments';
import { CommentCard } from '@/screens/feed/comment-card';
import { ErrorComponent, LoadingComponent, View } from '@/ui';

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
    return (
      <View className="flex-1 pl-6 pr-4">
        <CommentCard {...item} isChildComment={true} />
      </View>
    );
  }, []);

  const footer = React.useCallback(() => {
    return <View className="h-[95px] bg-white dark:bg-black" />;
  }, []);

  if (isLoading) {
    return <LoadingComponent />;
  }

  if (isError) {
    return <ErrorComponent onPressRetry={refetch} />;
  }
  const allComments = data?.pages.flatMap((page) => page.comments) ?? [];

  const handleEndReached = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  return (
    <View className="mt-2 min-h-[2px] flex-1 bg-neutral-100 dark:bg-charcoal-900">
      <FlashList
        refreshing={false}
        data={allComments}
        renderItem={renderItem}
        keyExtractor={(_, index) => `item-${index}`}
        estimatedItemSize={50}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={footer}
      />
    </View>
  );
};
