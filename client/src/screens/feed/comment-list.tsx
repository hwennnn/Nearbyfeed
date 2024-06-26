import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useEffect } from 'react';

import { type Comment } from '@/api';
import { useComments } from '@/api/comments';
import { useTheme } from '@/core';
import type { CommentsSort } from '@/core/comments';
import { setCommentsQueryKey, useCommentKeys } from '@/core/comments';
import type { RootNavigatorProp } from '@/navigation';
import { CommentCard } from '@/screens/feed/comment-card';
import { ErrorComponent, LoadingComponent, Pressable, Text, View } from '@/ui';
import Divider from '@/ui/core/divider';
import { Ionicons } from '@/ui/icons/vector-icons';

type Props = { postId: number; onRefetchDone: () => void; refreshing: boolean };

export const CommentList = ({ postId, refreshing, onRefetchDone }: Props) => {
  const sort = useCommentKeys().commentsQueryKey!.sort;

  const { navigate } = useNavigation<RootNavigatorProp>();

  const { showActionSheetWithOptions } = useActionSheet();

  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useComments({
    variables: { postId, sort },
  });

  const onRefetch = useCallback(() => {
    if (refreshing) {
      refetch().then(() => onRefetchDone());
    }
  }, [onRefetchDone, refetch, refreshing]);

  useEffect(() => {
    onRefetch();
  }, [onRefetch]);

  const renderItem = useCallback(
    ({ item }: { item: Comment }) => {
      return (
        // put the divider in this manner due to some issues with the rendering after adding new comment
        <>
          <CommentCard
            {...item}
            onPressCard={() =>
              navigate('CommentDetails', {
                commentId: item.id,
                postId: postId,
                repliesCount: item.repliesCount,
              })
            }
          />

          <Divider />
        </>
      );
    },

    [navigate, postId]
  );

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

  const onPressActionSheet = () => {
    const options = ['Newest', 'Oldest', 'Top', 'Cancel'];
    const values = ['latest', 'oldest', 'top'];

    const cancelButtonIndex = 3;

    showActionSheetWithOptions(
      {
        userInterfaceStyle: useTheme.getState().colorScheme,
        options,
        cancelButtonIndex,
        title: 'View Comments Sort',
        destructiveButtonIndex: values.findIndex((value) => value === sort),
      },
      (selectedIndex: number | undefined) => {
        switch (selectedIndex) {
          case undefined:
          case cancelButtonIndex:
            break;

          default:
            setCommentsQueryKey({
              sort: values[selectedIndex] as CommentsSort,
            });
            break;
        }
      }
    );
  };

  return (
    <View className="flex-1">
      <View className="flex-1">
        <Divider />
        <View className="mx-4 flex-row items-center justify-between py-2">
          <Pressable onPress={onPressActionSheet}>
            <View className="flex-row items-center space-x-1">
              <Text variant="sm" className="font-semibold">
                {sort === 'top'
                  ? 'Top'
                  : sort === 'oldest'
                  ? 'Oldest'
                  : 'Newest'}
              </Text>
              <Ionicons
                name="chevron-down-outline"
                size={20}
                className="text-neutral-500 dark:text-neutral-400"
              />
            </View>
          </Pressable>
        </View>
        <Divider />
      </View>

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
    </View>
  );
};
