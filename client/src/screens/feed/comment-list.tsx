import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { FlashList } from '@shopify/flash-list';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, RefreshControl } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/Octicons';

import type { Comment } from '@/api';
import { useAddComment } from '@/api/posts/use-add-comment';
import { useComments } from '@/api/posts/use-comments';
import { CommentCard } from '@/screens/feed/comment-card';
import { ControlledInput, Pressable, showErrorMessage, Text, View } from '@/ui';

type Props = { postId: number };

export class CreateCommentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  content: string;
}

const resolver = classValidatorResolver(CreateCommentDto);

export const CommentList = ({ postId }: Props) => {
  const [refreshing, setRefreshing] = useState(false);

  const [sortDesc, setSortDesc] = useState(true);

  const { control, handleSubmit, reset } = useForm<CreateCommentDto>({
    reValidateMode: 'onSubmit',
    resolver,
  });

  const { mutate: addComment, isLoading: isCreateCommentLoading } =
    useAddComment();

  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useComments({
    variables: { postId, sort: sortDesc ? 'latest' : 'oldest' },
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

  const toggleSort = () => {
    setSortDesc((prev) => !prev);
  };

  const onSubmitComment = (dto: CreateCommentDto) => {
    reset();

    addComment(
      { ...dto, postId },
      {
        onSuccess: () => {
          showMessage({
            message: 'Comment added successfully',
            type: 'success',
          });
        },
        onError: () => {
          showErrorMessage('Error adding comment');
        },
      }
    );
  };

  return (
    <View className="mt-4 flex-1">
      <View className="flex-row items-center justify-between">
        <Text variant="xl" className="">
          Comments
        </Text>

        <View className="flex-row items-center space-x-2">
          <Text variant="md" className="">
            Sort
          </Text>
          <Pressable onPress={toggleSort} disabled={isCreateCommentLoading}>
            <Icon
              name={sortDesc ? 'sort-desc' : 'sort-asc'}
              size={24}
              color="white"
            />
          </Pressable>
        </View>
      </View>

      <View className="flex-row items-center justify-center space-x-2">
        <View className="flex-1">
          <ControlledInput
            name="content"
            placeholder="Write a comment"
            control={control}
            rightIcon={
              <Pressable onPress={handleSubmit(onSubmitComment)}>
                <Ionicons name="ios-send" size={24} color="white" />
              </Pressable>
            }
            multiline
          />
        </View>
      </View>

      <FlashList
        data={allComments}
        renderItem={renderItem}
        keyExtractor={(_, index) => `item-${index}`}
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
