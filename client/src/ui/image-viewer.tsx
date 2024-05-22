import * as React from 'react';
import ImageView from 'react-native-image-viewing';

type ImageProps = {
  uri: string;
};
type ImageViewerProps = {
  visible: boolean;
  images: ImageProps[];
  onClose: () => void;
  imageIndex?: number;
};

export const ImageViewer = ({
  visible,
  images,
  onClose,
  imageIndex = 0,
}: ImageViewerProps) => {
  return (
    <ImageView
      images={images}
      imageIndex={imageIndex}
      visible={visible}
      onRequestClose={onClose}
    />
  );
};
