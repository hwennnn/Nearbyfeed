import React from 'react';

import type { Post } from '@/api';
import { Pressable, Text, View } from '@/ui';

type Props = Post & { onPress?: () => void };

export const Card = ({ id, title, content, locationName, onPress }: Props) => {
  return (
    <Pressable
      className="m-2 block overflow-hidden rounded-xl bg-neutral-200 p-2 shadow-xl dark:bg-charcoal-900"
      onPress={onPress}
    >
      {/* <Image
        className="h-56 w-full object-cover "
        source={{
          uri: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?ixlib=rb-1.2.1&ixid=MnwxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
        }}
      /> */}

      <View>
        <Text variant="md" numberOfLines={1} className="font-bold">
          {`${id}. ${title}`}
        </Text>

        <Text variant="xs" numberOfLines={3}>
          {content}
        </Text>

        <Text variant="xs" numberOfLines={3}>
          {locationName}
        </Text>
      </View>
    </Pressable>
  );
};
