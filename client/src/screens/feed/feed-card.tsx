import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';

import type { Post } from '@/api';
import { useVotePost } from '@/api/posts/use-vote-post';
import { PollCard } from '@/screens/feed/poll-card';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TimeWidget,
  TouchableOpacity,
  View,
} from '@/ui';
import { Ionicons } from '@/ui/icons/ionicons';
import { ImageViewer } from '@/ui/image-viewer';
import { getInitials } from '@/utils/get-initials';

type Props = Post & { onPress?: () => void };

export const FeedCard = ({
  id,
  title,
  content,
  locationName,
  author,
  onPress,
  points,
  like,
  isOptimistic,
  image,
  createdAt,
  commentsCount,
  poll,
}: Props) => {
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const { colorScheme } = useColorScheme();

  const iconColor =
    colorScheme === 'dark' ? 'text-neutral-400' : 'text-neutral-500';

  const isLiked = like !== undefined && like.value === 1;

  const { mutate } = useVotePost();

  const handleVote = (voteValue: number) => {
    if (isOptimistic === true) return;

    let value = voteValue === like?.value ? 0 : voteValue;

    mutate({
      value: value,
      postId: id.toString(),
    });
  };

  return (
    <Pressable
      className="block overflow-hidden bg-neutral-200 p-4 shadow-xl dark:bg-black"
      onPress={onPress}
    >
      <View className="flex-1 space-y-3">
        <View className="flex-row items-center space-x-2">
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

            <Text className="text-gray-600 dark:text-gray-300" variant="xs">
              {locationName}
            </Text>
          </View>
        </View>

        <Text variant="md" numberOfLines={2} className="font-semibold">
          {`${title}`}
        </Text>

        {content !== null && content !== undefined && content.length > 0 && (
          <Text variant="sm" numberOfLines={4}>
            {content}
          </Text>
        )}

        {image !== null && (
          <View>
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

        {poll !== null && <PollCard poll={poll} />}

        <View className="flex-row justify-between px-10 pt-2">
          <Pressable onPress={() => handleVote(isLiked ? 0 : 1)}>
            <View className="flex-row items-center space-x-1">
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={18}
                className={isLiked ? 'text-primary-400' : iconColor}
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
            <Ionicons name="chatbox-outline" size={16} className={iconColor} />

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

        {isOptimistic === true && (
          <View className="flex-row space-x-2">
            <Text>Creating post....</Text>

            <ActivityIndicator />
          </View>
        )}
      </View>
    </Pressable>
  );
};
