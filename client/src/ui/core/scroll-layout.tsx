import * as React from 'react';
import type { KeyboardAwareScrollViewProps } from 'react-native-keyboard-aware-scroll-view';

import { KeyboardAvoidingScrollView } from './keyboard-avoiding-view';

type Props = KeyboardAwareScrollViewProps & React.PropsWithChildren;

export const ScrollLayout = ({ children, ...props }: Props) => {
  return (
    <KeyboardAvoidingScrollView className="flex-1" {...props}>
      {children}
    </KeyboardAvoidingScrollView>
  );
};
