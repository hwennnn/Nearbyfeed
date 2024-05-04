import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

import { type Comment } from '@/api';
import { useComments } from '@/api/posts/use-comments';
import type { CommentsSort } from '@/core/comments';
import { setCommentsQueryKey, useCommentKeys } from '@/core/comments';
import type { RootNavigatorProp } from '@/navigation';
import { CommentCard } from '@/screens/feed/comment-card';
import { Pressable, Text, View } from '@/ui';
import Divider from '@/ui/core/divider';
import { Ionicons } from '@/ui/icons/ionicons';

type Props = { postId: number; onRefetchDone: () => void; refreshing: boolean };

export const CommentList = ({ postId, refreshing, onRefetchDone }: Props) => {
  const sort = useCommentKeys().commentsQueryKey!.sort;

  const { navigate } = useNavigation<RootNavigatorProp>();

  const { showActionSheetWithOptions } = useActionSheet();

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

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
        <View>
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
        </View>
      );
    },

    [navigate, postId]
  );

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

  const onPressActionSheet = () => {
    const options = ['Newest', 'Oldest', 'Top', 'Cancel'];
    const values = ['latest', 'oldest', 'top'];

    const cancelButtonIndex = 3;

    showActionSheetWithOptions(
      {
        userInterfaceStyle: isDark ? 'dark' : 'light',
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
              <Ionicons name="chevron-down-outline" size={20} color="white" />
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
