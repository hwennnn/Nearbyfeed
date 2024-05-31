import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as React from 'react';

import { useTheme } from '@/core';
import type { Option } from '@/ui';
import { Options, Text, TouchableOpacity } from '@/ui';
import { Ionicons } from '@/ui/icons/vector-icons';

export interface VotingLengthOption {
  label: string;
  value: number;
}

export const DEFAULT_VOTING_LENGTH_OPTION = { label: '5 days', value: 5 };

type Props = {
  onSelectCallback: (option: Option) => void;
  selectedOption: Option;
};

export const PollVotingLengthItem = ({
  onSelectCallback,
  selectedOption,
}: Props) => {
  const votingLengthOptions = React.useMemo(
    () => [
      { label: '7 days', value: 7 },
      { label: '6 days', value: 6 },
      { label: '5 days', value: 5 },
      { label: '4 days', value: 4 },
      { label: '3 days', value: 3 },
      { label: '2 days', value: 2 },
      { label: '1 day', value: 1 },
    ],
    []
  );

  const isDark = useTheme.use.colorScheme() === 'dark';
  const iconColor = isDark ? 'text-neutral-400' : 'text-neutral-500';

  const optionsRef = React.useRef<BottomSheetModal>(null);
  const open = React.useCallback(() => optionsRef.current?.present(), []);
  const onSelect = React.useCallback(
    (option: Option) => {
      onSelectCallback(option);
      optionsRef.current?.dismiss();
    },
    [onSelectCallback]
  );

  return (
    <TouchableOpacity onPress={open} className="ml-2 flex-row space-x-1">
      <Ionicons size={20} name="chevron-down" className={iconColor} />
      <Text className="font-bold text-gray-600 dark:text-gray-300" variant="sm">
        {selectedOption.label}
      </Text>

      <Options
        ref={optionsRef}
        options={votingLengthOptions}
        onSelect={onSelect}
        value={selectedOption?.value}
      />
    </TouchableOpacity>
  );
};
