import * as React from 'react';

import { Ionicons, Text, TouchableOpacity, View } from '@/ui';

type ItemProps = {
  text: string;
  value?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  textProps?: string;
};

export const BottomSheetItem = ({
  text,
  value,
  icon,
  onPress,
  textProps,
}: ItemProps) => {
  const isPressable = onPress !== undefined;
  const Container = isPressable ? TouchableOpacity : View;
  return (
    <Container
      onPress={onPress}
      className="flex-1 flex-row items-center justify-between px-4 py-2"
    >
      <View className="flex-row items-center">
        {icon && <View className="pr-2">{icon}</View>}
        <Text variant="md" className={textProps ?? ''}>
          {text}
        </Text>
      </View>
      <View className="flex-row items-center">
        <Text variant="md" className="text-neutral-600 dark:text-white">
          {value}
        </Text>
        {isPressable && (
          <View className="pl-2">
            <Ionicons
              name="chevron-forward"
              className="text-black dark:text-white"
              size={20}
            />
          </View>
        )}
      </View>
    </Container>
  );
};
