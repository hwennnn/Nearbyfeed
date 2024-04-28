import * as React from 'react';
import type { ViewProps } from 'react-native';
import { Keyboard, Platform } from 'react-native';

import { Pressable, SafeAreaView } from '@/ui';

import { KeyboardAvoidingView } from './keyboard-avoiding-view';

type Props = {
  hasHorizontalPadding?: boolean;
  verticalPadding?: number;
} & ViewProps &
  React.PropsWithChildren;

export const Layout = ({
  hasHorizontalPadding = true,
  verticalPadding = 80,
  children,
  ...props
}: Props) => {
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? verticalPadding : 0}
    >
      <Pressable onPress={Keyboard.dismiss} className="flex-1">
        <SafeAreaView
          className={`flex-1 ${hasHorizontalPadding ? 'px-4' : ''} ${
            props.className
          }`}
        >
          {children}
        </SafeAreaView>
      </Pressable>
    </KeyboardAvoidingView>
  );
};
