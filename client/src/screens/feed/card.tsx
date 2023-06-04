import { useColorScheme } from 'nativewind';
import React from 'react';

import type { Post } from '@/api';
import { useVotePost } from '@/api/posts/use-vote-post';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from '@/ui';
import { Ionicons } from '@/ui/icons/ionicons';
import { getInitials } from '@/utils/get-initials';
import { timeUtils } from '@/utils/time-utils';

type Props = Post & { onPress?: () => void };

export const Card = ({
  id,
  title,
  content,
  locationName,
  author,
  onPress,
  points,
  updoot,
  isOptimistic,
  image,
  createdAt,
}: Props) => {
  const { colorScheme } = useColorScheme();

  const iconColor =
    colorScheme === 'dark' ? 'text-neutral-400' : 'text-neutral-500';

  const isUpvoted = updoot !== undefined && updoot.value === 1;
  const isDownvoted = updoot !== undefined && updoot.value === -1;

  const { mutate } = useVotePost();

  const handleVote = (voteValue: number) => {
    if (isOptimistic === true) return;

    let value = voteValue === updoot?.value ? 0 : voteValue;

    mutate({
      value: value,
      postId: id.toString(),
    });
  };

  return (
    <TouchableOpacity
      className="m-2 block overflow-hidden rounded-xl bg-neutral-200 p-2 shadow-xl dark:bg-charcoal-900"
      onPress={onPress}
    >
      <View className="flex-1 space-y-3">
        <Text variant="md" numberOfLines={2} className="font-bold">
          {`${title}`}
        </Text>

        {image !== null && (
          <Image
            className="h-56 w-full object-cover"
            source={{
              uri: image,
            }}
          />
        )}

        {content !== null && content !== undefined && content.length > 0 && (
          <Text variant="sm" numberOfLines={4}>
            {content}
          </Text>
        )}

        <View className="flex-row justify-between">
          <View className="flex-col space-y-2">
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
                <Pressable onPress={() => handleVote(1)}>
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
                </Pressable>

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
                <Ionicons
                  name="location-sharp"
                  size={16}
                  className={iconColor}
                />

                <Text className="text-gray-600 dark:text-gray-300" variant="sm">
                  {locationName}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row space-x-2">
            <Pressable
              onPress={() => handleVote(1)}
              className={`h-[32px] w-[32px] rounded-md p-1 ${
                isUpvoted ? 'bg-primary-400' : 'bg-inherit'
              }`}
            >
              <Ionicons
                name="ios-arrow-up"
                size={24}
                className={isUpvoted ? 'text-white' : iconColor}
              />
            </Pressable>
            <Pressable
              onPress={() => handleVote(-1)}
              className={`h-[32px] w-[32px] rounded-md p-1 ${
                isDownvoted ? 'bg-purple-500' : 'bg-inherit'
              }`}
            >
              <Ionicons
                name="ios-arrow-down"
                size={24}
                className={isDownvoted ? 'text-white' : iconColor}
              />
            </Pressable>
          </View>
        </View>

        {isOptimistic === true && (
          <View className="flex-row space-x-2">
            <Text>Creating post....</Text>

            <ActivityIndicator />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
