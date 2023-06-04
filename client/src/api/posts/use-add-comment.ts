import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client, queryClient } from '../common';
import type { Comment } from '../types';

type Variables = {
  content: string;
  postId: number;
};
type Response = Comment;
type CommentsResponse = {
  comments: Comment[];
  hasMore: boolean;
};
type InfiniteComments = {
  pages: CommentsResponse[];
  pageParams: unknown[];
};
type Context = {
  previousComments?: InfiniteComments[];
  newComment: Variables;
};

export const useAddComment = createMutation<
  Response,
  Variables,
  AxiosError,
  Context
>({
  mutationFn: async (variables) => {
    const response = await client({
      url: `posts/${variables.postId}/comments`,
      method: 'POST',
      data: {
        content: variables.content,
      },
    }).catch((error) => {
      return Promise.reject(error);
    });

    return response.data;
  },
  // onMutate: async (newComment) => {
  //   const queryKey = [
  //     'comments',
  //     {
  //       postId: newComment.postId,
  //       sort: 'latest',
  //     },
  //   ];

  //   // Cancel any outgoing refetches
  //   // (so they don't overwrite our optimistic update)
  //   await queryClient.cancelQueries({ queryKey });

  //   // Snapshot the previous value
  //   const previousComments =
  //     queryClient.getQueryData<InfiniteComments[]>(queryKey);

  //   const optimisticComment: Comment = {
  //     id: new Date().getTime(),
  //     content: newComment.content,
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     isDeleted: false,
  //     postId: newComment.postId,
  //     authorId: 1,
  //     isOptimistic: true,
  //   };

  //   // Update the cache optimistically by adding the new Comment to the existing list
  //   queryClient.setQueryData<InfiniteComments>(queryKey, (oldData) => {
  //     if (oldData) {
  //       const updatedPage = {
  //         ...oldData.pages[0],
  //         comments: [optimisticComment, ...oldData.pages[0].comments],
  //       };

  //       return {
  //         pageParams: oldData.pageParams,
  //         pages: [updatedPage, ...oldData.pages.slice(1)],
  //       };
  //     }
  //     return oldData;
  //   });
  //   // Return a context with the previous and new todo
  //   return { previousComments, newComment };
  // },

  // // If the mutation fails, use the context we returned above
  // onError: (_err, newComment, context) => {
  //   const queryKey = [
  //     'comments',
  //     {
  //       postId: newComment.postId,
  //       sort: 'latest',
  //     },
  //   ];

  //   queryClient.setQueryData<InfiniteComments[]>(
  //     queryKey,
  //     context?.previousComments
  //   );
  // },
  // Always refetch after error or success:
  onSettled: (_) => {
    queryClient.invalidateQueries(['comments']);
  },
});
