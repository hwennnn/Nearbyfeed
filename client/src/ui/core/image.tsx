import type { ImageProps } from 'expo-image';
import { Image as NImage } from 'expo-image';
import { styled } from 'nativewind';
import * as React from 'react';

const SImage = styled(NImage);
export type ImgProps = ImageProps & {
  className?: string;
};

export const Image = ({
  style,
  className,
  placeholder = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[',
  ...props
}: ImgProps) => {
  return (
    <SImage
      className={className}
      placeholder={placeholder}
      style={style}
      {...props}
    />
  );
};

export const preloadImages = (sources: string[]) => {
  NImage.prefetch(sources);
};
