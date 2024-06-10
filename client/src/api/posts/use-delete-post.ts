import type { AxiosError } from 'axios';
import { produce } from 'immer';
import { createMutation } from 'react-query-kit';

import { usePostKeys } from '@/core/posts';

import { client, queryClient } from '../common';
import type { InfinitePosts } from './types';

type Variables = {
  postId: number;
};
type Response = {};
type Context = {
  previousPosts?: InfinitePosts;
  previousMyPosts?: InfinitePosts;
};

export const useDeletePost = createMutation<
  Response,
  Variables,
  AxiosError,
  Context
>({
  mutationFn: async (variables) => {
    const response = await client({
      url: `posts/${variables.postId}`,
      method: 'DELETE',
    }).catch((error) => {
      return Promise.reject(error);
    });

    return response.data;
  },
  onMutate: async (variables) => {
    const postsQueryKey = ['posts', usePostKeys.getState().postsQueryKey];
    await queryClient.cancelQueries({ queryKey: postsQueryKey });
    const previousPosts =
      queryClient.getQueryData<InfinitePosts>(postsQueryKey);

    queryClient.setQueryData<InfinitePosts>(postsQueryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => {
            return produce(page, (draftPage) => {
              const foundIndex = draftPage.posts.findIndex(
                (post) => post.id === variables.postId
              );

              if (foundIndex !== -1) {
                draftPage.posts.splice(foundIndex, 1);
              }
            });
          }),
        };
      }
      return oldData;
    });

    const myPostsQueryKey = ['my-posts', {}];
    await queryClient.cancelQueries({ queryKey: myPostsQueryKey });
    const previousMyPosts =
      queryClient.getQueryData<InfinitePosts>(myPostsQueryKey);

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
                draftPage.posts.splice(foundIndex, 1);
              }
            });
          }),
        };
      }
      return oldData;
    });

    return { previousPosts, variables, previousMyPosts };
  },
  // If the mutation fails, use the context we returned above
  onError: (_err, variables, context) => {
    const postsQueryKey = ['posts', usePostKeys.getState().postsQueryKey];
    queryClient.setQueryData<InfinitePosts>(
      postsQueryKey,
      context?.previousPosts
    );

    const myPostsQueryKey = ['my-posts', {}];
    queryClient.setQueryData<InfinitePosts>(
      myPostsQueryKey,
      context?.previousMyPosts
    );
  },
});
