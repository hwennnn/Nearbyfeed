import { useColorScheme } from 'nativewind';
import React from 'react';

import { type PollWithOptions, useVotePoll } from '@/api';
import { useUser } from '@/core/user';
import { LoadingButton, Pressable, Text, View } from '@/ui';
import { FontAwesome5 } from '@/ui/icons/ionicons';
import { stringUtils } from '@/utils/string-utils';
import { timeUtils } from '@/utils/time-utils';

type Props = {
  poll: PollWithOptions;
};

export const PollCard = ({ poll }: Props) => {
  const { colorScheme } = useColorScheme();

  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? 'text-neutral-400' : 'text-neutral-500';

  const [selectedVoteOption, setSelectedVoteOption] = React.useState<
    number | null
  >(null);

  const { mutate, isLoading } = useVotePoll();

  const pollExpirationDate = timeUtils.addDays(
    poll.createdAt,
    poll.votingLength
  );

  const isPollVoted =
    poll.vote !== undefined && poll.vote.userId === useUser.getState().user?.id;

  const isPollExpired = new Date().getTime() >= pollExpirationDate.getTime();

  const handleVotePoll = () => {
    if (isPollVoted || isPollExpired || selectedVoteOption === null) {
      return;
    }

    mutate({
      postId: poll.postId,
      pollId: poll.id,
      pollOptionId: selectedVoteOption,
    });
  };

  return (
    <View className="mt-4 space-y-2 rounded-lg border-[0.5px] bg-charcoal-850 p-4">
      <View className="flex-1 flex-row items-center space-x-2">
        <FontAwesome5 name="poll-h" size={20} className={iconColor} />

        <Text
          className="font-semibold text-gray-600 dark:text-gray-300"
          variant="sm"
        >
          Poll
        </Text>

        <View className="mx-1 h-[80%] w-[0.5px] bg-white" />

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
          const isSelected = isPollVoted
            ? option.id === poll.vote?.pollOptionId
            : option.id === selectedVoteOption;

          const percentage =
            poll.participantsCount === 0
              ? 0
              : (option.voteCount / poll.participantsCount) * 100;

          return isPollVoted || isPollExpired ? (
            <View
              className={`space flex-1 flex-row rounded-md p-2 ${
                isSelected ? 'bg-primary-600' : 'bg-primary-200'
              }`}
              key={option.id}
            >
              <Text
                className="flex-1 text-gray-600 dark:text-white"
                variant="sm"
              >
                {option.text}
              </Text>

              <Text
                className="justify-end font-semibold text-gray-600 dark:text-white"
                variant="sm"
              >
                {`${percentage.toFixed(1)}% (${option.voteCount})`}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setSelectedVoteOption(option.id);
              }}
              disabled={isLoading || isPollVoted || isPollExpired}
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
        {!isPollVoted && !isPollExpired && (
          <LoadingButton
            onPress={handleVotePoll}
            label="Vote"
            isLoading={isLoading}
            disabled={
              selectedVoteOption === null ||
              isPollExpired ||
              isLoading ||
              isPollVoted
            }
          />
        )}

        {isPollExpired && (
          <Text variant="sm" className="text-center text-primary-400">
            The poll has expired.
          </Text>
        )}

        {!isPollExpired && (
          <Text variant="sm" className="text-center text-primary-400">
            {`Closes in ${timeUtils.formatCreatedTimeInFull(
              pollExpirationDate
            )}`}
          </Text>
        )}
      </View>
    </View>
  );
};
