/* eslint-disable react/no-unstable-nested-components */
import { useActionSheet } from '@expo/react-native-action-sheet';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';
import * as React from 'react';
import { Alert, RefreshControl } from 'react-native';

import type { InfinitePosts } from '@/api';
import { useDeletePost, usePost, useVotePost } from '@/api';
import { useBlockUser } from '@/api/users/block-user';
import { useTheme } from '@/core';
import { setAppLoading } from '@/core/loading';
import { usePostKeys } from '@/core/posts';
import { useUser } from '@/core/user';
import type { RootNavigatorProp } from '@/navigation';
import { type RootStackParamList } from '@/navigation';
import { CommentComposer } from '@/screens/feed/comment-composer';
import { CommentList } from '@/screens/feed/comment-list';
import { LocationCard } from '@/screens/feed/location-card';
import { PollCard } from '@/screens/feed/poll-card';
import { ReportPostBottomSheet } from '@/screens/feed/report-post-bottom-sheet';
import {
  colors,
  Image,
  LoadingComponent,
  Pressable,
  ScrollView,
  showErrorMessage,
  showSuccessMessage,
  Text,
  TimeWidget,
  TouchableOpacity,
  View,
} from '@/ui';
import Divider from '@/ui/core/divider';
import { Layout } from '@/ui/core/layout';
import { Ionicons } from '@/ui/icons/vector-icons';
import { ImageCarousel } from '@/ui/image-carousel';
import { promptSignIn } from '@/utils/auth-utils';
import { getInitials } from '@/utils/get-initials';
import { onShare, POST_SHARE_MESSAGE } from '@/utils/share-utils';

type Props = RouteProp<RootStackParamList, 'FeedDetails'>;

