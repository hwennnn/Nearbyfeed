import React from 'react';

import type { PollWithOptions } from '@/api';
import { LoadingButton, Pressable, Text, View } from '@/ui';
import { stringUtils } from '@/utils/string-utils';
import { timeUtils } from '@/utils/time-utils';

type Props = {
  poll: PollWithOptions;
};

export const PollCard = ({ poll }: Props) => {
  const [selectedVoteOption, setSelectedVoteOption] = React.useState<
    number | null
  >(null);

  const pollExpirationDate = timeUtils.addDays(
    poll.createdAt,
    poll.votingLength
  );

  const isPollExpired = new Date().getTime() >= pollExpirationDate.getTime();

  return (
    <View className="mt-4 space-y-2 rounded-lg border-[0.5px] bg-charcoal-850 p-4">
      <View className="flex-1 flex-row items-center space-x-2">
        <Text
          className="font-semibold text-gray-600 dark:text-gray-300"
          variant="sm"
        >
          Poll
        </Text>

        <Text className="font-semibold text-black dark:text-white" variant="xs">
          {stringUtils.formatSingularPlural(
            'Participant',
            'Participants',
            'No Participant',
            poll.participantsCount
          )}
        </Text>
      </View>

      <Text className="text-gray-600 dark:text-gray-300" variant="xs">
        Select only one answer
      </Text>

      <View className="space-y-2">
        {poll.options.map((option) => {
          const isSelected = option.id === selectedVoteOption;

          return (
            <Pressable
              onPress={() => {
                setSelectedVoteOption(option.id);
              }}
              key={option.id}
              className={`flex-row items-center space-x-2 rounded-lg p-2 ${
                isSelected ? 'bg-primary-400' : 'bg-charcoal-700'
              }`}
            >
              <View className="h-4 w-4 items-center justify-center rounded-xl border-[1px] border-white">
                {isSelected && <View className="h-2 w-2 rounded-md bg-white" />}
              </View>

              <Text
                className="text-gray-600 dark:text-white"
                variant="sm"
                numberOfLines={1}
              >
                {option.text}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-col space-y-3 pt-2">
        <LoadingButton
          label="Vote"
          disabled={selectedVoteOption === null || isPollExpired}
        />

        <Text variant="sm" className="text-center text-primary-400">
          {isPollExpired
            ? 'The poll has expired.'
            : `Closes in ${timeUtils.formatCreatedTimeInFull(
                pollExpirationDate
              )}`}
        </Text>
      </View>
    </View>
  );
};
