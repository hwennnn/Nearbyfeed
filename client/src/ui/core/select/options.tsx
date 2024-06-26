import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { type PressableProps } from 'react-native';

import { useTheme } from '@/core';
import { colors } from '@/ui/theme';

import { renderBackdrop } from '../bottom-sheet';
import { Pressable } from '../pressable';
import { Text } from '../text';
import { Check } from './icons';

export type Option = { label: string; value: string | number };

type OptionsProps = {
  options: Option[];
  onSelect: (option: Option) => void;
  value?: string | number;
};

function keyExtractor(item: Option) {
  return `select-item-${item.value}`;
}

export const Options = React.forwardRef<BottomSheetModal, OptionsProps>(
  ({ options, onSelect, value }, ref) => {
    const height = options.length * 70 + 100;
    const snapPoints = React.useMemo(() => [height], [height]);
    const isDark = useTheme.use.colorScheme() === 'dark';

    const renderSelectItem = React.useCallback(
      ({ item }: { item: Option }) => (
        <Option
          key={`select-item-${item.value}`}
          label={item.label}
          selected={value === item.value}
          onPress={() => onSelect(item)}
          isDark={isDark}
        />
      ),
      [onSelect, value, isDark]
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{
          backgroundColor: isDark ? colors.white : colors.charcoal[800],
        }}
        backgroundStyle={{
          backgroundColor: isDark ? colors.charcoal[950] : colors.white,
        }}
      >
        <BottomSheetFlatList
          data={options}
          keyExtractor={keyExtractor}
          renderItem={renderSelectItem}
          style={{
            backgroundColor: isDark ? colors.charcoal[950] : colors.white,
          }}
        />
      </BottomSheetModal>
    );
  }
);

const Option = ({
  label,
  selected = false,
  isDark = false,
  ...props
}: PressableProps & {
  selected?: boolean;
  label: string;
  isDark?: boolean;
}) => {
  return (
    <Pressable
      className="flex-row items-center border-b border-neutral-300 bg-white px-3 py-2 dark:border-charcoal-700 dark:bg-charcoal-800"
      {...props}
    >
      <Text variant="md" className="flex-1 dark:text-charcoal-100">
        {label}
      </Text>
      {selected && <Check color={isDark ? colors.white : colors.black} />}
    </Pressable>
  );
};
