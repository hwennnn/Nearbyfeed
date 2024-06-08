import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { useNavigation } from '@react-navigation/native';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Keyboard } from 'react-native';

import { useAddReply } from '@/api/posts/use-add-reply';
import type { RootNavigatorProp } from '@/navigation';
import { ControlledInput, Ionicons, Pressable, View } from '@/ui';
import { promptSignIn } from '@/utils/auth-utils';

export class CreateCommentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  @Transform(({ value }: { value: string }) => value.trim())
  content: string;
}

const resolver = classValidatorResolver(CreateCommentDto);

type Props = { postId: number; commentId: number };

export const ReplyComposer = ({ postId, commentId }: Props) => {
  const { control, handleSubmit, reset, formState } = useForm<CreateCommentDto>(
    {
      defaultValues: {
        content: '',
      },
      reValidateMode: 'onChange',
      resolver,
    }
  );

  const isFormValid = formState.isValid;

  const { mutate: addComment, isLoading: isCreateCommentLoading } =
    useAddReply();

  const { navigate: navigateRoot } = useNavigation<RootNavigatorProp>();

  const onSubmitComment = (dto: CreateCommentDto) => {
    Keyboard.dismiss();

    const shouldProceed = promptSignIn(() => {
      navigateRoot('Auth', {
        screen: 'AuthOnboarding',
        params: {
          isCloseButton: true,
        },
      });
    });

    if (!shouldProceed) return;

    reset();

    dto.content = dto.content.trim();

    addComment(
      { ...dto, postId, commentId }
      // TODO: Flash message is underneath the modal
      // {
      //   onSuccess: () => {
      //     showSuccessMessage('Reply added successfully');
      //   },
      //   onError: () => {
      //     showErrorMessage('Error adding reply');
      //   },
      // }
    );
  };

  return (
    <View className="flex-1 p-4">
      <ControlledInput
        error={undefined}
        disabled={isCreateCommentLoading}
        name="content"
        placeholder="Write a reply."
        control={control}
        returnKeyType="send"
        onSubmitEditing={(event) => {
          event.preventDefault();
          if (!isCreateCommentLoading) {
            handleSubmit(onSubmitComment)(event);
          }
        }}
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
