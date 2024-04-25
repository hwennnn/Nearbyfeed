import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { RefreshControl } from 'react-native';

import { useComment } from '@/api/posts/use-comment';
import type { InfiniteComments } from '@/api/posts/use-vote-comment';
import { retrieveUseCommentsKey } from '@/api/posts/use-vote-comment';
import { useCommentKeys } from '@/core/comments';
import type { RootStackParamList } from '@/navigation';
import { ChildCommentList } from '@/screens/feed/child-comment-list';
import { CommentCard } from '@/screens/feed/comment-card';
import { ReplyComposer } from '@/screens/feed/reply-composer';
import { HeaderButton, NoData, ScrollView, View } from '@/ui';
import Divider from '@/ui/core/divider';
import { Layout } from '@/ui/core/layout';
import { stringUtils } from '@/utils/string-utils';

type Props = RouteProp<RootStackParamList, 'CommentDetails'>;

export const CommentsDetails = () => {
  const { params } = useRoute<Props>();
  const { commentId, postId, repliesCount } = params;

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
  });

  const [refreshing, setRefreshing] = React.useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: `${stringUtils.formatSingularPlural(
        'Reply',
        'Replies',
        '0 Reply',
        repliesCount
      )}`,
      // eslint-disable-next-line react/no-unstable-nested-components
      headerLeft: () => <HeaderButton iconName="close-outline" />,
    });
  }, [navigation, repliesCount]);

  const onRefresh = async () => {
    setRefreshing(true);
  };

  if (isLoading || parentComment === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <NoData />
      </View>
    );
  }

  return (
    <Layout
      className="flex-1 bg-black"
      hasHorizontalPadding={false}
      verticalPadding={108}
    >
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-1 space-y-3 bg-charcoal-900 pt-2">
          <View className="flex-row items-center space-x-2">
            <CommentCard {...parentComment} />
          </View>
        </View>

        <View className="flex-1 pl-6 pr-4">
          <ChildCommentList
            commentId={commentId}
            postId={postId}
            refreshing={refreshing}
            onRefetchDone={() => setRefreshing(false)}
          />
        </View>

        <View className="h-[60px]" />
      </ScrollView>

      <View className="absolute bottom-0 z-50 h-fit w-full bg-charcoal-950">
        <Divider />
        <ReplyComposer postId={postId} commentId={parentComment.id} />
      </View>
    </Layout>
  );
};
