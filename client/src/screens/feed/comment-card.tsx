import React from 'react';

import type { Comment } from '@/api';
import { Pressable, Text, View } from '@/ui';

type Props = Comment;

export const CommentCard = ({ content, id }: Props) => {
  return (
    <Pressable className="my-2 block overflow-hidden rounded-xl bg-neutral-200 p-2 shadow-xl dark:bg-charcoal-900">
      <View>
        <Text variant="sm">{`${id}. ${content}`}</Text>
      </View>
    </Pressable>
  );
};
