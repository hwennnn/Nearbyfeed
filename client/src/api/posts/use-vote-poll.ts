import type { AxiosError } from 'axios';
import { produce } from 'immer';
import { createMutation } from 'react-query-kit';

import { usePostKeys } from '@/core/posts';
import { useUser } from '@/core/user';

import { client, queryClient } from '../common';
import type { Post, VotePollResult } from '../types';

type Variables = {
  postId: number;
  pollId: number;
  pollOptionId: number;
};
type Response = VotePollResult;
type PostsResponse = {
  posts: Post[];
  hasMore: boolean;
};
type InfinitePosts = {
  pages: PostsResponse[];
  pageParams: unknown[];
};

export const useVotePoll = createMutation<Response, Variables, AxiosError>({
  mutationFn: async (variables) =>
    client({
      url: `posts/${variables.postId}/polls/${variables.pollId}/vote`,
      method: 'POST',
      data: {
        pollOptionId: variables.pollOptionId,
      },
    })
      .then((response) => response.data)
      .catch((error) => {
        return Promise.reject(error);
      }),
  // Update the cache after success:
  onSuccess: (data, variables) => {
    const queryKey = ['posts', usePostKeys.getState().postsQueryKey];

    queryClient.setQueryData<InfinitePosts>(queryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => {
            return produce(page, (draftPage) => {
              const foundIndex = draftPage.posts.findIndex(
                (post) => post.id === variables.postId
              );

              if (foundIndex !== -1) {
                const post = draftPage.posts[foundIndex];
                if (post.poll === null || post.poll === undefined) return;

                post.poll.participantsCount = data.poll.participantsCount;
                post.poll.vote = data.vote;

                const pollOptionIndex = post.poll.options.findIndex(
                  (option) => option.id === data.pollOption.id
                );

                if (pollOptionIndex !== -1) {
                  post.poll.options[pollOptionIndex] = data.pollOption;
                }
              }
            });
          }),
        };
      }
      return oldData;
    });

    const postQueryKey = ['posts', { id: variables.postId }];

    queryClient.setQueryData<Post>(postQueryKey, (oldData) => {
      if (oldData) {
        return produce(oldData, (draftPost) => {
          if (draftPost.poll === null || draftPost.poll === undefined) return;

          draftPost.poll.participantsCount = data.poll.participantsCount;
          draftPost.poll.vote = data.vote;

          const pollOptionIndex = draftPost.poll.options.findIndex(
            (option) => option.id === data.pollOption.id
          );

          if (pollOptionIndex !== -1) {
            draftPost.poll.options[pollOptionIndex] = data.pollOption;
          }
        });
      }

      return oldData;
    });

    const userId = useUser.getState().user?.id;
    const myPostsQueryKey = [
      'my-posts',
      {
        userId,
      },
    ];

    queryClient.setQueryData<InfinitePosts>(myPostsQueryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => {
            return produce(page, (draftPage) => {
              const foundIndex = draftPage.posts.findIndex(
                (post) => post.id === variables.postId
              );

              if (foundIndex !== -1) {
                const post = draftPage.posts[foundIndex];
                if (post.poll === null || post.poll === undefined) return;

                post.poll.participantsCount = data.poll.participantsCount;
                post.poll.vote = data.vote;

                const pollOptionIndex = post.poll.options.findIndex(
                  (option) => option.id === data.pollOption.id
                );

                if (pollOptionIndex !== -1) {
                  post.poll.options[pollOptionIndex] = data.pollOption;
                }
              }
            });
          }),
        };
      }
      return oldData;
    });
  },
});
