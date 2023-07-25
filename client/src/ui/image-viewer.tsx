import * as React from 'react';
import ImageView from 'react-native-image-viewing';

type ImageProps = {
  uri: string;
};
type ImageViewerProps = {
  visible: boolean;
  images: ImageProps[];
  onClose: () => void;
};

export const ImageViewer = ({ visible, images, onClose }: ImageViewerProps) => {
  return (
    <ImageView
      images={images}
      imageIndex={0}
      visible={visible}
      onRequestClose={onClose}
    />
  );
};
