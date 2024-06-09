import type { AxiosError } from 'axios';
import { produce } from 'immer';
import { createMutation } from 'react-query-kit';

import { usePostKeys } from '@/core/posts';

import { client, queryClient } from '../common';
import type { Post } from '../types';

type Variables = {
  postId: number;
  title: string;
  content?: string;
};
type Response = Post;
type PostsResponse = {
  posts: Post[];
  hasMore: boolean;
};
type InfinitePosts = {
  pages: PostsResponse[];
  pageParams: unknown[];
};
type Context = {
  previousPost?: Post;
  previousPosts?: InfinitePosts;
  previousMyPosts?: InfinitePosts;
  variables: Variables;
};

export const useEditPost = createMutation<
  Response,
  Variables,
  AxiosError,
  Context
>({
  mutationFn: async (variables) => {
    const response = await client({
      url: `posts/${variables.postId}`,
      method: 'PATCH',
      data: {
        title: variables.title,
        content: variables.content,
      },
    }).catch((error) => {
      return Promise.reject(error);
    });

    return response.data;
  },
  onMutate: async (variables) => {
    const queryKey = ['posts', usePostKeys.getState().postsQueryKey];
    await queryClient.cancelQueries({ queryKey });
    const previousPosts = queryClient.getQueryData<InfinitePosts>(queryKey);

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
                draftPage.posts[foundIndex].title = variables.title;
                draftPage.posts[foundIndex].content = variables.content;
              }
            });
          }),
        };
      }
      return oldData;
    });

    const myPostsQueryKey = ['my-posts', {}];
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
                draftPage.posts[foundIndex].title = variables.title;
                draftPage.posts[foundIndex].content = variables.content;
              }
            });
          }),
        };
      }
      return oldData;
    });

    const postQueryKey = [
      'posts',
      {
        id: variables.postId,
      },
    ];
    const previousPost = queryClient.getQueryData<Post>(postQueryKey);

    queryClient.setQueryData<Post>(postQueryKey, (oldData) => {
      if (oldData) {
        return produce(oldData, (draftData) => {
          draftData.title = variables.title;
          draftData.content = variables.content;
        });
      }
      return oldData;
    });

    // Return a context with the previous and new todo
    return { previousPosts, variables, previousMyPosts, previousPost };
  },
  // If the mutation fails, use the context we returned above
  onError: (_err, variables, context) => {
    const queryKey = ['posts', usePostKeys.getState().postsQueryKey];
    queryClient.setQueryData<InfinitePosts>(queryKey, context?.previousPosts);

    const myPostsQueryKey = ['my-posts', {}];
    queryClient.setQueryData<InfinitePosts>(
      myPostsQueryKey,
      context?.previousMyPosts
    );

    const postQueryKey = [
      'posts',
      {
        id: variables.postId,
      },
    ];
    queryClient.setQueryData<Post>(postQueryKey, context?.previousPost);
  },
  onSuccess: (data, variables, _context) => {
    const queryKey = ['posts', usePostKeys.getState().postsQueryKey];

    // Update the cache with the response data from the API
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
                draftPage.posts[foundIndex].title = data.title;
                draftPage.posts[foundIndex].content = data.content;
              }
            });
          }),
        };
      }
      return oldData;
    });

    // Update the my-posts cache by adding the new post to the existing list
    const myPostsQueryKey = ['my-posts', {}];
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
                draftPage.posts[foundIndex].title = data.title;
                draftPage.posts[foundIndex].content = data.content;
              }
            });
          }),
        };
      }
      return oldData;
    });

    const postQueryKey = [
      'posts',
      {
        id: variables.postId,
      },
    ];
    queryClient.setQueryData<Post>(postQueryKey, (oldData) => {
      if (oldData) {
        return produce(oldData, (draftData) => {
          draftData.title = data.title;
          draftData.content = data.content;
        });
      }
      return oldData;
    });
  },
});
