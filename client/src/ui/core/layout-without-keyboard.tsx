import * as React from 'react';
import type { ViewProps } from 'react-native';
import { Keyboard } from 'react-native';

import { Pressable } from './pressable';
import { SafeAreaView } from './view';

type Props = {
  hasHorizontalPadding?: boolean;
} & ViewProps &
  React.PropsWithChildren;

export const LayoutWithoutKeyboard = ({
  hasHorizontalPadding = true,
  children,
  ...props
}: Props) => {
  return (
    <Pressable onPress={Keyboard.dismiss} className="flex-1">
      <SafeAreaView
        className={`flex-1 ${hasHorizontalPadding ? 'px-4' : ''} ${
          props.className
        }`}
      >
        {children}
      </SafeAreaView>
    </Pressable>
  );
};
