import type { AxiosError } from 'axios';
import type * as ImagePicker from 'expo-image-picker';
import { createMutation } from 'react-query-kit';

import { usePostKeys } from '@/core/posts';

import { client, queryClient } from '../common';
import type { Post } from '../types';

type Variables = {
  title: string;
  content?: string;
  latitude: number;
  longitude: number;
  image: ImagePicker.ImagePickerAsset | null;
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
  previousPosts?: InfinitePosts[];
  newPost: Variables;
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
  onMutate: async (newPost) => {
    const queryKey = ['posts', usePostKeys.getState().postsQueryKey];

    // Cancel any outgoing refetches
    // (so they don't overwrite our optimistic update)
    await queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previousPosts = queryClient.getQueryData<InfinitePosts[]>(queryKey);

    const optimisticPost: Post = {
      id: new Date().getTime(),
      title: newPost.title,
      content: newPost.content,
      longitude: newPost.longitude,
      latitude: newPost.longitude,
      points: 0,
      isOptimistic: true,
    };

    // Update the cache optimistically by adding the new post to the existing list
    queryClient.setQueryData<InfinitePosts>(queryKey, (oldData) => {
      if (oldData) {
        const updatedPage = {
          ...oldData.pages[0],
          posts: [optimisticPost, ...oldData.pages[0].posts],
        };

        return {
          pageParams: oldData.pageParams,
          pages: [updatedPage, ...oldData.pages.slice(1)],
        };
      }
      return oldData;
    });
    // Return a context with the previous and new todo
    return { previousPosts, newPost };
  },

  // If the mutation fails, use the context we returned above
  onError: (_err, _newPost, context) => {
    const queryKey = ['posts', usePostKeys.getState().postsQueryKey];

    queryClient.setQueryData<InfinitePosts[]>(queryKey, context?.previousPosts);
  },
  // Always refetch after error or success:
  onSettled: (_) => {
    queryClient.invalidateQueries(['posts']);
  },
});
