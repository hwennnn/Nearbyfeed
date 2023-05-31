import React from 'react';

import type { Post } from '@/api';
import { useVotePost } from '@/api/posts/use-vote-post';
import { ActivityIndicator, Image, Pressable, Text, View } from '@/ui';

type Props = Post & { onPress?: () => void };

export const Card = ({
  id,
  title,
  content,
  locationName,
  author,
  onPress,
  points,
  updoots,
  isOptimistic,
  image,
}: Props) => {
  let voteStatus =
    updoots !== undefined && updoots.length > 0 ? updoots[0] : undefined;

  const isUpvoted = voteStatus !== undefined && voteStatus.value === 1;
  const isDownvoted = voteStatus !== undefined && voteStatus.value === -1;

  const { mutate } = useVotePost();

  const handleVote = (voteValue: number) => {
    if (isOptimistic === true) return;

    let value = voteValue === voteStatus?.value ? 0 : voteValue;

    mutate({
      value: value,
      postId: id.toString(),
    });
  };

  return (
    <Pressable
      className="m-2 block overflow-hidden rounded-xl bg-neutral-200 p-2 shadow-xl dark:bg-charcoal-900"
      onPress={onPress}
    >
      <View className="flex space-y-2">
        <Text variant="md" numberOfLines={1} className="font-bold">
          {`${id}. ${title}`}
        </Text>

        {image !== null && (
          <Image
            className="h-56 w-full object-cover "
            source={{
              uri: image,
            }}
          />
        )}

        <Text variant="xs" numberOfLines={3}>
          {content}
        </Text>

        <Text variant="xs" numberOfLines={3}>
          {author?.username ?? ''} {locationName}
        </Text>

        <Text>{points}</Text>

        <Pressable onPress={() => handleVote(1)}>
          <Text className={isUpvoted ? 'text-primary-400' : ''}>Upvote</Text>
        </Pressable>
        <Pressable onPress={() => handleVote(-1)}>
          <Text className={isDownvoted ? 'text-primary-400' : ''}>
            Downvote
          </Text>
        </Pressable>

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
