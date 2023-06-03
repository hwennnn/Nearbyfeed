import * as React from 'react';
import type { ViewProps } from 'react-native';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Platform } from 'react-native';

import { SafeAreaView, View } from '@/ui';

import { KeyboardAvoidingView } from './keyboard-avoiding-view';

type Props = {
  hasHorizontalPadding?: boolean;
} & ViewProps &
  React.PropsWithChildren;

export const Layout = ({
  hasHorizontalPadding = true,
  children,
  ...props
}: Props) => {
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      // keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      // contentContainerStyle={{ flexGrow: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView className="flex-1">
          <View
            className={`flex-1 ${hasHorizontalPadding ? 'px-4' : ''} ${
              props.className
            }`}
          >
            {children}
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};
