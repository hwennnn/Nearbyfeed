import React from 'react';

import { type PollWithOptions, useVotePoll } from '@/api';
import { useTheme } from '@/core';
import { useUser } from '@/core/user';
import { LoadingButton, Pressable, Text, View } from '@/ui';
import { FontAwesome5, Ionicons } from '@/ui/icons/vector-icons';
import { stringUtils } from '@/utils/string-utils';
import { timeUtils } from '@/utils/time-utils';

type Props = {
  poll: PollWithOptions;
  showAllText?: boolean;
};

export const PollCard = ({ poll, showAllText = false }: Props) => {
  const isDark = useTheme.use.colorScheme() === 'dark';
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
    poll.vote !== undefined &&
    poll.vote !== null &&
    poll.vote?.userId === useUser.getState().user?.id;

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
    <View className="mt-4 flex-1 space-y-2 rounded-lg border-[0.5px] border-neutral-300 bg-neutral-100 p-4 dark:border-charcoal-850 dark:bg-charcoal-850">
      <View className="flex-1 flex-row items-center space-x-2">
        <FontAwesome5 name="poll-h" size={20} className={iconColor} />

        <Text
          className="font-semibold text-gray-600 dark:text-gray-300"
          variant="sm"
        >
          Poll
        </Text>

        <View className="mx-1 h-4/5 w-[0.5px] bg-white" />

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

      <View className="flex-1 space-y-2">
        {poll.options.map((option) => {
          const isSelected = isPollVoted
            ? option.id === poll.vote?.pollOptionId
            : option.id === selectedVoteOption;

          const percentage =
            poll.participantsCount === 0
              ? 0
              : (option.voteCount / poll.participantsCount) * 100;

          return isPollVoted || isPollExpired ? (
            <View className="flex-1 flex-row space-x-6" key={option.id}>
              <View className="flex-1 flex-row items-center space-x-2">
                <View
                  className="absolute h-full rounded-md bg-primary-500"
                  style={{
                    width: `${percentage}%`,
                  }}
                />

                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    className="text-black dark:text-white"
                  />
                )}

                <Text
                  className={`p-2 ${isSelected ? 'mr-6' : ''}`}
                  variant="sm"
                  numberOfLines={showAllText ? undefined : 1}
                >
                  {option.text}
                </Text>
              </View>

              <Text
                className="w-[40px] self-center py-2 font-semibold text-gray-600 dark:text-white"
                variant="sm"
              >
                {`${percentage.toFixed(0)}%`}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setSelectedVoteOption(option.id);
              }}
              disabled={isLoading || isPollVoted || isPollExpired}
              key={option.id}
              className={`flex-1 flex-row items-center space-x-2 rounded-lg p-2 ${
                isSelected ? 'bg-primary-400' : 'bg-charcoal-700'
              }`}
            >
              <View className="h-4 w-4 items-center justify-center rounded-xl border border-white">
                {isSelected && <View className="h-2 w-2 rounded-md bg-white" />}
              </View>

              <Text
                className="pr-6 text-gray-600 dark:text-white"
                variant="sm"
                numberOfLines={showAllText ? undefined : 1}
              >
                {option.text}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-1 flex-col space-y-3 pt-2">
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
            Poll closed
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
