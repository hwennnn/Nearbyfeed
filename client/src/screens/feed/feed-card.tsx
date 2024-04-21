import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';

import type { Post } from '@/api';
import { useVotePost } from '@/api/posts/use-vote-post';
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
    <TouchableOpacity
      className="m-2 block overflow-hidden rounded-xl bg-neutral-200 p-2 shadow-xl dark:bg-charcoal-900"
      onPress={onPress}
    >
      <View className="flex-1 space-y-3">
        <Text variant="md" numberOfLines={2} className="font-bold">
          {`${title}`}
        </Text>

        {image !== null && (
          <>
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
          </>
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
              <View className="flex-row items-center space-x-[2px]">
                <Pressable onPress={() => handleVote(isLiked ? 0 : 1)}>
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={16}
                    className={isLiked ? 'text-primary-400' : iconColor}
                  />
                </Pressable>

                <Text
                  className={
                    isLiked
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

                <TimeWidget
                  className="text-gray-600 dark:text-gray-300"
                  variant="sm"
                  time={createdAt!}
                />
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
