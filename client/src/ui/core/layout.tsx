import * as React from 'react';
import type { ViewProps } from 'react-native';
import { Keyboard, Platform } from 'react-native';

import { KeyboardAvoidingView } from './keyboard-avoiding-view';
import { Pressable } from './pressable';
import { SafeAreaView } from './view';

type Props = {
  hasHorizontalPadding?: boolean;
  verticalPadding?: number;
  canDismissKeyboard?: boolean;
} & ViewProps &
  React.PropsWithChildren;

export const Layout = ({
  hasHorizontalPadding = true,
  verticalPadding = 80,
  canDismissKeyboard = true,
  children,
  ...props
}: Props) => {
  const dismissKeyboard = () => {
    if (canDismissKeyboard) {
      Keyboard.dismiss();
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? verticalPadding : 0}
    >
      <Pressable onPress={dismissKeyboard} className="flex-1">
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
