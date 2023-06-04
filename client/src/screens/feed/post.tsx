import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';

import type { FeedStackParamList } from '@/navigation/feed-navigator';
import { CommentList } from '@/screens/feed/comment-list';
import { Image, Text, View } from '@/ui';
import { Ionicons } from '@/ui/icons/ionicons';
import { getInitials } from '@/utils/get-initials';
import { timeUtils } from '@/utils/time-utils';

type Props = RouteProp<FeedStackParamList, 'Post'>;

export const Post = () => {
  const { params } = useRoute<Props>();
  const { post } = params;
  const {
    title,
    content,
    author,
    updoot,

    points,
    locationName,
    createdAt,
  } = post;

  const { colorScheme } = useColorScheme();

  const iconColor =
    colorScheme === 'dark' ? 'text-neutral-400' : 'text-neutral-500';

  const isUpvoted = updoot !== undefined && updoot.value === 1;
  const isDownvoted = updoot !== undefined && updoot.value === -1;

  return (
    <View className="flex-1 space-y-3 px-4 pt-2">
      <Text variant="h2">{title}</Text>

      {post.content !== null && post.content !== undefined && (
        <Text variant="md">{content} </Text>
      )}

      <View className="flex-row items-center space-x-2">
        <View className="h-[24px] w-[24px] items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
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
              className="h-[24px] w-[24px] rounded-full"
            />
          )}
        </View>

        <Text variant="sm" numberOfLines={3}>
          {author?.username ?? ''}
        </Text>
      </View>

      <View className="flex-row items-center space-x-2">
        <View className="flex-row items-center">
          <Ionicons
            name={isDownvoted ? 'ios-arrow-down' : 'ios-arrow-up'}
            size={16}
            className={
              isDownvoted
                ? 'text-purple-500'
                : isUpvoted
                ? 'text-primary-400'
                : iconColor
            }
          />

          <Text
            className={
              isDownvoted
                ? 'text-purple-500'
                : isUpvoted
                ? 'text-primary-400'
                : 'text-gray-600 dark:text-gray-300'
            }
            variant="sm"
          >
            {points}
          </Text>
        </View>

        <View className="flex-row items-center space-x-[2px]">
          <Ionicons name="time" size={16} className={iconColor} />

          <Text className="text-gray-600 dark:text-gray-300" variant="sm">
            {timeUtils.formatCreatedTime(new Date(createdAt!))}
          </Text>
        </View>

        <View className="flex-row items-center space-x-[2px]">
          <Ionicons name="location-sharp" size={16} className={iconColor} />

          <Text className="text-gray-600 dark:text-gray-300" variant="sm">
            {locationName}
          </Text>
        </View>
      </View>

      <CommentList postId={post.id} />
    </View>
  );
};
