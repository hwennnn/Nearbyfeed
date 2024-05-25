/* eslint-disable react/no-unstable-nested-components */
import 'reflect-metadata';

import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { useNavigation } from '@react-navigation/native';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { showMessage } from 'react-native-flash-message';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAddPost } from '@/api';
import type { VotingLengthOption } from '@/screens/feed/poll-voting-length-item';
import {
  DEFAULT_VOTING_LENGTH_OPTION,
  PollVotingLengthItem,
} from '@/screens/feed/poll-voting-length-item';
import {
  ActivityIndicator,
  colors,
  ControlledInput,
  HeaderButton,
  Image,
  Pressable,
  ScrollView,
  showErrorMessage,
  Text,
  TouchableOpacity,
  View,
} from '@/ui';
import Divider from '@/ui/core/divider';
import { Layout } from '@/ui/core/layout';
import { ScrollLayout } from '@/ui/core/scroll-layout';
import { FontAwesome5, Ionicons } from '@/ui/icons/ionicons';
import { ImageViewer } from '@/ui/image-viewer';
import { retrieveCurrentPosition } from '@/utils/geolocation-utils';
import { checkFileSize } from '@/utils/image-utils';

export class CreatePostDto {
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

  @IsOptional()
  @ValidateIf(
    (_object, value) =>
      value !== undefined && value !== null && value.length !== 0
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PollOptionDto)
  @ArrayMinSize(2, { message: 'The poll must have at least two options.' })
  @ArrayMaxSize(7)
  options: PollOptionDto[];
}

class PollOptionDto {
  @IsString()
  @Length(1, 70, {
    message: 'The option must not be empty.',
  })
  @Transform(({ value }) => value?.trim())
  value: string;
}

const resolver = classValidatorResolver(CreatePostDto);

