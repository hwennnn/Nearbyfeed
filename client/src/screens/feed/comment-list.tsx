import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

import { type Comment } from '@/api';
import { useComments } from '@/api/posts/use-comments';
import { setPostDetails, usePostDetails } from '@/core/posts/post-details';
import { CommentCard } from '@/screens/feed/comment-card';
import { Pressable, Text, View } from '@/ui';
import Divider from '@/ui/core/divider';
import { Ionicons } from '@/ui/icons/ionicons';

type Props = { postId: number; onRefetchDone: () => void; refreshing: boolean };

export const CommentList = ({ postId, refreshing, onRefetchDone }: Props) => {
  const postDetails = usePostDetails().postDetails!;

  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useComments({
    variables: { postId, sort: postDetails.commentsSort },
  });

  const onRefetch = useCallback(() => {
    if (refreshing) {
      refetch().then(() => onRefetchDone());
    }
  }, [onRefetchDone, refetch, refreshing]);

  useEffect(() => {
    onRefetch();
  }, [onRefetch]);

  const renderItem = React.useCallback(
    ({ item }: { item: Comment }) => <CommentCard {...item} />,
    []
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center">
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

  const toggleSort = () => {
    setPostDetails({
      commentsSort: 'oldest',
    });
  };

  return (
    <View className="flex-1">
      <View className="flex-1">
        <Divider />
        <View className="mx-4 flex-row items-center justify-between py-2">
          <Pressable onPress={toggleSort}>
            <View className="flex-row items-center space-x-1">
              <Text variant="sm" className="font-semibold">
                {postDetails.commentsSort === 'oldest' ? 'Oldest' : 'Newest'}
              </Text>
              <Ionicons name="chevron-down-outline" size={20} color="white" />
            </View>
          </Pressable>
        </View>
        <Divider />
      </View>

      <View className="min-h-[2px] flex-1">
        <FlashList
          ItemSeparatorComponent={Divider}
          refreshing={false}
          data={allComments}
          renderItem={renderItem}
          keyExtractor={(_, index) => `item-${index}`}
          estimatedItemSize={150}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
        />
      </View>
    </View>
  );
};
