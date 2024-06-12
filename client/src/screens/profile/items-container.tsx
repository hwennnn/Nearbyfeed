import React from 'react';

import { Text, View } from '@/ui';

type Props = {
  children: React.ReactNode;
  title?: string;
};

export const ItemsContainer = ({ children, title }: Props) => {
  return (
    <View className="flex-1">
      {title && (
        <Text variant="lg" className="pb-2 pt-4">
          {title}
        </Text>
      )}
      {
        <View className="rounded-md border border-neutral-200 bg-neutral-100 dark:border-charcoal-700 dark:bg-charcoal-800">
          {children}
        </View>
      }
    </View>
  );
};
