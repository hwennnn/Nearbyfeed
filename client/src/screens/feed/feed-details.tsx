import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { RefreshControl } from 'react-native';

import type { InfinitePosts } from '@/api';
import { usePost, useVotePost } from '@/api';
import { usePostKeys } from '@/core/posts';
import type { RootStackParamList } from '@/navigation';
import { CommentComposer } from '@/screens/feed/comment-composer';
import { CommentList } from '@/screens/feed/comment-list';
import {
  Image,
  NoData,
  Pressable,
  ScrollView,
  Text,
  TimeWidget,
  TouchableOpacity,
  View,
} from '@/ui';
import { Ionicons } from '@/ui/icons/ionicons';
import { ImageViewer } from '@/ui/image-viewer';
import { getInitials } from '@/utils/get-initials';

type Props = RouteProp<RootStackParamList, 'FeedDetails'>;

export const FeedDetails = () => {
  const { params } = useRoute<Props>();
  const { postId } = params;

  const queryClient = useQueryClient();

  const { data: post, isLoading } = usePost({
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
  });

  const { mutate } = useVotePost();

  const [imageModalVisible, setImageModalVisible] = React.useState(false);

  const { colorScheme } = useColorScheme();

  const isDark = colorScheme === 'dark';

  const [refreshing, setRefreshing] = React.useState(false);

  const iconColor = isDark ? 'text-neutral-400' : 'text-neutral-500';

  const onRefresh = async () => {
    setRefreshing(true);
  };

  if (isLoading || post === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <NoData />
      </View>
    );
  }

  const {
    id,
    title,
    content,
    author,
    like,
    image,
    points,
    locationName,
    createdAt,
    commentsCount,
  } = post;

  const isLiked = like !== undefined && like.value === 1;

  const handleVote = (voteValue: number) => {
    let value = voteValue === like?.value ? 0 : voteValue;

    mutate({
      value: value,
      postId: id.toString(),
    });
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="mb-24 flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-1 space-y-3 bg-charcoal-900 pt-2">
          <View className="flex-row items-center space-x-2 px-4">
            <View className="h-[36px] w-[36px] items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
              {author?.image === null && (
                <Text
                  className="font-medium text-gray-600 dark:text-gray-300"
                  variant="xs"
                >
                  {getInitials(author.username)}
                </Text>
              )}
              {author?.image !== null && (
                <Image
                  source={{ uri: author?.image }}
                  className="h-[36px] w-[36px] rounded-full"
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

              <Text className="text-gray-600 dark:text-gray-300" variant="sm">
                {locationName}
              </Text>
            </View>
          </View>

          <Text className="px-4" variant="h3">
            {title}
          </Text>

          {post.content !== null && post.content !== undefined && (
            <Text variant="sm" className="px-4">
              {content}
            </Text>
          )}

          {image !== null && (
            <View className="px-4">
              <TouchableOpacity
                onPress={() => setImageModalVisible(true)}
                className="mt-1"
              >
                <Image
                  className="h-56 w-full object-cover"
                  source={{
                    uri: image,
                  }}
                />
              </TouchableOpacity>
              <ImageViewer
                images={[
                  {
                    uri: image!,
                  },
                ]}
                visible={imageModalVisible}
                onClose={() => setImageModalVisible(false)}
              />
            </View>
          )}

          <View className="flex-row justify-between px-10 py-4">
            <View className="flex-row items-center space-x-1">
              <Pressable onPress={() => handleVote(isLiked ? 0 : 1)}>
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={18}
                  className={isLiked ? 'text-primary-400' : iconColor}
                />
              </Pressable>

              <Text
                className={`font-semibold
                  ${
                    isLiked
                      ? 'text-primary-400'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                variant="sm"
              >
                {points}
              </Text>
            </View>

            <View className="flex-row items-center space-x-1">
              <Ionicons
                name="chatbox-outline"
                size={16}
                className={iconColor}
              />

              <Text
                className="font-semibold text-gray-600 dark:text-gray-300"
                variant="sm"
              >
                {commentsCount}
              </Text>
            </View>

            <View className="flex-row items-center space-x-1">
              <Ionicons name="share-outline" size={16} className={iconColor} />

              <Text
                className="font-semibold text-gray-600 dark:text-gray-300"
                variant="sm"
              >
                Share
              </Text>
            </View>
          </View>

          <CommentList
            postId={post.id}
            refreshing={refreshing}
            onRefetchDone={() => setRefreshing(false)}
          />
        </View>
      </ScrollView>

      <View className="absolute bottom-0 z-50 h-fit w-full bg-charcoal-900 px-4">
        <CommentComposer postId={id} />
      </View>
    </View>
  );
};