export const AddFeed = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? 'text-neutral-400' : 'text-neutral-500';

  const [imageModalIndex, setImageModalIndex] = React.useState<
    number | undefined
  >(undefined);
  const [isPollEnabled, setIsPollEnabled] = React.useState(false);
  const [selectedVotingLength, setSelectedVotingLength] =
    React.useState<VotingLengthOption>(DEFAULT_VOTING_LENGTH_OPTION);

  const { control, handleSubmit, register, unregister } =
    useForm<CreatePostDto>({
      resolver,
      mode: 'onSubmit',
      defaultValues: {
        options: [
          {
            value: '',
          },
          {
            value: '',
          },
        ],
      },
      shouldUnregister: true,
    });

  const { fields, append, remove } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormProvider)
    name: `options`,
  });

  React.useEffect(() => {
    if (isPollEnabled) {
      register('options');
    } else {
      unregister('options');
    }
  }, [isPollEnabled, register, unregister]);

  const { mutate: addPost, isLoading } = useAddPost();
  const [images, setImages] = React.useState<ImagePicker.ImagePickerAsset[]>(
    []
  );

  const navigation = useNavigation();

  const onSubmit = React.useCallback(
    async (data: CreatePostDto) => {
      const location = await retrieveCurrentPosition();
      if (location === null) {
        showErrorMessage('Location must be enabled to create a post.');
        return;
      }

      const dto = {
        title: data.title.trim(),
        content: data.content?.trim(),
        ...location,
        images,
        options: isPollEnabled
          ? data.options.map((option) => option.value.trim())
          : undefined,
        votingLength: isPollEnabled ? selectedVotingLength.value : undefined,
      };

      addPost(dto, {
        onSuccess: () => {
          showMessage({
            message: 'Feed added successfully',
            type: 'success',
          });
          navigation.goBack();
        },
        onError: () => {
          showErrorMessage(
            'There is an error while adding feed. Please try again later.'
          );
        },
      });
    },
    [addPost, images, isPollEnabled, navigation, selectedVotingLength]
  );

  const pickImage = async () => {
    // No permissions request is necessary for launching the images library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [4, 3],
      quality: 0.2,
      selectionLimit: 5 - images.length,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      let isValid = true;
      for (const asset of result.assets) {
        const fileSize = await checkFileSize(asset.uri);
        if (fileSize === null || fileSize > 5 * 1024 * 1024) {
          showErrorMessage(
            'The images is too large. Please select a smaller images.'
          );
          isValid = false;
          break;
        }
      }

      if (isValid) {
        setImages((prevImages) => prevImages.concat(result.assets));
      }
    }
  };

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
              Post
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
          />

          {images.length > 0 && (
            <View className="my-4 flex-1 flex-row">
              <ScrollView
                showsHorizontalScrollIndicator={false}
                className="flex-1 flex-row space-x-3"
                horizontal={true}
              >
                {images.map((image, index) => (
                  <TouchableOpacity
                    className="h-[150px] w-[150px]"
                    key={index}
                    onPress={() => setImageModalIndex(index)}
                  >
                    <Image
                      source={{ uri: image.uri }}
                      className="h-full w-full"
                    />

                    <Pressable
                      className="absolute top-2 right-2 rounded-full border bg-black"
                      onPress={() =>
                        setImages((currImages) =>
                          currImages.filter(
                            (_, currIndex) => currIndex !== index
                          )
                        )
                      }
                    >
                      <Ionicons name="close" color="white" size={16} />
                    </Pressable>
                  </TouchableOpacity>
                ))}

                {images.length !== 5 && (
                  <TouchableOpacity
                    onPress={pickImage}
                    className="h-[150px] w-[150px] items-center justify-center border-[1px] border-dotted border-charcoal-700 dark:border-white"
                  >
                    <Icon name="add" color={colors.primary[400]} size={48} />
                  </TouchableOpacity>
                )}
              </ScrollView>

              <ImageViewer
                images={images.map((image) => ({
                  uri: image.uri,
                }))}
                visible={imageModalIndex !== undefined}
                onClose={() => setImageModalIndex(undefined)}
                imageIndex={imageModalIndex}
              />
            </View>
          )}

          <ControlledInput
            name="content"
            placeholder="Elaborate more content on what you want to share..."
            className="border-none text-[16px] dark:text-charcoal-100"
            control={control}
            multiline
            maxLength={1000}
          />

          {isPollEnabled && (
            <View className="flex-1 flex-col space-y-1">
              <View className="mt-4 flex-1 space-y-2 rounded-lg border-[0.5px] bg-charcoal-850 p-4">
                <View className="flex-1 flex-row">
                  <View className="flex-1 flex-row items-center space-x-2">
                    <FontAwesome5
                      name="poll-h"
                      size={20}
                      className={iconColor}
                    />

                    <Text
                      className="font-semibold text-gray-600 dark:text-gray-300"
                      variant="sm"
                    >
                      Poll ends in
                    </Text>

                    <PollVotingLengthItem
                      selectedOption={selectedVotingLength}
                      onSelectCallback={(option) =>
                        setSelectedVotingLength(option as VotingLengthOption)
                      }
                    />
                  </View>

                  <Pressable
                    className="items-end"
                    onPress={() => setIsPollEnabled(false)}
                  >
                    <Ionicons size={30} name="close" className={iconColor} />
                  </Pressable>
                </View>

                <View className="flex-1 space-y-2">
                  {fields.map((field, index) => {
                    return (
                      <ControlledInput
                        key={field.id}
                        name={`options.${index}.value`}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 text-[16px] dark:text-charcoal-100"
                        control={control}
                        multiline
                        maxLength={70}
                        rightIcon={
                          index <= 1 ? (
                            <View />
                          ) : (
                            <Pressable onPress={() => remove(index)}>
                              <Ionicons
                                size={20}
                                name="close"
                                className={`${iconColor} items-end`}
                              />
                            </Pressable>
                          )
                        }
                      />
                    );
                  })}

                  {fields.length < 7 && (
                    <TouchableOpacity
                      onPress={() => {
                        append({
                          value: '',
                        });
                      }}
                    >
                      <Text
                        className="font-semibold text-primary-400"
                        variant="sm"
                      >
                        Add Option
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollLayout>

      <View className="absolute bottom-0 z-50 h-fit w-full bg-charcoal-950 px-4">
        <Divider />
        <View className="mx-4 mb-6 mt-2 flex-row space-x-6">
          <Pressable onPress={pickImage}>
            <FontAwesome5 name="images" size={24} className={iconColor} />
          </Pressable>

          <Pressable onPress={() => setIsPollEnabled((value) => !value)}>
            <FontAwesome5
              name="poll-h"
              size={24}
              className={`${iconColor} ${isPollEnabled ? 'opacity-50' : ''}`}
            />
          </Pressable>
        </View>
      </View>
    </Layout>
  );
};
