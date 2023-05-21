import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { useQueryClient } from '@tanstack/react-query';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { showMessage } from 'react-native-flash-message';

import { useAddPost, usePosts } from '@/api';
import { Button, ControlledInput, showErrorMessage, View } from '@/ui';
import { retrieveCurrentPosition } from '@/utils/geolocation-utils';

export class CreatePostDto {
  @IsString()
  @MinLength(4)
  @MaxLength(25)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(15)
  @MaxLength(100)
  content: string;
}

const resolver = classValidatorResolver(CreatePostDto);

export const AddPost = () => {
  const { control, handleSubmit } = useForm<CreatePostDto>({
    resolver,
  });
  const { mutate: addPost, isLoading } = useAddPost();
  const queryClient = useQueryClient();

  const onSubmit = async (data: CreatePostDto) => {
    const location = await retrieveCurrentPosition();
    if (location === null) {
      showErrorMessage('Location must be enabled to create a post.');
      return;
    }

    addPost(
      { ...data, ...location },
      {
        onSuccess: () => {
          showMessage({
            message: 'Post added successfully',
            type: 'success',
          });
          // here you can navigate to the post list and refresh the list data
          queryClient.invalidateQueries(usePosts.getKey());
        },
        onError: () => {
          showErrorMessage('Error adding post');
        },
      }
    );
  };
  return (
    <View className="flex-1 p-4 ">
      <ControlledInput name="title" label="Title" control={control} />
      <ControlledInput
        name="content"
        label="Content"
        control={control}
        multiline
      />
      <Button
        label="Add Post"
        loading={isLoading}
        onPress={handleSubmit(onSubmit)}
      />
    </View>
  );
};
