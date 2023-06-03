import * as React from 'react';
import type { ViewProps } from 'react-native';

import { SafeAreaView, View } from '@/ui';

type Props = ViewProps & React.PropsWithChildren;

export const Layout = ({ children, ...props }: Props) => {
  return (
    <SafeAreaView className="flex-1">
      <View className={`flex-1 px-4 ${props.className}`}>{children}</View>
    </SafeAreaView>
  );
};
