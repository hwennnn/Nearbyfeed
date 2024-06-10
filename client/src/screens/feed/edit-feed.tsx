/* eslint-disable react/no-unstable-nested-components */

import 'reflect-metadata';

import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, ValidateIf } from 'class-validator';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Keyboard } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { useEditPost } from '@/api';
import { setAppLoading } from '@/core/loading';
import type { RootStackParamList } from '@/navigation';
import {
  ActivityIndicator,
  ControlledInput,
  HeaderButton,
  showErrorMessage,
  Text,
  TouchableOpacity,
  View,
} from '@/ui';
import { Layout } from '@/ui/core/layout';
import { ScrollLayout } from '@/ui/core/scroll-layout';

export class EditPostDto {
  @IsString()
  @Length(4, 70, {
    message: 'Title must have at least 4 characters.',
  })
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsOptional()
  @ValidateIf(
    (_object, value) =>
      value !== undefined &&
      value !== null &&
      typeof value === 'string' &&
      value.length > 0
  )
  @IsString()
  @Length(15, 1000, {
    message: 'Content must have at least 15 characters.',
  })
  @Transform(({ value }) => value?.trim())
  content?: string;
}

const resolver = classValidatorResolver(EditPostDto);

type Props = RouteProp<RootStackParamList, 'EditFeed'>;

export const EditFeed = () => {
  const { params: props } = useRoute<Props>();

  const { control, handleSubmit, setFocus } = useForm<EditPostDto>({
    resolver,
    mode: 'onSubmit',
    defaultValues: {
      title: props.title,
      content: props.content,
    },
    shouldUnregister: true,
  });

  const { mutate: editPost, isLoading } = useEditPost();

  const navigation = useNavigation();

  const onSubmit = React.useCallback(
    async (data: EditPostDto) => {
      const dto = {
        title: data.title.trim(),
        content: data.content?.trim(),
      };

      Keyboard.dismiss();
      setAppLoading(true, 'Submitting...');

      editPost(
        {
          ...dto,
          postId: props.postId,
        },
        {
          onSuccess: () => {
            showMessage({
              message: 'Feed updated successfully',
              type: 'success',
            });
            navigation.goBack();
          },
          onError: () => {
            showErrorMessage(
              'There is an error while adding feed. Please try again later.'
            );
          },
          onSettled: () => {
            setAppLoading(false);
          },
        }
      );
    },
    [editPost, navigation, props.postId]
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderButton iconName="close-outline" disabled={isLoading} />
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text variant="md" className="font-semibold text-primary-400">
              Submit
            </Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [handleSubmit, isLoading, navigation, onSubmit]);

  return (
    <Layout
      className="flex-1"
      hasHorizontalPadding={false}
      verticalPadding={80}
    >
      <ScrollLayout
        className="flex-1"
        showsVerticalScrollIndicator={false}
        extraScrollHeight={25}
      >
        <View className="flex-1 p-4">
          <ControlledInput
            name="title"
            control={control}
            placeholder="Write a specific title"
            className="border-none text-[24px] font-bold dark:text-charcoal-100"
            numberOfLines={3}
            maxLength={70}
            multiline
            returnKeyType="next"
            blurOnSubmit={true}
            onSubmitEditing={() => setFocus('content')}
          />

          <ControlledInput
            name="content"
            placeholder="Elaborate more content on what you want to share..."
            className="border-none text-[16px] dark:text-charcoal-100"
            control={control}
            multiline
            maxLength={1000}
            returnKeyType={'send'}
            blurOnSubmit={true}
            onSubmitEditing={(event) => {
              event.preventDefault();
              if (!isLoading) {
                handleSubmit(onSubmit)(event);
              }
            }}
          />
        </View>
      </ScrollLayout>
    </Layout>
  );
};
