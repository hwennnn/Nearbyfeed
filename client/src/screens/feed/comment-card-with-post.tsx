import React from 'react';

import type { CommentWithPost } from '@/api';
import { Text, TimeWidget, View } from '@/ui';
import { Ionicons } from '@/ui/icons/vector-icons';

type Props = CommentWithPost & {
  onPressCard?: () => void;
};

export const CommentCardWithPost = ({
  content,
  createdAt,
  post,
  points,
}: Props) => {
  return (
    <View className="flex-1 space-y-1 rounded-xl bg-white px-4 py-3 dark:bg-black">
      <View className="flex-1 flex-col space-y-1">
        <Text variant="sm" className="font-semibold">
          {post.title}
        </Text>

        <View className="flex-1 flex-row space-x-2">
          <Text className="text-gray-600 dark:text-gray-300" variant="xs">
            {post.locationName}
          </Text>

          <TimeWidget
            variant="xs"
            time={createdAt!}
            className="text-gray-600 dark:text-gray-500"
          />

          <View className="min-w-[58px] flex-row items-center space-x-1">
            <Ionicons
              name="thumbs-up"
              size={12}
              className={'text-primary-400'}
            />

            <Text className={`font-semibold text-primary-400`} variant="xs">
              {points}
            </Text>
          </View>
        </View>

        <Text variant="sm">{content}</Text>
      </View>
    </View>
  );
};
