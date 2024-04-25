import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import React from 'react';

import type { Comment } from '@/api';
import { CommentType, useVoteComment } from '@/api/posts/use-vote-comment';
import type { RootNavigatorProp } from '@/navigation';
import { Image, Pressable, Text, TimeWidget, View } from '@/ui';
import Divider from '@/ui/core/divider';
import { Ionicons } from '@/ui/icons/ionicons';
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

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? 'text-neutral-400' : 'text-neutral-500';

  const isLiked = like !== undefined && like.value === 1;

  const { mutate } = useVoteComment();

  const handleVote = (voteValue: number) => {
    if (isOptimistic === true) return;

    let value = voteValue === like?.value ? 0 : voteValue;

    mutate({
      value: value,
      postId: postId.toString(),
      commentId: id.toString(),
      commentType: isPreviewComment
        ? CommentType.PREVIEW_COMMENT
        : isChildComment !== true
        ? CommentType.PARENT_COMMENT
        : CommentType.REPLY_COMMENT,
      parentCommentId,
    });
  };

  const onPressReply = (shouldNavigate?: boolean) => {
    if (isChildComment !== true || shouldNavigate === true) {
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
          className={`space-y-1 rounded-xl ${
            isPreviewComment !== true && isChildComment !== true
              ? 'bg-charcoal-900'
              : 'bg-black'
          } py-3 shadow-xl`}
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
                        className={isLiked ? 'text-primary-400' : iconColor}
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
                        className={iconColor}
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
          <View className="flex-1 flex-col bg-black pb-2 pl-6 pr-4">
            {replies.map((reply) => (
              <View className="py-2" key={reply.id}>
                <CommentCard {...reply} isPreviewComment={true} />
                <Divider />
              </View>
            ))}

            {replies !== undefined &&
              replies.length === 3 &&
              repliesCount - 3 > 0 && (
                <Pressable
                  className="flex-row pl-6"
                  onPress={() => onPressReply()}
                >
                  <Text
                    className="font-bold text-gray-600 dark:text-gray-300"
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
                    className={iconColor}
                  />
                </Pressable>
              )}
          </View>
        )}
      </View>
    </Pressable>
  );
};
