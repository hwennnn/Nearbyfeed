import { useRoute } from '@react-navigation/native';
import * as React from 'react';

import type { RouteProp } from '@/navigation/types';
import { CommentList } from '@/screens/feed/comment-list';
import { Text, View } from '@/ui';

export const Post = () => {
  const { params } = useRoute<RouteProp<'Post'>>();
  const { post } = params;

  return (
    <View className="flex-1 space-y-2 px-4">
      <Text variant="h2">{post.title}</Text>
      <Text variant="md">{post.content} </Text>

      <CommentList postId={post.id} />
    </View>
  );
};
