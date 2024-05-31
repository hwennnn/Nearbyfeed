import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';
import * as React from 'react';
import { ActivityIndicator, RefreshControl } from 'react-native';

import type { InfinitePosts } from '@/api';
import { usePost, useVotePost } from '@/api';
import { useTheme } from '@/core';
import { usePostKeys } from '@/core/posts';
import type { RootStackParamList } from '@/navigation';
import { CommentComposer } from '@/screens/feed/comment-composer';
import { CommentList } from '@/screens/feed/comment-list';
import { PollCard } from '@/screens/feed/poll-card';
import {
  colors,
  Image,
  Pressable,
  ScrollView,
  Text,
  TimeWidget,
  TouchableOpacity,
  View,
} from '@/ui';
import Divider from '@/ui/core/divider';
import { Layout } from '@/ui/core/layout';
import { Ionicons } from '@/ui/icons/vector-icons';
import { ImageViewer } from '@/ui/image-viewer';
import { getInitials } from '@/utils/get-initials';
import { onShare, POST_SHARE_MESSAGE } from '@/utils/share-utils';

type Props = RouteProp<RootStackParamList, 'FeedDetails'>;

export const FeedDetails = () => {
  const { params } = useRoute<Props>();
  const { postId } = params;

  const queryClient = useQueryClient();

  const {
    data: post,
    isLoading,
    refetch: refetchFeed,
  } = usePost({
    variables: {
      id: postId,
    },
    initialData: () => {
      // Populate initial data from the cache
      const queryKey = ['posts', usePostKeys.getState().postsQueryKey];

      const infinitePosts = queryClient.getQueryData<InfinitePosts>(queryKey);
      if (infinitePosts === undefined) return undefined;

      for (const postsPages of infinitePosts.pages) {
        for (const p of postsPages.posts) {
          if (p.id === postId) return p;
        }
      }

      return undefined;
    },
    onSuccess: (data) => {
      const queryKey = ['posts', usePostKeys.getState().postsQueryKey];

      queryClient.setQueryData<InfinitePosts>(queryKey, (oldData) => {
        if (oldData) {
          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => {
              return produce(page, (draftPage) => {
                const foundIndex = draftPage.posts.findIndex(
                  (p) => p.id === postId
                );

                if (foundIndex !== -1) {
                  draftPage.posts[foundIndex] = {
                    ...draftPage.posts[foundIndex],
                    ...data,
                  };
                }
              });
            }),
          };
        }
        return oldData;
      });
    },
  });

  const { mutate } = useVotePost();

  const [imageModalIndex, setImageModalIndex] = React.useState<
    number | undefined
  >(undefined);

  const [refreshing, setRefreshing] = React.useState(false);

  const isDark = useTheme.use.colorScheme() === 'dark';

  const refreshColor = isDark ? colors.neutral[400] : colors.neutral[500];

  const onRefresh = async () => {
    setRefreshing(true);
    refetchFeed();
  };

  if (isLoading || post === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const {
    id,
    title,
    content,
    author,
    like,
    images,
    points,
    locationName,
    createdAt,
    commentsCount,
    poll,
  } = post;

  const isLiked = like !== undefined && like.value === 1;

  const handleVote = (voteValue: number) => {
    let value = voteValue === like?.value ? 0 : voteValue;

    mutate({
      value: value,
      postId: id,
    });
  };

  return (
    <Layout
      className="flex-1"
      hasHorizontalPadding={false}
      verticalPadding={80}
    >
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            title="Pull down to refresh"
            tintColor={refreshColor}
            titleColor={refreshColor}
          />
        }
      >
        <Pressable className="flex-1 space-y-3 bg-white pt-4 dark:bg-charcoal-900">
          <View className="flex-row items-center space-x-2 px-4">
            <View className="h-[36px] w-[36px] items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600">
              {author?.image === null ? (
                <Text
                  className="font-medium text-gray-600 dark:text-gray-300"
                  variant="xs"
                >
                  {getInitials(author.username)}
                </Text>
              ) : (
                <Image
                  source={{ uri: author?.image }}
                  className="border-1 h-[36px] w-[36px] rounded-full border-solid border-neutral-800"
                />
              )}
            </View>

            <View className="flex-col justify-between">
              <View className="flex-row items-center space-x-2">
                <Text className="font-semibold" variant="sm" numberOfLines={3}>
                  {author?.username ?? ''}
                </Text>

                <TimeWidget
                  className="text-gray-600 dark:text-gray-500"
                  variant="xs"
                  time={createdAt!}
                />
              </View>

              <Text className="text-gray-600 dark:text-gray-300" variant="xs">
                {locationName}
              </Text>
            </View>
          </View>

          <Text className="px-4 font-medium" variant="lg">
            {title}
          </Text>

          {post.content !== null && post.content !== undefined && (
            <Text variant="sm" className="px-4">
              {content}
            </Text>
          )}

          {images !== null && images !== undefined && images.length > 0 && (
            <View className="mt-1 flex-1 flex-row">
              <ScrollView
                showsHorizontalScrollIndicator={false}
                className="flex-1 flex-row space-x-3"
                contentContainerStyle="pl-4"
                horizontal={true}
              >
                {images.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setImageModalIndex(index)}
                    className={`flex-1 ${
                      index === images.length - 1 ? 'pr-12' : ''
                    }`}
                  >
                    <Image
                      className="h-56 w-64 rounded-md object-cover"
                      source={{
                        uri: image,
                      }}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ImageViewer
                images={images.map((url) => ({
                  uri: url,
                }))}
                visible={imageModalIndex !== undefined}
                onClose={() => setImageModalIndex(undefined)}
                imageIndex={imageModalIndex}
              />
            </View>
          )}

          {poll !== null && poll !== undefined && (
            <View className="mx-4 flex-1">
              <PollCard poll={poll} showAllText={true} />
            </View>
          )}

          <View className="flex-row justify-between px-10 pb-4 pt-2">
            <Pressable onPress={() => handleVote(isLiked ? 0 : 1)}>
              <View className="flex-row items-center space-x-1">
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={18}
                  className={
                    isLiked
                      ? 'text-primary-400'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }
                />

                <Text
                  className={`min-w-[28px] font-semibold
                ${
                  isLiked
                    ? 'text-primary-400'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
                  variant="sm"
                >
                  {points > 0 ? points : 'Like'}
                </Text>
              </View>
            </Pressable>

            <View className="flex-row items-center space-x-1">
              <Ionicons
                name="chatbox-outline"
                size={16}
                className="text-neutral-500 dark:text-neutral-400"
              />

              <Text
                className="font-semibold text-gray-600 dark:text-gray-300"
                variant="sm"
              >
                {commentsCount}
              </Text>
            </View>

            <Pressable
              className="flex-row items-center space-x-1"
              onPress={() => onShare(POST_SHARE_MESSAGE)}
            >
              <Ionicons
                name="share-outline"
                size={16}
                className="text-neutral-500 dark:text-neutral-400"
              />

              <Text
                className="font-semibold text-gray-600 dark:text-gray-300"
                variant="sm"
              >
                Share
              </Text>
            </Pressable>
          </View>

          <CommentList
            postId={post.id}
            refreshing={refreshing}
            onRefetchDone={() => setRefreshing(false)}
          />
        </Pressable>
        <View className="h-[95px]" />
      </ScrollView>

      <View className="absolute bottom-0 z-50 h-fit w-full bg-white dark:bg-charcoal-950">
        <Divider />
        <CommentComposer postId={id} />
      </View>
    </Layout>
  );
};
