import 'reflect-metadata';

import { useActionSheet } from '@expo/react-native-action-sheet';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
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
import * as React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Keyboard } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { useAddPost } from '@/api';
import { useTheme } from '@/core';
import { setAppLoading } from '@/core/loading';
import type { RootNavigatorProp } from '@/navigation';
import type { VotingLengthOption } from '@/screens/feed/poll-voting-length-item';
import {
  DEFAULT_VOTING_LENGTH_OPTION,
  PollVotingLengthItem,
} from '@/screens/feed/poll-voting-length-item';
import { SearchPlacesBottomSheet } from '@/screens/feed/search-places-bottom-sheet';
import {
  ActivityIndicator,
  ControlledInput,
  Header,
  Image,
  Pressable,
  ScrollView,
  showErrorMessage,
  Text,
  TouchableOpacity,
  View,
} from '@/ui';
import { Layout } from '@/ui/core/layout';
import { ScrollLayout } from '@/ui/core/scroll-layout';
import { Ionicons, MaterialIcons } from '@/ui/icons/vector-icons';
import { ImageViewer } from '@/ui/image-viewer';
import { promptSignIn } from '@/utils/auth-utils';
import type { GooglePlaceLocation } from '@/utils/geolocation-utils';
import {
  calculateDistance,
  retrieveCurrentPosition,
} from '@/utils/geolocation-utils';
import { checkFileSize } from '@/utils/image-utils';
import {
  requestCameraPermission,
  requestMediaLibraryPermission,
} from '@/utils/permission-utils';

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
  const [imageModalIndex, setImageModalIndex] = React.useState<
    number | undefined
  >(undefined);
  const [isPollEnabled, setIsPollEnabled] = React.useState(false);
  const [selectedVotingLength, setSelectedVotingLength] =
    React.useState<VotingLengthOption>(DEFAULT_VOTING_LENGTH_OPTION);
  const [selectedLocation, setSelectedLocation] =
    React.useState<GooglePlaceLocation | null>(null);

  const { control, handleSubmit, register, unregister, setFocus } =
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

  const { navigate: navigateRoot } = useNavigation<RootNavigatorProp>();

  const onSubmit = React.useCallback(
    async (data: CreatePostDto) => {
      const shouldProceed = promptSignIn(() => {
        navigateRoot('Auth', {
          screen: 'AuthOnboarding',
          params: {
            isCloseButton: true,
          },
        });
      });

      if (!shouldProceed) return;

      const location = await retrieveCurrentPosition();
      if (location === null) {
        showErrorMessage('Location must be enabled to create a post.');
        return;
      }

      if (selectedLocation !== null) {
        const distance = calculateDistance(location, selectedLocation);
        if (distance > 2) {
          showErrorMessage(
            'Please re-select a location near you. The location seems too far away.'
          );
          return;
        }
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
        location: selectedLocation,
      };

      Keyboard.dismiss();
      setAppLoading(true, 'Creating...');

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
        onSettled: () => {
          setAppLoading(false);
        },
      });
    },
    [
      addPost,
      images,
      isPollEnabled,
      navigateRoot,
      navigation,
      selectedLocation,
      selectedVotingLength.value,
    ]
  );

  const { showActionSheetWithOptions } = useActionSheet();

  const onPressAddImageActionSheet = () => {
    const options = ['Take a Photo', 'Choose from Gallery', 'Cancel'];
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        userInterfaceStyle: useTheme.getState().colorScheme,
        options,
        cancelButtonIndex,
        title: 'Add Images',
      },
      (selectedIndex: number | undefined) => {
        switch (selectedIndex) {
          case 0:
            takePhoto();
            break;

          case 1:
            pickImage();
            break;

          case cancelButtonIndex:
          default:
            break;
        }
      }
    );
  };

  const takePhoto = async () => {
    const hasCameraPermission = await requestCameraPermission();
    if (!hasCameraPermission) return;

    let result = await ImagePicker.launchCameraAsync({
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
            'The images is too large. Please select smaller images.'
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

  const pickImage = async () => {
    const hasMediaLibraryPermission = await requestMediaLibraryPermission();
    if (!hasMediaLibraryPermission) return;

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
            'The images is too large. Please select smaller images.'
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

  const renderHeaderRight = React.useCallback(() => {
    return (
      <HeaderRight
        isLoading={isLoading}
        onPressSubmit={handleSubmit(onSubmit)}
      />
    );
  }, [handleSubmit, isLoading, onSubmit]);

  const placesRef = React.useRef<BottomSheetModal>(null);

  const openPlacesSheet = React.useCallback(
    () => placesRef.current?.present(),
    []
  );

  const closePlacesSheet = React.useCallback(
    () => placesRef.current?.dismiss(),
    []
  );

  const handleLocationCallback = (location: GooglePlaceLocation | null) => {
    closePlacesSheet();
    setSelectedLocation(location);
  };

  return (
    <Layout className="flex-1" hasHorizontalPadding={false} verticalPadding={0}>
      <Header
        headerTitle="Create a Feed"
        isDisabledBack={isLoading}
        headerRight={renderHeaderRight()}
      />

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
                    className="absolute right-2 top-2 rounded-full border bg-black"
                    onPress={() =>
                      setImages((currImages) =>
                        currImages.filter((_, currIndex) => currIndex !== index)
                      )
                    }
                  >
                    <Ionicons name="close" color="white" size={16} />
                  </Pressable>
                </TouchableOpacity>
              ))}

              {images.length !== 5 && (
                <TouchableOpacity
                  onPress={onPressAddImageActionSheet}
                  className="h-[150px] w-[150px] items-center justify-center border border-dashed border-charcoal-700 dark:border-white"
                >
                  <Ionicons
                    name="add"
                    className="text-charcoal-400"
                    size={48}
                  />
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

          <ControlledInput
            name="content"
            placeholder="Elaborate more content on what you want to share..."
            className="border-none text-[16px] dark:text-charcoal-100"
            control={control}
            multiline
            maxLength={1000}
            returnKeyType={isPollEnabled ? 'next' : 'send'}
            blurOnSubmit={true}
            onSubmitEditing={(event) => {
              event.preventDefault();
              if (isPollEnabled) {
                setFocus('options.0.value');
              } else {
                if (!isLoading) {
                  handleSubmit(onSubmit)(event);
                }
              }
            }}
          />

          <TouchableOpacity
            className="mt-4 flex-1 flex-row items-center justify-between"
            onPress={openPlacesSheet}
          >
            <View className="flex-row space-x-3">
              <Ionicons
                name="location-sharp"
                size={24}
                className="text-black dark:text-charcoal-100"
              />
              <Text
                className={`font-medium ${
                  selectedLocation === null
                    ? 'dark:text-charcoal-100'
                    : 'text-primary-400 dark:text-primary-500'
                }`}
                variant="md"
              >
                {selectedLocation !== null
                  ? selectedLocation.name
                  : 'Add a specific location'}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              className="text-black dark:text-charcoal-100"
            />
          </TouchableOpacity>

          <SearchPlacesBottomSheet
            ref={placesRef}
            onLocationSelect={handleLocationCallback}
          />

          <TouchableOpacity
            className="mt-6 flex-1 flex-row items-center justify-between"
            onPress={() => setIsPollEnabled((prevState) => !prevState)}
          >
            <View className="flex-row space-x-3">
              <MaterialIcons
                name="poll"
                size={24}
                className="rotate-90 text-black dark:text-charcoal-100"
              />
              <Text
                className={`font-medium dark:text-charcoal-100`}
                variant="md"
              >
                Start a Poll
              </Text>
            </View>
            <Ionicons
              name={isPollEnabled ? 'chevron-up' : 'chevron-down'}
              size={24}
              className="text-neutral-600 dark:text-neutral-300"
            />
          </TouchableOpacity>

          {isPollEnabled && (
            <View className="mt-2 flex-1 flex-col space-y-1">
              <View className="mt-4 flex-1 space-y-2 rounded-lg border-[0.5px] border-neutral-300 bg-neutral-100 p-4 dark:border-charcoal-850 dark:bg-charcoal-850">
                <View className="flex-1 flex-row">
                  <View className="flex-1 flex-row items-center space-x-2">
                    <Text
                      className="font-semibold text-neutral-600 dark:text-gray-300"
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
                        returnKeyType={
                          index !== fields.length - 1 ? 'next' : 'send'
                        }
                        blurOnSubmit={true}
                        onSubmitEditing={(event) => {
                          event.preventDefault();
                          if (index !== fields.length - 1) {
                            setFocus(`options.${index + 1}.value`);
                          } else {
                            if (!isLoading) {
                              handleSubmit(onSubmit)(event);
                            }
                          }
                        }}
                        rightIcon={
                          index <= 1 ? (
                            <View />
                          ) : (
                            <TouchableOpacity onPress={() => remove(index)}>
                              <Ionicons
                                size={20}
                                name="close"
                                className={`items-end text-neutral-500 dark:text-neutral-400`}
                              />
                            </TouchableOpacity>
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
    </Layout>
  );
};

const HeaderRight = ({
  isLoading,
  onPressSubmit,
}: {
  isLoading: boolean;
  onPressSubmit: () => void;
}) => {
  return (
    <TouchableOpacity onPress={onPressSubmit} disabled={isLoading}>
      {isLoading ? (
        <ActivityIndicator size="small" />
      ) : (
        <Text variant="md" className="font-semibold text-primary-400">
          Post
        </Text>
      )}
    </TouchableOpacity>
  );
};
