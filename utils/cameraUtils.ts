import { MediaItem } from '~/context/CameraContext';

export const calculateCenterCrop = (media: MediaItem, targetRatio: number) => {
  const naturalWidth = media.cropData?.naturalWidth ?? media.width;
  const naturalHeight = media.cropData?.naturalHeight ?? media.height;

  // If we don't have dimensions, return null or default
  if (!naturalWidth || !naturalHeight) return null;

  let cropWidth = naturalWidth;
  let cropHeight = cropWidth / targetRatio;

  if (cropHeight > naturalHeight) {
    cropHeight = naturalHeight;
    cropWidth = cropHeight * targetRatio;
  }

  const x = (naturalWidth - cropWidth) / 2;
  const y = (naturalHeight - cropHeight) / 2;

  return {
    x,
    y,
    width: cropWidth,
    height: cropHeight,
    zoom: 1,
    naturalWidth,
    naturalHeight,
  };
};
