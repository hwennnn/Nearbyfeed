import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import * as React from 'react';

import type { FeedStackParamList } from '@/navigation/feed-navigator';
import { CommentList } from '@/screens/feed/comment-list';
import { Text, View } from '@/ui';

type Props = RouteProp<FeedStackParamList, 'Post'>;

export const Post = () => {
  const { params } = useRoute<Props>();
  const { post } = params;

  return (
    <View className="flex-1 space-y-2 px-4">
      <Text variant="h2">{post.title}</Text>
      <Text variant="md">{post.content} </Text>

      <CommentList postId={post.id} />
    </View>
  );
};
