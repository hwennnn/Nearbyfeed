import React from 'react';

import type { Comment } from '@/api';
import { Image, Text, TimeWidget, View } from '@/ui';
import { getInitials } from '@/utils/get-initials';

type Props = Comment;

export const CommentCard = ({ content, createdAt, author }: Props) => {
  return (
    <View className="space-y-1 rounded-xl bg-charcoal-900 px-4 py-3 shadow-xl">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-start space-x-3">
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

          <View className="flex-1 flex-col space-y-2">
            <View className="flex-col">
              <Text className="font-semibold" variant="sm" numberOfLines={3}>
                {author?.username ?? ''}
              </Text>

              <TimeWidget
                variant="xs"
                time={createdAt!}
                className="text-gray-600 dark:text-gray-500"
              />
            </View>

            <Text variant="sm">{`${content}`}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
