import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import React from 'react';
import { useForm } from 'react-hook-form';
import { showMessage } from 'react-native-flash-message';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useAddComment } from '@/api/posts/use-add-comment';
import { useCommentKeys } from '@/core/comments';
import { ControlledInput, Pressable, showErrorMessage, View } from '@/ui';

export class CreateCommentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  content: string;
}

const resolver = classValidatorResolver(CreateCommentDto);

type Props = { postId: number };

export const CommentComposer = ({ postId }: Props) => {
  const { control, handleSubmit, reset, formState } = useForm<CreateCommentDto>(
    {
      reValidateMode: 'onChange',
      resolver,
    }
  );

  const isFormValid = formState.isValid && formState.isDirty;

  const { mutate: addComment, isLoading: isCreateCommentLoading } =
    useAddComment();

  const onSubmitComment = (dto: CreateCommentDto) => {
    reset();

    const sort = useCommentKeys.getState().commentsQueryKey!.sort;

    addComment(
      { ...dto, postId, sort },
      {
        onSuccess: () => {
          showMessage({
            message: 'Comment added successfully',
            type: 'success',
          });
        },
        onError: () => {
          showErrorMessage('Error adding comment');
        },
      }
    );
  };

  return (
    <View className="flex-1 py-4">
      <ControlledInput
        error={undefined}
        disabled={isCreateCommentLoading}
        name="content"
        placeholder="Write a comment."
        control={control}
        rightIcon={
          <Pressable
            onPress={handleSubmit(onSubmitComment)}
            disabled={!isFormValid}
          >
            <View
              className={`rounded-full ${
                isFormValid ? 'bg-primary-500' : 'bg-charcoal-300'
              } p-2`}
            >
              <Ionicons name="arrow-up" size={20} color="white" />
            </View>
          </Pressable>
        }
      />
    </View>
  );
};
