import { View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useMemo } from 'react';
import { MediaItem, useCameraContext } from '~/context/CameraContext';
import { EditableImage } from '~/components/camera/EditableImage';
import GlassView, { GlassOverlay } from '../custom/GlassView';

export default function MainMedia({
  currentIndex,
  width,
  selectedAspectRatio,
  mask,
}: {
  currentIndex: number;
  width: number;
  selectedAspectRatio: number;
  mask?: 'circle' | 'square';
}) {
  const { selectedMedia, setSelectedMedia } = useCameraContext();
  if (selectedMedia.length === 0 || !selectedMedia[currentIndex]) {
    return null;
  }

  const item = selectedMedia[currentIndex];
  // Fixed container aspect ratio (4:5)
  const FIXED_RATIO = 4 / 5;
  const fixedContainerHeight = width / FIXED_RATIO;
  const getAspectRatioValue = (item: MediaItem) => {
    if (selectedAspectRatio === -1) {
      // Calculate natural aspect ratio
      const w = item.cropData?.naturalWidth ?? item.width ?? 1;
      const h = item.cropData?.naturalHeight ?? item.height ?? 1;
      return w / h;
    }
    return selectedAspectRatio;
  };
  // Calculate dimensions for the EditableImage based on selected aspect ratio
  // fitting inside the fixed container (contain)
  const targetRatio = getAspectRatioValue(item);

  let renderWidth = width;
  let renderHeight = width / targetRatio;

  if (renderHeight > fixedContainerHeight) {
    renderHeight = fixedContainerHeight;
    renderWidth = renderHeight * targetRatio;
  }

  const handleCropUpdate = (cropData: any) => {
    const updated = selectedMedia.map((item, index) => {
      if (index !== currentIndex) return item;

      return {
        ...item,
        cropData,
        // We don't update URI here because we are just updating the crop metadata
        // The final crop will be applied when saving/posting
      };
    });

    setSelectedMedia(updated);
  };

  // Calculate the size for circle mask (use the smaller dimension to ensure it fits)
  const circleSize = mask === 'circle' ? Math.min(renderWidth, renderHeight) : null;
  const circleRadius = circleSize ? circleSize / 2 : null;

  // Create video player - always call hook to maintain order
  const player = useVideoPlayer(item.mediaType === 'video' ? item.uri : '', player => {
    if (item.mediaType === 'video') {
      player.loop = true;
      player.muted = true;
    }
  });

  return (
    <View
      style={{ width, height: fixedContainerHeight, }}
      className="relative items-center justify-center overflow-hidden bg-black">
        {item.mediaType === 'video' ? (
          <VideoView
            player={player}
            style={{
              width: renderWidth,
              height: renderHeight,
              borderRadius: mask === 'circle' ? circleRadius || 0 : 0,
            }}
          contentFit="cover"
          allowsPictureInPicture={false}
          />
        ) : (
        <View 
          style={{ 
            width: renderWidth, 
            height: renderHeight, 
            overflow: 'hidden',
            borderRadius: mask === 'circle' ? circleRadius || 0 : 0,
          }}>
          <EditableImage
            uri={item.originalUri ?? item.uri}
            containerWidth={renderWidth}
            containerHeight={renderHeight}
            naturalWidth={item.cropData?.naturalWidth ?? item.width ?? 1000}
            naturalHeight={item.cropData?.naturalHeight ?? item.height ?? 1000}
            cropData={item.cropData}
            onUpdate={handleCropUpdate}
          />
        </View>
      )}
    </View>
  );
}