export const FeedDetails = () => {
  const { params } = useRoute<Props>();
  const { postId } = params;

  const { setOptions, navigate } = useNavigation<RootNavigatorProp>();
  const queryClient = useQueryClient();

  const {
    data: post,
    isLoading,
    refetch: refetchFeed,
  } = usePost({
    variables: {
      id: postId,
    },
    initialData: () => {
      // Populate initial data from the cache
      const queryKey = ['posts', usePostKeys.getState().postsQueryKey];

      const infinitePosts = queryClient.getQueryData<InfinitePosts>(queryKey);
      if (infinitePosts === undefined) return undefined;

      for (const postsPages of infinitePosts.pages) {
        for (const p of postsPages.posts) {
          if (p.id === postId) return p;
        }
      }

      return undefined;
    },
    onSuccess: (data) => {
      const queryKey = ['posts', usePostKeys.getState().postsQueryKey];

      queryClient.setQueryData<InfinitePosts>(queryKey, (oldData) => {
        if (oldData) {
          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => {
              return produce(page, (draftPage) => {
                const foundIndex = draftPage.posts.findIndex(
                  (p) => p.id === postId
                );

                if (foundIndex !== -1) {
                  draftPage.posts[foundIndex] = {
                    ...draftPage.posts[foundIndex],
                    ...data,
                  };
                }
              });
            }),
          };
        }
        return oldData;
      });
    },
  });

  const { mutate } = useVotePost();
  const { mutate: deletePost } = useDeletePost();

  const [imageCarouselIndex, setImageCarouselIndex] = React.useState(0);

  const [imageModalIndex, setImageModalIndex] = React.useState<
    number | undefined
  >(undefined);

  const [refreshing, setRefreshing] = React.useState(false);

  const isDark = useTheme.use.colorScheme() === 'dark';

  const refreshColor = isDark ? colors.neutral[400] : colors.neutral[500];

  const onRefresh = async () => {
    setRefreshing(true);
    refetchFeed();
  };

  const { showActionSheetWithOptions } = useActionSheet();

  const optionsRef = React.useRef<BottomSheetModal>(null);

  const openReportSheet = React.useCallback(
    () => optionsRef.current?.present(),
    []
  );

  const closeReportSheet = React.useCallback(
    () => optionsRef.current?.dismiss(),
    []
  );

  const navToEditFeed = React.useCallback(() => {
    if (!isLoading) {
      navigate('EditFeed', {
        postId,
        title: post?.title ?? '',
        content: post?.content ?? undefined,
      });
    }
  }, [isLoading, navigate, post?.content, post?.title, postId]);

  const handleDeletePost = React.useCallback(() => {
    setAppLoading(true, 'Deleting...');

    deletePost(
      {
        postId,
      },
      {
        onSettled: () => {
          setAppLoading(false);
        },
        onSuccess: () => {
          showSuccessMessage('Feed deleted successfully');
          navigate('App', {
            screen: 'Feed',
          });
        },
        onError: () => {
          showErrorMessage('Failed to delete feed');
        },
      }
    );
  }, [deletePost, navigate, postId]);

  const alertDeletePost = React.useCallback(() => {
    Alert.alert(
      'Confirm Deletion',
      'This action is irreversible. Are you sure you want to delete this post?',
      [
        {
          text: 'Delete',
          onPress: () => {
            handleDeletePost();
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
  }, [handleDeletePost, isDark]);

  const { mutate: mutateBlockUser } = useBlockUser();

  React.useLayoutEffect(() => {
    const currentUser = useUser.getState().user;
    const isMyPost = post?.authorId === currentUser?.id;

    const onPressActionSheet = () => {
      const options: string[] = [];

      if (!isMyPost) {
        options.push('Block this user');
      } else {
        options.push('Edit this post');
        options.push('Delete this post');
      }

      options.push('Report');
      options.push('Cancel');

      const cancelButtonIndex = options.length - 1;

      showActionSheetWithOptions(
        {
          userInterfaceStyle: useTheme.getState().colorScheme,
          options,
          cancelButtonIndex,
          destructiveButtonIndex: options
            .map((_, index) => index)
            .filter((index) => options[index] !== 'Edit this post'),
        },
        (selectedIndex: number | undefined) => {
          if (selectedIndex === undefined) {
            return;
          }

          const option = options[selectedIndex];

          switch (option) {
            case 'Block this user':
              blockUser();
              break;
            case 'Edit this post':
              navToEditFeed();
              break;
            case 'Delete this post':
              alertDeletePost();
              break;
            case 'Report':
              openReportSheet();
              break;
            case 'Cancel':
            default:
              break;
          }
        }
      );
    };

    const blockUser = () => {
      if (isMyPost || post?.authorId === undefined) return;

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
          blockedId: post.authorId,
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

    setOptions({
      headerRight: () => (
        <TouchableOpacity disabled={isLoading} onPress={onPressActionSheet}>
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            className="text-black dark:text-white"
          />
        </TouchableOpacity>
      ),
    });
  }, [
    post?.authorId,
    isLoading,
    mutateBlockUser,
    openReportSheet,
    setOptions,
    showActionSheetWithOptions,
    navigate,
    navToEditFeed,
    handleDeletePost,
    alertDeletePost,
  ]);

  if (isLoading || post === undefined) {
    return <LoadingComponent />;
  }

  const {
    id,
    title,
    content,
    author,
    like,
    images,
    points,
    locationName,
    createdAt,
    commentsCount,
    poll,
    location,
  } = post;

  const isLiked = like !== undefined && like.value === 1;

  const handleVote = (voteValue: number) => {
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
      postId: id,
    });
  };

  return (
    <Layout
      className="flex-1"
      hasHorizontalPadding={false}
      verticalPadding={80}
    >
      <ReportPostBottomSheet
        ref={optionsRef}
        postId={id}
        onClose={closeReportSheet}
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            title="Pull down to refresh"
            tintColor={refreshColor}
            titleColor={refreshColor}
          />
        }
      >
        <Pressable className="flex-1 space-y-3 bg-white pt-4 dark:bg-charcoal-900">
          <View className="flex-row items-center space-x-2 px-4">
            <View className="h-[36px] w-[36px] items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600">
              {author?.image === null ? (
                <Text
                  className="font-medium text-gray-600 dark:text-gray-300"
                  variant="xs"
                >
                  {getInitials(author.username)}
                </Text>
              ) : (
                <Image
                  source={{ uri: author?.image }}
                  className="border-1 h-[36px] w-[36px] rounded-full border-solid border-neutral-800"
                />
              )}
            </View>

            <View className="flex-col justify-between">
              <View className="flex-row items-center space-x-2">
                <Text className="font-semibold" variant="sm" numberOfLines={3}>
                  {author?.username ?? ''}
                </Text>

                <TimeWidget
                  className="text-gray-600 dark:text-gray-500"
                  variant="xs"
                  time={createdAt!}
                />
              </View>

              <Text className="text-gray-600 dark:text-gray-300" variant="xs">
                {locationName}
              </Text>
            </View>
          </View>

          <Text className="px-4 font-medium" variant="lg">
            {title}
          </Text>

          {post.content !== null && post.content !== undefined && (
            <Text variant="sm" className="px-4">
              {content}
            </Text>
          )}

          {images !== null && images !== undefined && images.length > 0 && (
            <View className="flex-1 px-4">
              <ImageCarousel
                images={images}
                imageCarouselIndex={imageCarouselIndex}
                imageModalIndex={imageModalIndex}
                setImageCarouselIndex={setImageCarouselIndex}
                setImageModalIndex={setImageModalIndex}
              />
            </View>
          )}

          {poll !== null && poll !== undefined && (
            <View className="mx-4 flex-1">
              <PollCard poll={poll} showAllText={true} />
            </View>
          )}

          {location !== null && location !== undefined && (
            <View className="mx-4 flex-1">
              <LocationCard location={location} isFullView={true} />
            </View>
          )}

          <View className="flex-row justify-between px-10 pb-4 pt-2">
            <Pressable onPress={() => handleVote(isLiked ? 0 : 1)}>
              <View className="flex-row items-center space-x-1">
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={18}
                  className={
                    isLiked
                      ? 'text-primary-400'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }
                />

                <Text
                  className={`min-w-[28px] font-semibold
                ${
                  isLiked
                    ? 'text-primary-400'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
                  variant="sm"
                >
                  {points > 0 ? points : 'Like'}
                </Text>
              </View>
            </Pressable>

            <View className="flex-row items-center space-x-1">
              <Ionicons
                name="chatbox-outline"
                size={16}
                className="text-neutral-500 dark:text-neutral-400"
              />

              <Text
                className="font-semibold text-gray-600 dark:text-gray-300"
                variant="sm"
              >
                {commentsCount}
              </Text>
            </View>

            <Pressable
              className="flex-row items-center space-x-1"
              onPress={() => onShare(POST_SHARE_MESSAGE)}
            >
              <Ionicons
                name="share-outline"
                size={16}
                className="text-neutral-500 dark:text-neutral-400"
              />

              <Text
                className="font-semibold text-gray-600 dark:text-gray-300"
                variant="sm"
              >
                Share
              </Text>
            </Pressable>
          </View>

          <CommentList
            postId={post.id}
            refreshing={refreshing}
            onRefetchDone={() => setRefreshing(false)}
          />
        </Pressable>
        <View className="h-[95px]" />
      </ScrollView>

      <View className="absolute bottom-0 z-50 h-fit w-full bg-white dark:bg-charcoal-950">
        <Divider />
        <CommentComposer postId={id} />
      </View>
    </Layout>
  );
};
