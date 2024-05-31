import { useNavigation } from '@react-navigation/native';
import React from 'react';

import type { Comment } from '@/api';
import { CommentType, useVoteComment } from '@/api/posts/use-vote-comment';
import { useTheme } from '@/core';
import type { RootNavigatorProp } from '@/navigation';
import { Image, Pressable, Text, TimeWidget, View } from '@/ui';
import Divider from '@/ui/core/divider';
import { Ionicons } from '@/ui/icons/vector-icons';
import colors from '@/ui/theme/colors';
import { getInitials } from '@/utils/get-initials';
import { stringUtils } from '@/utils/string-utils';

type Props = Comment & {
  onPressCard?: () => void;
  isChildComment?: boolean;
  isPreviewComment?: boolean;
};

export const CommentCard = ({
  content,
  createdAt,
  author,
  points,
  like,
  isOptimistic,
  postId,
  id,
  repliesCount,
  isChildComment,
  isPreviewComment,
  parentCommentId,
  replies,
}: Props) => {
  const { navigate } = useNavigation<RootNavigatorProp>();

  const isDark = useTheme.use.colorScheme() === 'dark';

  const isLiked = like !== undefined && like.value === 1;

  const { mutate } = useVoteComment();

  const handleVote = (voteValue: number) => {
    if (isOptimistic === true) return;

    let value = voteValue === like?.value ? 0 : voteValue;

    mutate({
      value: value,
      postId: postId,
      commentId: id,
      commentType: isPreviewComment
        ? CommentType.PREVIEW_COMMENT
        : isChildComment !== true
        ? CommentType.PARENT_COMMENT
        : CommentType.REPLY_COMMENT,
      parentCommentId,
    });
  };

  const onPressReply = (shouldNavigate?: boolean) => {
    if (
      (isChildComment !== true || shouldNavigate === true) &&
      isOptimistic !== true
    ) {
      navigate('CommentDetails', {
        commentId: id,
        postId: postId,
        repliesCount,
      });
    }
  };

  return (
    <Pressable
      className="flex-1"
      onPress={() => {
        if (parentCommentId === null) {
          onPressReply(true);
        }
      }}
    >
      <View className="flex-1">
        <View
          className={`space-y-1 ${
            isPreviewComment !== true && isChildComment !== true
              ? 'bg-white dark:bg-black'
              : 'bg-neutral-100 dark:bg-charcoal-900'
          } py-3`}
        >
          <View className="flex-row items-center justify-between px-4">
            <View className="flex-row items-start space-x-3">
              <View className="h-[36px] w-[36px] items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
                {author?.image === null && (
                  <Text
                    className="font-medium text-gray-600 dark:text-gray-300"
                    variant="xs"
                  >
                    {getInitials(author.username)}
                  </Text>
                )}
                {author?.image !== null && (
                  <Image
                    source={{ uri: author?.image }}
                    className="h-[36px] w-[36px] rounded-full"
                  />
                )}
              </View>

              <View className="flex-1 flex-col space-y-2">
                <View className="flex-col">
                  <Text
                    className="font-semibold"
                    variant="sm"
                    numberOfLines={3}
                  >
                    {author?.username ?? ''}
                  </Text>

                  <TimeWidget
                    variant="xs"
                    time={createdAt!}
                    className="text-gray-600 dark:text-gray-500"
                  />
                </View>

                <Text variant="sm">{`${content}`}</Text>

                <View className="flex-row items-center space-x-4">
                  <Pressable onPress={() => handleVote(isLiked ? 0 : 1)}>
                    <View className="min-w-[58px] flex-row items-center space-x-1">
                      <Ionicons
                        name="thumbs-up"
                        size={12}
                        className={
                          isLiked
                            ? 'text-primary-400'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }
                      />

                      <Text
                        className={`font-semibold
                  ${
                    isLiked
                      ? 'text-primary-400'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                        variant="xs"
                      >
                        {stringUtils.formatSingularPlural(
                          'Like',
                          'Likes',
                          'Like',
                          points
                        )}
                      </Text>
                    </View>
                  </Pressable>

                  {isPreviewComment !== true && isChildComment !== true && (
                    <Pressable
                      onPress={() => onPressReply()}
                      className="flex-row items-center space-x-1"
                    >
                      <Ionicons
                        name="chatbox-outline"
                        size={12}
                        className="text-neutral-500 dark:text-neutral-400"
                      />

                      <Text
                        className="font-semibold text-gray-600 dark:text-gray-300"
                        variant="xs"
                      >
                        Reply
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {replies !== undefined && replies.length > 0 && (
          <View className="flex-1 flex-col bg-neutral-100 pb-2 pl-6 pr-4 dark:bg-charcoal-900">
            <View className="flex-1">
              {replies.slice(0, 3).map((reply) => (
                <View className="flex-1 py-2" key={reply.id}>
                  <CommentCard {...reply} isPreviewComment={true} />
                  <Divider color={isDark ? '#333333' : colors.neutral['300']} />
                </View>
              ))}
            </View>

            {replies !== undefined && repliesCount > 3 && (
              <Pressable
                className="flex-row pl-6"
                onPress={() => onPressReply()}
              >
                <Text
                  className="font-semibold text-gray-600 dark:text-gray-300"
                  variant="sm"
                >{`View ${stringUtils.formatSingularPlural(
                  'more reply',
                  'more replies',
                  'more reply',
                  repliesCount - 3
                )}`}</Text>

                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  className="text-neutral-500 dark:text-neutral-400"
                />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};
