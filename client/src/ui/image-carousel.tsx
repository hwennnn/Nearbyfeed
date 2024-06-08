import * as React from 'react';
import { Dimensions, TouchableOpacity } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

import { Image, Text, View } from '@/ui/core';

import { ImageViewer } from './image-viewer';

type ImageCarouselProps = {
  images: string[];
  imageCarouselIndex: number;
  imageModalIndex?: number;
  setImageModalIndex: (index: number | undefined) => void;
  setImageCarouselIndex: (index: number) => void;
};

export const ImageCarousel = ({
  images,
  imageCarouselIndex,
  imageModalIndex,
  setImageModalIndex,
  setImageCarouselIndex,
}: ImageCarouselProps) => {
  const width = Dimensions.get('window').width;
  const height = Dimensions.get('window').height;

  return (
    <View className="mt-1 flex-1 flex-row">
      <View className="absolute right-2 top-2 z-50 rounded-full bg-black px-3 py-1">
        <Text variant="xs" className="font-semibold text-white">{`${
          imageCarouselIndex + 1
        } / ${images.length}`}</Text>
      </View>

      <Carousel
        loop={false}
        width={width - 32}
        height={height / 3}
        data={images}
        onSnapToItem={(index) => setImageCarouselIndex(index)}
        renderItem={({ index }) => (
          <TouchableOpacity
            key={index}
            onPress={() => setImageModalIndex(index)}
            className="flex-1"
          >
            <Image
              className="h-full w-full rounded-md"
              source={{
                uri: images[index],
              }}
              contentFit="cover"
            />
          </TouchableOpacity>
        )}
      />

      <ImageViewer
        images={images.map((url) => ({
          uri: url,
        }))}
        visible={imageModalIndex !== undefined}
        onClose={() => setImageModalIndex(undefined)}
        imageIndex={imageModalIndex}
      />
    </View>
  );
};
