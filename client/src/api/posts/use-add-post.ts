import type { AxiosError } from 'axios';
import type * as ImagePicker from 'expo-image-picker';
import { produce } from 'immer';
import { createMutation } from 'react-query-kit';

import { usePostKeys } from '@/core/posts';
import { useUser } from '@/core/user';

import { client, queryClient } from '../common';
import type { Post, User } from '../types';

type Variables = {
  title: string;
  content?: string;
  latitude: number;
  longitude: number;
  image: ImagePicker.ImagePickerAsset | null;
  votingLength?: number;
  options?: string[];
};
type Response = Post;
type PostsResponse = {
  posts: Post[];
  hasMore: boolean;
};
export type InfinitePosts = {
  pages: PostsResponse[];
  pageParams: unknown[];
};
type Context = {
  previousPosts?: InfinitePosts;
  variables: Variables;
  optimisticPostId: number;
};

export const useAddPost = createMutation<
  Response,
  Variables,
  AxiosError,
  Context
>({
  mutationFn: async (variables) => {
    const formData = new FormData();
    if (variables.image !== null) {
      formData.append('image', {
        uri: variables.image.uri,
        type: 'image',
        name: variables.image.fileName ?? 'photo.jpg',
      } as any);
    }

    formData.append('title', variables.title);
    if (variables.content) {
      formData.append('content', variables.content);
    }
    formData.append('latitude', variables.latitude.toString());
    formData.append('longitude', variables.longitude.toString());

    if (
      variables.options !== undefined &&
      variables.votingLength !== undefined
    ) {
      for (const option of variables.options) {
        formData.append('poll[options][]', option);
      }
      formData.append('poll[votingLength]', variables.votingLength.toString());
    }

    const response = await client({
      url: 'posts',
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    }).catch((error) => {
      return Promise.reject(error);
    });

    return response.data;
  },
  onMutate: async (variables) => {
    const queryKey = ['posts', usePostKeys.getState().postsQueryKey];

    // Cancel any outgoing refetches
    // (so they don't overwrite our optimistic update)
    await queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previousPosts = queryClient.getQueryData<InfinitePosts>(queryKey);
    const optimisticPostId = new Date().getTime();
    const currentUser = useUser.getState().user as User;

    const optimisticPost: Post = {
      id: optimisticPostId,
      title: variables.title,
      content: variables.content,
      longitude: variables.longitude,
      latitude: variables.longitude,
      points: 0,
      isOptimistic: true,
      commentsCount: 0,
      author: currentUser,
      authorId: currentUser.id,
      poll: null,
    };

    // Update the cache optimistically by adding the new post to the existing list
    queryClient.setQueryData<InfinitePosts>(queryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: produce(oldData.pages, (draftPages) => {
            draftPages[0].posts.unshift(optimisticPost);
          }),
        };
      }
      return oldData;
    });
    // Return a context with the previous and new todo
    return { previousPosts, variables, optimisticPostId };
  },
  // If the mutation fails, use the context we returned above
  onError: (_err, _newPost, context) => {
    const queryKey = ['posts', usePostKeys.getState().postsQueryKey];

    queryClient.setQueryData<InfinitePosts>(queryKey, context?.previousPosts);
  },
  onSuccess: (data, _variables, context) => {
    const queryKey = ['posts', usePostKeys.getState().postsQueryKey];
    const optimisticPostId = context?.optimisticPostId;

    // Update the cache with the response data from the API
    queryClient.setQueryData<InfinitePosts>(queryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => {
            return produce(page, (draftPage) => {
              const foundIndex = draftPage.posts.findIndex(
                (post) => post.id === optimisticPostId
              );

              if (foundIndex !== -1) {
                draftPage.posts[foundIndex] = data;
              }
            });
          }),
        };
      }
      return oldData;
    });
  },
});
