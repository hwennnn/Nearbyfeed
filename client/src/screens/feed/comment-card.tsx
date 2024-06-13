import { useActionSheet } from '@expo/react-native-action-sheet';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert } from 'react-native';

import type { Comment } from '@/api';
import { CommentType, useDeleteComment, useVoteComment } from '@/api/comments';
import { useBlockUser } from '@/api/users/block-user';
import { useTheme } from '@/core';
import { useUser } from '@/core/user';
import type { RootNavigatorProp } from '@/navigation';
import { ReportCommentBottomSheet } from '@/screens/feed/report-comment-bottom-sheet';
import {
  Image,
  Pressable,
  showErrorMessage,
  showSuccessMessage,
  Text,
  TimeWidget,
  TouchableOpacity,
  View,
} from '@/ui';
import Divider from '@/ui/core/divider';
import { Ionicons } from '@/ui/icons/vector-icons';
import colors from '@/ui/theme/colors';
import { promptSignIn } from '@/utils/auth-utils';
import { getInitials } from '@/utils/get-initials';
import { stringUtils } from '@/utils/string-utils';

type Props = Comment & {
  onPressCard?: () => void;
  isChildComment?: boolean;
  isPreviewComment?: boolean;
  onDeleteComment?: () => void;
};

export const CommentCard = ({
  content,
  createdAt,
  author,
  authorId,
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
  onDeleteComment,
}: Props) => {
  const { navigate } = useNavigation<RootNavigatorProp>();

  const isDark = useTheme.use.colorScheme() === 'dark';

  const isLiked = like !== undefined && like.value === 1;

  const { mutate } = useVoteComment();
  const { mutate: deleteComment } = useDeleteComment();

  const handleDeleteComment = () => {
    if (isOptimistic === true) return;

    const shouldProceed = promptSignIn(() => {
      navigate('Auth', {
        screen: 'AuthOnboarding',
        params: {
          isCloseButton: true,
        },
      });
    });

    if (!shouldProceed) return;

    deleteComment(
      {
        postId: postId,
        commentId: id,
        commentType: isPreviewComment
          ? CommentType.PREVIEW_COMMENT
          : isChildComment !== true
          ? CommentType.PARENT_COMMENT
          : CommentType.REPLY_COMMENT,
        parentCommentId,
      },
      {
        onSuccess: () => {
          showSuccessMessage('Comment deleted successfully');
          if (onDeleteComment !== undefined) {
            onDeleteComment();
          }
        },
        onError: () => {
          showErrorMessage('Failed to delete comment');
        },
      }
    );
  };

  const alertDeleteComment = () => {
    Alert.alert(
      'Confirm Deletion',
      'This action is irreversible. Are you sure you want to delete this comment?',
      [
        {
          text: 'Delete',
          onPress: () => {
            handleDeleteComment();
          },
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      {
        userInterfaceStyle: isDark ? 'dark' : 'light',
      }
    );
  };

  const handleVote = (voteValue: number) => {
    if (isOptimistic === true) return;

    const shouldProceed = promptSignIn(() => {
      navigate('Auth', {
        screen: 'AuthOnboarding',
        params: {
          isCloseButton: true,
        },
      });
    });

    if (!shouldProceed) return;

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

  const { showActionSheetWithOptions } = useActionSheet();

  const { mutate: mutateBlockUser } = useBlockUser();

  const currentUser = useUser.getState().user;
  const isMyComment = authorId === currentUser?.id;

  const blockUser = () => {
    if (isMyComment || authorId === undefined) return;

    const shouldProceed = promptSignIn(() => {
      navigate('Auth', {
        screen: 'AuthOnboarding',
        params: {
          isCloseButton: true,
        },
      });
    });

    if (!shouldProceed || currentUser?.id === undefined) return;

    mutateBlockUser(
      {
        userId: currentUser.id,
        blockedId: authorId,
      },
      {
        onSuccess: () => {
          showSuccessMessage('You have successfully blocked the user');
        },
        onError: () => {
          showErrorMessage('There is an error. Please try again');
        },
      }
    );
  };

  const onPressActionSheet = () => {
    const options = [];

    if (!isMyComment) {
      options.push('Block this user');
    } else {
      options.push('Delete this comment');
    }

    options.push('Report');

    options.push('Cancel');

    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions(
      {
        userInterfaceStyle: useTheme.getState().colorScheme,
        options,
        cancelButtonIndex,
        destructiveButtonIndex: [0, 1],
      },
      (selectedIndex: number | undefined) => {
        switch (selectedIndex) {
          case 0:
            if (!isMyComment) {
              blockUser();
            } else {
              alertDeleteComment();
            }
            break;

          case 1:
            openReportSheet();
            break;

          case cancelButtonIndex:
          default:
            break;
        }
      }
    );
  };

  const optionsRef = React.useRef<BottomSheetModal>(null);

  const openReportSheet = React.useCallback(
    () => optionsRef.current?.present(),
    []
  );

  const closeReportSheet = React.useCallback(
    () => optionsRef.current?.dismiss(),
    []
  );

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
        <ReportCommentBottomSheet
          ref={optionsRef}
          commentId={id}
          onClose={closeReportSheet}
        />

        <View
          className={`space-y-1 ${
            isPreviewComment !== true && isChildComment !== true
              ? 'bg-white dark:bg-black'
              : 'bg-neutral-100 dark:bg-charcoal-900'
          } py-3`}
        >
          <View className="flex-row items-center justify-between px-4">
            <View className="flex-row items-start space-x-3">
              <View className="h-[36px] w-[36px] items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600">
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

              <TouchableOpacity
                className="items-center justify-center"
                onPress={onPressActionSheet}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  className="text-black dark:text-white"
                  size={16}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {replies !== undefined && replies.length > 0 && (
          <View className="flex-1 flex-col bg-neutral-100 pb-2 pl-6 pr-4 dark:bg-charcoal-900">
            <View className="flex-1">
              {replies.slice(0, 3).map((reply) => (
                <View className="flex-1 py-2" key={reply.id}>
                  <CommentCard {...reply} isPreviewComment={true} />
                  <Divider
                    color={isDark ? colors.divider : colors.neutral['300']}
                  />
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
                  replies.length - 3
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
