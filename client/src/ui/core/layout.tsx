import * as React from 'react';
import type { ViewProps } from 'react-native';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Platform } from 'react-native';

import { SafeAreaView } from '@/ui';

import { KeyboardAvoidingView } from './keyboard-avoiding-view';

type Props = {
  hasHorizontalPadding?: boolean;
  verticalPadding?: number;
} & ViewProps &
  React.PropsWithChildren;

export const Layout = ({
  hasHorizontalPadding = true,
  verticalPadding,
  children,
  ...props
}: Props) => {
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? verticalPadding ?? 80 : 0}
      // contentContainerStyle={{ flexGrow: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView
          className={`flex-1 ${hasHorizontalPadding ? 'px-4' : ''} ${
            props.className
          }`}
        >
          {children}
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};
