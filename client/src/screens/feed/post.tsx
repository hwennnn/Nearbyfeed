import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { RefreshControl } from 'react-native';

import type { FeedStackParamList } from '@/navigation/feed-navigator';
import { CommentList } from '@/screens/feed/comment-list';
import { Image, ScrollView, Text, View } from '@/ui';
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
    image,
    points,
    locationName,
    createdAt,
  } = post;

  const { colorScheme } = useColorScheme();

  const isDark = colorScheme === 'dark';

  const [refreshing, setRefreshing] = React.useState(false);

  const iconColor = isDark ? 'text-neutral-400' : 'text-neutral-500';

  const isUpvoted = updoot !== undefined && updoot.value === 1;
  const isDownvoted = updoot !== undefined && updoot.value === -1;

  const onRefresh = async () => {
    setRefreshing(true);
  };

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="flex-1 space-y-3 px-4 pt-2">
        <Text variant="h3">{title}</Text>

        {image !== null && (
          <Image
            className="h-56 w-full object-cover"
            source={{
              uri: image,
            }}
          />
        )}

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

        <CommentList
          postId={post.id}
          refreshing={refreshing}
          onRefetchDone={() => setRefreshing(false)}
        />
      </View>
    </ScrollView>
  );
};
