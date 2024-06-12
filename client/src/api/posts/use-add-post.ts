import type { AxiosError } from 'axios';
import type * as ImagePicker from 'expo-image-picker';
import { produce } from 'immer';
import { createMutation } from 'react-query-kit';

import { usePostKeys } from '@/core/posts';
import { useUser } from '@/core/user';
import type { GooglePlaceLocation } from '@/utils/geolocation-utils';

import { client, queryClient } from '../common';
import type { Post, User } from '../types';
import type { InfinitePosts } from './types';

type Variables = {
  title: string;
  content?: string;
  latitude: number;
  longitude: number;
  images: ImagePicker.ImagePickerAsset[];
  votingLength?: number;
  options?: string[];
  location: GooglePlaceLocation | null;
};
type Response = Post;
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
    if (variables.images !== null) {
      for (const image of variables.images) {
        formData.append('images', {
          uri: image.uri,
          type: 'image',
          name: image.fileName ?? 'photo.jpg',
        } as any);
      }
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

    if (variables.location !== null) {
      formData.append('location[name]', variables.location.name);
      formData.append(
        'location[formattedAddress]',
        variables.location.formattedAddress
      );
      formData.append(
        'location[latitude]',
        variables.location.latitude.toString()
      );
      formData.append(
        'location[longitude]',
        variables.location.longitude.toString()
      );
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
    const postsQueryKey = ['posts', usePostKeys.getState().postsQueryKey];
    await queryClient.cancelQueries({ queryKey: postsQueryKey });
    const previousPosts =
      queryClient.getQueryData<InfinitePosts>(postsQueryKey);

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
    queryClient.setQueryData<InfinitePosts>(postsQueryKey, (oldData) => {
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
    const postsQueryKey = ['posts', usePostKeys.getState().postsQueryKey];

    queryClient.setQueryData<InfinitePosts>(
      postsQueryKey,
      context?.previousPosts
    );
  },
  onSuccess: (data, _variables, context) => {
    console.log('🚀 ~ data:', data);
    const postsQueryKey = ['posts', usePostKeys.getState().postsQueryKey];
    const optimisticPostId = context?.optimisticPostId;

    // Update the cache with the response data from the API
    queryClient.setQueryData<InfinitePosts>(postsQueryKey, (oldData) => {
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

    // Update the my-posts cache by adding the new post to the existing list
    const myPostsQueryKey = ['my-posts', {}];
    queryClient.setQueryData<InfinitePosts>(myPostsQueryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: produce(oldData.pages, (draftPages) => {
            draftPages[0].posts.unshift(data);
          }),
        };
      }
      return oldData;
    });
  },
});
