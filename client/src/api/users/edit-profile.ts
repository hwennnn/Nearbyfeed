import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client, queryClient } from '../common';
import type { User } from '../types';

type Variables = {
  username: string;
  image: string | null;
  shouldSetImageNull?: boolean;
  userId: number;
};
type Context = {
  previousUser: User;
  newUser: Variables;
};

export const useEditProfile = createMutation<
  Response,
  Variables,
  AxiosError,
  Context
>({
  mutationFn: async (variables) => {
    const needUploadImage = variables.image !== null;
    let formData;
    let dto;

    if (needUploadImage) {
      formData = new FormData();
      if (variables.image !== null) {
        formData.append('image', {
          uri: variables.image,
          type: 'image',
          name: 'photo.jpg',
        } as any);
      }

      formData.append('username', variables.username);
    } else {
      dto = {
        username: variables.username,
      };

      if (variables.shouldSetImageNull === true) {
        dto = {
          ...dto,
          shouldSetImageNull: true,
        };
      }
    }

    console.log(needUploadImage ? formData : dto);

    const response = await client({
      url: `users/${variables.userId}`,
      method: 'PATCH',
      data: needUploadImage ? formData : dto,
      headers: {
        'Content-Type': needUploadImage
          ? 'multipart/form-data'
          : 'application/json',
      },
    }).catch((error) => {
      return Promise.reject(error);
    });

    return response.data;
  },
  onSettled: (_) => {
    queryClient.invalidateQueries(['self']);
  },
});
