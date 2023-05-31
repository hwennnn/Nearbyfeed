import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { useNavigation } from '@react-navigation/native';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import * as ImagePicker from 'expo-image-picker';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { showMessage } from 'react-native-flash-message';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAddPost } from '@/api';
import {
  Button,
  ControlledInput,
  Image,
  showErrorMessage,
  TouchableOpacity,
  View,
} from '@/ui';
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
  content?: string;
}

const resolver = classValidatorResolver(CreatePostDto);

export const AddPost = () => {
  const { control, handleSubmit } = useForm<CreatePostDto>({
    resolver,
  });
  const { mutate: addPost, isLoading } = useAddPost();
  const [image, setImage] = React.useState<ImagePicker.ImagePickerAsset | null>(
    null
  );

  const { goBack } = useNavigation();

  const onSubmit = async (data: CreatePostDto) => {
    const location = await retrieveCurrentPosition();
    if (location === null) {
      showErrorMessage('Location must be enabled to create a post.');
      return;
    }

    addPost(
      { ...data, ...location, image },
      {
        onSuccess: () => {
          showMessage({
            message: 'Post added successfully',
            type: 'success',
          });
          goBack();
        },
        onError: () => {
          showErrorMessage('Error adding post');
        },
      }
    );
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      selectionLimit: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  return (
    <View className="flex-1  p-4">
      {image !== null && (
        <Image
          source={{ uri: image.uri }}
          style={{ width: 200, height: 200 }}
        />
      )}

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

      <View className="flex-row space-x-3">
        <TouchableOpacity onPress={pickImage} className="flex">
          <Icon name="images" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
