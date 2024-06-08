import * as React from 'react';
import ImageView from 'react-native-image-viewing';

import { Text, View } from '@/ui/core';

type ImageProps = {
  uri: string;
};

type ImageViewerProps = {
  visible: boolean;
  images: ImageProps[];
  onClose: () => void;
  imageIndex?: number;
};

const Footer = ({ index, length }: { index: number; length: number }) => {
  return (
    <View className="flex-row items-center justify-center pb-12">
      <Text className="font-semibold text-white">
        {`${index + 1} / ${length}`}
      </Text>
    </View>
  );
};

export const ImageViewer = ({
  visible,
  images,
  onClose,
  imageIndex = 0,
}: ImageViewerProps) => {
  const renderFooter = (index: number) => {
    return <Footer index={index} length={images.length} />;
  };

  return (
    <ImageView
      images={images}
      imageIndex={imageIndex}
      visible={visible}
      onRequestClose={onClose}
      FooterComponent={({ imageIndex: footerIndex }) =>
        renderFooter(footerIndex)
      }
    />
  );
};
