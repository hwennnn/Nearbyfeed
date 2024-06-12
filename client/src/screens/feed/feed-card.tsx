import { useNavigation } from '@react-navigation/native';
import React from 'react';

import type { Post } from '@/api';
import { useVotePost } from '@/api/posts/use-vote-post';
import type { RootNavigatorProp } from '@/navigation';
import { LocationCard } from '@/screens/feed/location-card';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TimeWidget,
  View,
} from '@/ui';
import { Ionicons } from '@/ui/icons/vector-icons';
import { ImageCarousel } from '@/ui/image-carousel';
import { promptSignIn } from '@/utils/auth-utils';
import { getInitials } from '@/utils/get-initials';
import { onShare, POST_SHARE_MESSAGE } from '@/utils/share-utils';

import { PollCard } from './poll-card';

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
  images,
  createdAt,
  commentsCount,
  poll,
  location,
}: Props) => {
  const { navigate } = useNavigation<RootNavigatorProp>();

  const [imageCarouselIndex, setImageCarouselIndex] = React.useState(0);

  const [imageModalIndex, setImageModalIndex] = React.useState<
    number | undefined
  >(undefined);

  const isLiked = like !== undefined && like.value === 1;

  const { mutate } = useVotePost();

  const handleVote = (voteValue: number) => {
    if (isOptimistic === true) return;

    const shouldProceed = promptSignIn(() => {
      navigate('Auth', {
        screen: 'AuthOnboarding',
        params: {
          isCloseButton: true,
        },
      });
    });

    if (!shouldProceed) return;

    let value = voteValue === like?.value ? 0 : voteValue;

    mutate({
      value: value,
      postId: id,
    });
  };

  return (
    <Pressable
      className="block overflow-hidden bg-white p-4 dark:bg-charcoal-900"
      onPress={onPress}
    >
      <View className="flex-1 space-y-3">
        <View className="flex-row items-center space-x-2">
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

        <Text variant="md" numberOfLines={2} className="font-medium">
          {title}
        </Text>

        {content !== null && content !== undefined && content.length > 0 && (
          <Text variant="sm" numberOfLines={3}>
            {content}
          </Text>
        )}

        {images !== null && images !== undefined && images.length > 0 && (
          <View className="flex-1">
            <ImageCarousel
              images={images}
              imageCarouselIndex={imageCarouselIndex}
              imageModalIndex={imageModalIndex}
              setImageCarouselIndex={setImageCarouselIndex}
              setImageModalIndex={setImageModalIndex}
            />
          </View>
        )}

        {poll !== null && poll !== undefined && (
          <PollCard poll={poll} isPreview={true} />
        )}

        {location !== null && location !== undefined && (
          <LocationCard location={location} />
        )}

        <View className="flex-row justify-between px-10 pt-2">
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

        {isOptimistic === true && (
          <View className="flex-row justify-center space-x-2">
            <Text>Creating feed....</Text>

            <ActivityIndicator />
          </View>
        )}
      </View>
    </Pressable>
  );
};
