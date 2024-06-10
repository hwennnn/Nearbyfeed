import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';
import * as React from 'react';
import { RefreshControl } from 'react-native';

import type { InfiniteComments } from '@/api/comments';
import { retrieveUseCommentsKey, useComment } from '@/api/comments';
import { useTheme } from '@/core';
import { useCommentKeys } from '@/core/comments';
import type { RootStackParamList } from '@/navigation';
import { ChildCommentList } from '@/screens/feed/child-comment-list';
import { CommentCard } from '@/screens/feed/comment-card';
import { ReplyComposer } from '@/screens/feed/reply-composer';
import {
  colors,
  HeaderButton,
  LoadingComponent,
  Pressable,
  ScrollView,
  View,
} from '@/ui';
import Divider from '@/ui/core/divider';
import { Layout } from '@/ui/core/layout';
import { stringUtils } from '@/utils/string-utils';

type Props = RouteProp<RootStackParamList, 'CommentDetails'>;

export const CommentsDetails = () => {
  const { params } = useRoute<Props>();
  const { commentId, postId, repliesCount } = params;

  const isDark = useTheme.use.colorScheme() === 'dark';

  const refreshColor = isDark ? colors.neutral[400] : colors.neutral[500];

  const navigation = useNavigation();

  const queryClient = useQueryClient();

  const { data: parentComment, isLoading } = useComment({
    variables: {
      postId,
      commentId,
    },
    initialData: () => {
      // Populate initial data from the cache
      const queryKey = retrieveUseCommentsKey(
        postId,
        useCommentKeys.getState().commentsQueryKey.sort
      );

      const infiniteComments =
        queryClient.getQueryData<InfiniteComments>(queryKey);
      if (infiniteComments === undefined) return undefined;

      for (const commentsPages of infiniteComments.pages) {
        for (const c of commentsPages.comments) {
          if (c.id === postId) return c;
        }
      }

      return undefined;
    },
    onSuccess: (data) => {
      const commentsQueryKey = retrieveUseCommentsKey(
        postId,
        useCommentKeys.getState().commentsQueryKey.sort
      );

      queryClient.setQueryData<InfiniteComments>(
        commentsQueryKey,
        (oldData) => {
          if (oldData) {
            return {
              pageParams: oldData.pageParams,
              pages: oldData.pages.map((page) => {
                return produce(page, (draftPage) => {
                  const foundIndex = draftPage.comments.findIndex(
                    (c) => c.id === commentId
                  );

                  if (foundIndex !== -1) {
                    draftPage.comments[foundIndex] = {
                      ...draftPage.comments[foundIndex],
                      ...data,
                    };
                  }
                });
              }),
            };
          }

          return oldData;
        }
      );
    },
  });

  const [refreshing, setRefreshing] = React.useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: `${stringUtils.formatSingularPlural(
        'Reply',
        'Replies',
        '0 Reply',
        parentComment?.repliesCount ?? repliesCount
      )}`,
      // eslint-disable-next-line react/no-unstable-nested-components
      headerLeft: () => <HeaderButton iconName="close-outline" />,
    });
  }, [navigation, parentComment?.repliesCount, repliesCount]);

  const onRefresh = async () => {
    setRefreshing(true);
  };

  const navToFeedDetails = () => {
    navigation.navigate('FeedDetails', {
      postId,
    });
  };

  if (isLoading || parentComment === undefined) {
    return <LoadingComponent />;
  }

  return (
    <Layout
      className="flex-1"
      hasHorizontalPadding={false}
      verticalPadding={108}
    >
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
        <Pressable className="flex-1">
          <View className="flex-1 space-y-3 bg-neutral-100 dark:bg-charcoal-900">
            <View className="flex-row items-center space-x-2">
              <CommentCard
                {...parentComment}
                onDeleteComment={navToFeedDetails}
              />
            </View>
          </View>

          <ChildCommentList
            commentId={commentId}
            postId={postId}
            refreshing={refreshing}
            onRefetchDone={() => setRefreshing(false)}
          />
        </Pressable>
      </ScrollView>

      <View className="absolute bottom-0 z-50 h-fit w-full bg-white dark:bg-charcoal-950">
        <Divider />
        <ReplyComposer postId={postId} commentId={parentComment.id} />
      </View>
    </Layout>
  );
};
